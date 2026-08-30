import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { extractResumeText } from '../services/resume.service.js';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  targetRole: z.string().min(1).max(160),
  resumeSummary: z.string().max(6000).optional(),
});

export async function getProfile(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', req.user.id).single();
    if (error) throw error;
    res.json({ profile: data });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, targetRole, resumeSummary } = req.body;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ name, target_role: targetRole, resume_summary: resumeSummary })
      .eq('id', req.user.id)
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
