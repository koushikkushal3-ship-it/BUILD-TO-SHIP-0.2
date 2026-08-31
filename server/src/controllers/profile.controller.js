import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { extractResumeText } from '../services/resume.service.js';
import { classifyResumeText, analyzeAtsScore } from '../services/gemini.service.js';
import { resolveApiKey } from '../services/agent.service.js';

export const updateProfileSchema = z.object({
  // No min(1): the name field is genuinely optional in the UI, and the form
  // always sends it. With min(1) an empty string failed validation, so
  // leaving the (unmarked, optional) name blank rejected the entire profile
  // save with "Validation failed" and no indication of which field was at
  // fault. `.optional()` only permits an absent key, not an empty value.
  name: z.string().max(120).optional(),
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

    const apiKey = await resolveApiKey(req.user.id);
    const classification = await classifyResumeText({ apiKey, text: resumeSummary });
    if (!classification.isResume) {
      const err = new Error(
        `That looks like a ${classification.documentType}, not a resume — ${classification.reason}`
      );
      err.status = 400;
      err.publicMessage = err.message;
      throw err;
    }

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

export const atsScoreSchema = z.object({
  // Optional overrides so this works from Profile Setup too, before the form
  // has been saved — falls back to the persisted profile when omitted.
  resumeSummary: z.string().max(6000).optional(),
  targetRole: z.string().max(160).optional(),
});

export async function getAtsScore(req, res, next) {
  try {
    const profile = await ensureProfile(req.user);
    // Strict undefined checks, not `||` — an explicitly empty string (the
    // textarea genuinely has nothing in it) must NOT silently fall back to
    // stale saved data. Only a truly omitted field falls back.
    const resumeText = req.body.resumeSummary !== undefined ? req.body.resumeSummary : profile.resume_summary;
    const targetRole = req.body.targetRole !== undefined ? req.body.targetRole : profile.target_role;

    if (!resumeText) {
      const err = new Error('Add a resume before checking your ATS score');
      err.status = 400;
      err.publicMessage = err.message;
      throw err;
    }
    if (!targetRole) {
      const err = new Error('Set a target role before checking your ATS score');
      err.status = 400;
      err.publicMessage = err.message;
      throw err;
    }

    const apiKey = await resolveApiKey(req.user.id);
    const analysis = await analyzeAtsScore({ apiKey, resumeText, targetRole });

    res.json({ analysis });
  } catch (err) {
    next(err);
  }
}
