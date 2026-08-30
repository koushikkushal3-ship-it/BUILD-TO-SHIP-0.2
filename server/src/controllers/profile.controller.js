import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { extractResumeText } from '../services/resume.service.js';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  targetRole: z.string().min(1).max(160),
  resumeSummary: z.string().max(6000).optional(),
});

// Normally the `handle_new_user` DB trigger creates this row at signup — but
// accounts that existed before that trigger was added (or any future gap
// between auth.users and profiles) would otherwise 500 on every profile
// call. Upserting on every write, and self-healing on read, means a missing
// row is never a dead end.
async function ensureProfile(user) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: user.id, email: user.email }, { onConflict: 'id', ignoreDuplicates: true })
    .select('*');
  if (error) throw error;
  if (data?.length) return data[0];

  const { data: existing, error: selectErr } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (selectErr) throw selectErr;
  return existing;
}

export async function getProfile(req, res, next) {
  try {
    const profile = await ensureProfile(req.user);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, targetRole, resumeSummary } = req.body;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        { id: req.user.id, email: req.user.email, name, target_role: targetRole, resume_summary: resumeSummary },
        { onConflict: 'id' }
      )
      .select('*')
      .single();
    if (error) throw error;
    res.json({ profile: data });
  } catch (err) {
    next(err);
  }
}

// The uploaded file itself is never stored — only the extracted text, which
// lands in the same resume_summary field manual entry would use.
export async function uploadResumeFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const resumeSummary = await extractResumeText(req.file.buffer, req.file.mimetype);
    await ensureProfile(req.user);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ resume_summary: resumeSummary })
      .eq('id', req.user.id)
      .select('*')
      .single();
    if (error) throw error;

    res.json({ profile: data });
  } catch (err) {
    next(err);
  }
}
