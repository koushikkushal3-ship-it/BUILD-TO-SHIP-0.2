import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { encryptApiKey } from '../services/crypto.service.js';

export const addKeySchema = z.object({
  provider: z.enum(['gemini', 'openai', 'anthropic']),
  apiKey: z.string().min(10).max(500),
});

// Never returns the decrypted key — only the masked preview — see server/PLAN.md API Key Security.
export async function listKeys(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, provider, key_preview, created_at')
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ keys: data });
  } catch (err) {
    next(err);
  }
}

export async function addKey(req, res, next) {
  try {
    const { provider, apiKey } = req.body;
    const { encryptedKey, iv, authTag, keyPreview } = encryptApiKey(req.user.id, apiKey);

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .upsert(
        {
          user_id: req.user.id,
          provider,
          encrypted_key: encryptedKey,
          iv,
          auth_tag: authTag,
          key_preview: keyPreview,
        },
        { onConflict: 'user_id,provider' }
      )
      .select('id, provider, key_preview, created_at')
      .single();
    if (error) throw error;

    await supabaseAdmin.from('key_access_log').insert({
      user_id: req.user.id,
      api_key_id: data.id,
      provider,
      action: 'created',
    });

    res.status(201).json({ key: data });
  } catch (err) {
    next(err);
  }
}

export async function deleteKey(req, res, next) {
  try {
    const { data: existing } = await supabaseAdmin
      .from('api_keys')
      .select('id, provider')
      .eq('id', req.params.keyId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!existing) return res.status(404).json({ error: 'Key not found' });

    const { error } = await supabaseAdmin.from('api_keys').delete().eq('id', req.params.keyId);
    if (error) throw error;

    await supabaseAdmin.from('key_access_log').insert({
      user_id: req.user.id,
      api_key_id: null,
      provider: existing.provider,
      action: 'deleted',
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
