-- Crucible schema — run in Supabase SQL Editor.
-- Every table is owned by a Supabase Auth user (auth.uid()) and protected by Row Level Security.

create extension if not exists "pgcrypto";

-- ============================================================
-- profiles
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  target_role text,
  resume_summary text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- api_keys (BYOK vault — ciphertext only, see server/src/services/crypto.service.js)
-- ============================================================
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gemini', 'openai', 'anthropic')),
  encrypted_key bytea not null,
  iv bytea not null,
  auth_tag bytea not null,
  key_preview text not null,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table api_keys enable row level security;

create policy "api_keys_select_own" on api_keys for select using (auth.uid() = user_id);
create policy "api_keys_insert_own" on api_keys for insert with check (auth.uid() = user_id);
create policy "api_keys_delete_own" on api_keys for delete using (auth.uid() = user_id);

-- ============================================================
-- key_access_log (audit trail — never stores the key itself)
-- ============================================================
create table if not exists key_access_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  api_key_id uuid references api_keys(id) on delete set null,
  provider text not null,
  action text not null check (action in ('created', 'used', 'deleted')),
  created_at timestamptz not null default now()
);

alter table key_access_log enable row level security;

create policy "key_access_log_select_own" on key_access_log for select using (auth.uid() = user_id);

-- ============================================================
-- skill_profiles
-- ============================================================
create table if not exists skill_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  weakness_tally jsonb not null default '{}'::jsonb,
  skill_mastery jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table skill_profiles enable row level security;

create policy "skill_profiles_select_own" on skill_profiles for select using (auth.uid() = user_id);
create policy "skill_profiles_upsert_own" on skill_profiles for insert with check (auth.uid() = user_id);
create policy "skill_profiles_update_own" on skill_profiles for update using (auth.uid() = user_id);

-- ============================================================
-- interview_sessions
-- ============================================================
create table if not exists interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null,
  mode text not null default 'text' check (mode in ('text', 'voice')),
  status text not null default 'active' check (status in ('active', 'completed')),
  overall_score int,
  calibration_gap numeric,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table interview_sessions enable row level security;

create policy "sessions_select_own" on interview_sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on interview_sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on interview_sessions for update using (auth.uid() = user_id);

-- ============================================================
-- questions
-- ============================================================
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references interview_sessions(id) on delete cascade,
  text text not null,
  skill_tag text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  order_index int not null,
  created_at timestamptz not null default now()
);

alter table questions enable row level security;

create policy "questions_select_own" on questions for select using (
  exists (select 1 from interview_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "questions_insert_own" on questions for insert with check (
  exists (select 1 from interview_sessions s where s.id = session_id and s.user_id = auth.uid())
);

-- ============================================================
-- answers
-- ============================================================
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references questions(id) on delete cascade,
  answer_text text not null,
  self_confidence int not null check (self_confidence between 1 and 5),
  created_at timestamptz not null default now()
);

alter table answers enable row level security;

create policy "answers_select_own" on answers for select using (
  exists (
    select 1 from questions q
    join interview_sessions s on s.id = q.session_id
    where q.id = question_id and s.user_id = auth.uid()
  )
);
create policy "answers_insert_own" on answers for insert with check (
  exists (
    select 1 from questions q
    join interview_sessions s on s.id = q.session_id
    where q.id = question_id and s.user_id = auth.uid()
  )
);

-- ============================================================
-- panel_feedback
-- ============================================================
create table if not exists panel_feedback (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references answers(id) on delete cascade,
  persona text not null check (persona in ('hr', 'technical', 'skeptical')),
  score int not null check (score between 0 and 100),
  comment text not null,
  flagged_issues jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table panel_feedback enable row level security;

create policy "panel_feedback_select_own" on panel_feedback for select using (
  exists (
    select 1 from answers a
    join questions q on q.id = a.question_id
    join interview_sessions s on s.id = q.session_id
    where a.id = answer_id and s.user_id = auth.uid()
  )
);
create policy "panel_feedback_insert_own" on panel_feedback for insert with check (
  exists (
    select 1 from answers a
    join questions q on q.id = a.question_id
    join interview_sessions s on s.id = q.session_id
    where a.id = answer_id and s.user_id = auth.uid()
  )
);

-- ============================================================
-- cross_exams
-- ============================================================
create table if not exists cross_exams (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references answers(id) on delete cascade,
  challenge_question text not null,
  user_rebuttal text,
  rebuttal_score int,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table cross_exams enable row level security;

create policy "cross_exams_select_own" on cross_exams for select using (
  exists (
    select 1 from answers a
    join questions q on q.id = a.question_id
    join interview_sessions s on s.id = q.session_id
    where a.id = answer_id and s.user_id = auth.uid()
  )
);
create policy "cross_exams_insert_own" on cross_exams for insert with check (
  exists (
    select 1 from answers a
    join questions q on q.id = a.question_id
    join interview_sessions s on s.id = q.session_id
    where a.id = answer_id and s.user_id = auth.uid()
  )
);
create policy "cross_exams_update_own" on cross_exams for update using (
  exists (
    select 1 from answers a
    join questions q on q.id = a.question_id
    join interview_sessions s on s.id = q.session_id
    where a.id = answer_id and s.user_id = auth.uid()
  )
);

-- ============================================================
-- session_summaries
-- ============================================================
create table if not exists session_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references interview_sessions(id) on delete cascade,
  overall_score int not null,
  calibration_gap numeric not null,
  top_weaknesses jsonb not null default '[]'::jsonb,
  knowledge_gaps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table session_summaries enable row level security;

create policy "session_summaries_select_own" on session_summaries for select using (
  exists (select 1 from interview_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "session_summaries_insert_own" on session_summaries for insert with check (
  exists (select 1 from interview_sessions s where s.id = session_id and s.user_id = auth.uid())
);

-- ============================================================
-- learning_resources
-- ============================================================
create table if not exists learning_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references interview_sessions(id) on delete cascade,
  skill_tag text not null,
  source text not null default 'youtube',
  title text not null,
  url text not null,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

alter table learning_resources enable row level security;

create policy "learning_resources_select_own" on learning_resources for select using (auth.uid() = user_id);
create policy "learning_resources_insert_own" on learning_resources for insert with check (auth.uid() = user_id);
