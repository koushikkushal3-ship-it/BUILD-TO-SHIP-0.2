import crypto from 'node:crypto';

// Envelope encryption for user-supplied (BYOK) API keys.
//
// A one-way hash cannot be used here: the backend must recover the real key
// to call Gemini/OpenAI/Anthropic on the user's behalf, and a hash is
// irreversible by design. Instead: AES-256-GCM with a per-user key derived
// via HKDF from a master secret that lives only in process env — a DB leak
// alone exposes nothing usable, and a leak of one user's derived key doesn't
// expose anyone else's.

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended IV length for GCM

function getMasterSecret() {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) throw new Error('ENCRYPTION_SECRET is not set');
  return Buffer.from(secret, 'base64');
}

function deriveUserKey(userId) {
  const ikm = getMasterSecret();
  const salt = Buffer.from('crucible-byok-salt');
  const info = Buffer.from(`user:${userId}`);
  return Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, 32));
}

export function encryptApiKey(userId, plaintextKey) {
  const key = deriveUserKey(userId);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintextKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedKey: encrypted,
    iv,
    authTag,
    keyPreview: plaintextKey.slice(-4),
  };
}

export function decryptApiKey(userId, { encryptedKey, iv, authTag }) {
  const key = deriveUserKey(userId);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedKey), decipher.final()]);
  return decrypted.toString('utf8');
}
