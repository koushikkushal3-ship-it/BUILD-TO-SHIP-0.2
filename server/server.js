import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import profileRoutes from './src/routes/profile.routes.js';
import sessionRoutes from './src/routes/session.routes.js';
import keysRoutes from './src/routes/keys.routes.js';
import practiceRoutes from './src/routes/practice.routes.js';
import newsRoutes from './src/routes/news.routes.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();

// FRONTEND_URL accepts a comma-separated list. A single hardcoded origin
// breaks any deploy served from a different hostname — notably Vercel preview
// deployments, which get a fresh URL every build. When that happens the
// browser blocks every API call before it leaves the page, which surfaces as
// unrelated-looking UI bugs (spinners that never resolve, saves that revert,
// uploads that "can't read the file") rather than an obvious CORS error.
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: same-origin, curl, or server-to-server. Not a
      // browser cross-origin request, so there's nothing to gate here.
      if (!origin) return callback(null, true);
      if (!allowedOrigins.length) return callback(null, true);
      if (allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/profile', profileRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/keys', keysRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/news', newsRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Crucible API listening on port ${port}`));
