import type { NextApiRequest, NextApiResponse } from 'next';
import { getModels, setModels } from '../../../lib/kv';
import { ModelConfig } from '../../../lib/types';
import { isAuthenticated } from '../../../lib/auth';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      const models = await getModels();
      return res.status(200).json({ models });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '讀取模型失敗：' + message });
    }
  }

  if (req.method === 'POST') {
    const { value, label, enabled = true, isGrok = false, providerId = '' } = req.body || {};
    if (!value || !label) return res.status(400).json({ error: '請輸入模型 value 與顯示名稱' });

    try {
      const models = await getModels();
      if (models.find(m => m.value === value)) {
        return res.status(400).json({ error: '模型 value 已存在' });
      }

      const newModel: ModelConfig = {
        id: generateId(),
        value,
        label,
        enabled,
        isGrok,
        order: models.length,
        providerId: providerId || undefined,
      };
      await setModels([...models, newModel]);
      return res.status(201).json({ model: newModel });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '新增模型失敗：' + message });
    }
  }

  if (req.method === 'PUT') {
    const { models: updatedModels } = req.body || {};
    if (!Array.isArray(updatedModels)) {
      return res.status(400).json({ error: '需要提供 models 陣列' });
    }
    // Validate each model
    for (const m of updatedModels) {
      if (!m.id || !m.value || !m.label) {
        return res.status(400).json({ error: '每個模型需要 id、value、label' });
      }
    }
    try {
      // Re-assign order based on array index
      const reordered = updatedModels.map((m, i) => ({ ...m, order: i }));
      await setModels(reordered);
      return res.status(200).json({ models: reordered });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '儲存模型失敗：' + message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: '需要提供模型 id' });

    try {
      const models = await getModels();
      const filtered = models.filter(m => m.id !== id);
      if (filtered.length === models.length) {
        return res.status(404).json({ error: '找不到此模型' });
      }
      await setModels(filtered.map((m, i) => ({ ...m, order: i })));
      return res.status(200).json({ ok: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '刪除模型失敗：' + message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
