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
    const models = await getModels();
    return res.status(200).json({ models });
  }

  if (req.method === 'POST') {
    const { value, label, enabled = true, isGrok = false } = req.body || {};
    if (!value || !label) return res.status(400).json({ error: '請輸入模型 value 與顯示名稱' });

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
    };
    await setModels([...models, newModel]);
    return res.status(201).json({ model: newModel });
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
    // Re-assign order based on array index
    const reordered = updatedModels.map((m, i) => ({ ...m, order: i }));
    await setModels(reordered);
    return res.status(200).json({ models: reordered });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: '需要提供模型 id' });

    const models = await getModels();
    const filtered = models.filter(m => m.id !== id);
    if (filtered.length === models.length) {
      return res.status(404).json({ error: '找不到此模型' });
    }
    await setModels(filtered.map((m, i) => ({ ...m, order: i })));
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
