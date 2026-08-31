// Field names that must never reach stdout or an error response in plaintext,
// even accidentally via a stack trace or a logged request body.
const SENSITIVE_KEY_PATTERN = /key|secret|token|password|authorization/i;

function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        SENSITIVE_KEY_PATTERN.test(k) ? '[redacted]' : scrub(v),
      ])
    );
  }
  return value;
}

export function scrubbedLog(label, payload) {
  console.log(label, JSON.stringify(scrub(payload)));
}

export function errorHandler(err, req, res, _next) {
  scrubbedLog('[error]', { message: err.message, path: req.path, body: req.body, stack: err.stack });
  res.status(err.status || 500).json({ error: err.publicMessage || err.message || 'Internal server error' });
}
