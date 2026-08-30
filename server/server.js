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

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
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
