import { Router, Request, Response } from 'express';
import { defaultLLMAdapter } from '../llm';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    llmMode: defaultLLMAdapter.getMode(),
    version: '0.1.0',
  });
});

export default router;
