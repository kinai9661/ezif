import type { NextApiRequest, NextApiResponse } from 'next';
import { getBatchJobs, addBatchJob, updateBatchJob } from '@/lib/kv';
import { BatchJob, ImageRecord } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit as string) || 50;
      const jobs = await getBatchJobs(limit);
      return res.status(200).json(jobs);
    }

    if (req.method === 'POST') {
      const { prompts, modelId, size, style, quality } = req.body;
      if (!prompts || !Array.isArray(prompts) || prompts.length === 0 || !modelId) {
        return res.status(400).json({ error: '缺少必要欄位或提示詞為空' });
      }

      const job: BatchJob = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        prompts,
        modelId,
        size,
        style,
        quality,
        status: 'pending',
        results: [],
        createdAt: Date.now(),
      };

      await addBatchJob(job);
      return res.status(201).json(job);
    }

    if (req.method === 'PUT') {
      const { id, status, results } = req.body;
      if (!id) {
        return res.status(400).json({ error: '缺少 ID' });
      }

      const updates: Partial<BatchJob> = { status };
      if (results) {
        updates.results = results;
      }
      if (status === 'completed' || status === 'failed') {
        updates.completedAt = Date.now();
      }

      await updateBatchJob(id, updates);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: '方法不允許' });
  } catch (error) {
    console.error('批量生成 API 錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
}
