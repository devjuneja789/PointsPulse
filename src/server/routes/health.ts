import { Router, Request, Response } from 'express';
import { liveLLMAdapter } from '../llm';
import { globalCacheManager } from '../llm/cache';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const quota = globalCacheManager.getStats();

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    llmMode: liveLLMAdapter.getMode(),
    version: '0.1.0',
    cacheSize: quota.cacheSize,
    dailyQuotaUsed: quota.dailyQuotaUsed,
    dailyQuotaRemaining: quota.dailyQuotaRemaining,
  });
});

export default router;
