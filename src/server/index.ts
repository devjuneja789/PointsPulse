import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import healthRouter from './routes/health';
import explainRouter from './routes/explain';
import askRouter from './routes/ask';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Security & Body Limits
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// API routes
app.use('/api', healthRouter);
app.use('/api', explainRouter);
app.use('/api', askRouter);

// Static frontend serving
const clientDistPath = path.resolve(__dirname, '../client');

if (fs.existsSync(clientDistPath)) {
  app.use(
    express.static(clientDistPath, {
      maxAge: '1h',
      index: false,
    })
  );

  // SPA fallback
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// 404 handler for unmatched API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server when executed directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[PointsPulse] Server running on port ${PORT} (mode: ${process.env.LLM_MODE || 'mock'})`);
  });
}

export default app;
