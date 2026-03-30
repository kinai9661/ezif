import type { NextApiRequest, NextApiResponse } from 'next';
import { isAuthenticated } from '../../../lib/auth';
import { getProviders, setProviders } from '../../../lib/kv';
import { Provider } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  // GET — 取得所有供應商
  if (req.method === 'GET') {
    try {
      const providers = await getProviders();
      return res.status(200).json({ providers });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: '讀取供應商失敗：' + message });
    }
  }

  // POST — 新增供應商
  if (req.method === 'POST') {
    try {
      const { name, baseUrl, apiKey, enabled } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: '供應商名稱不能為空' });
      }
      if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.trim()) {
        return res.status(400).json({ error: 'API 基礎地址不能為空' });
      }
      const providers = await getProviders();
      const maxOrder = providers.length > 0 ? Math.max(...providers.map(p => p.order)) : -1;
      const newProvider: Provider = {
        id: Date.now().toString(),
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        apiKey: typeof apiKey === 'string' ? apiKey.trim() : '',
        enabled: enabled !== false,
        order: maxOrder + 1,
      };
      providers.push(newProvider);
      await setProviders(providers);
      return res.status(201).json({ provider: newProvider });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: '新增供應商失敗：' + message });
    }
  }

  // PUT — 更新供應商（單一或批次排序）
  if (req.method === 'PUT') {
    try {
      const { id, name, baseUrl, apiKey, enabled, order, providers: allProviders } = req.body;

      // 批次更新（排序）
      if (Array.isArray(allProviders)) {
        await setProviders(allProviders);
        return res.status(200).json({ ok: true });
      }

      // 單一更新
      if (!id) return res.status(400).json({ error: '缺少供應商 ID' });
      const providers = await getProviders();
      const idx = providers.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: '供應商不存在' });

      if (name !== undefined) providers[idx].name = String(name).trim();
      if (baseUrl !== undefined) providers[idx].baseUrl = String(baseUrl).trim();
      if (apiKey !== undefined) providers[idx].apiKey = String(apiKey).trim();
      if (enabled !== undefined) providers[idx].enabled = Boolean(enabled);
      if (order !== undefined) providers[idx].order = Number(order);

      await setProviders(providers);
      return res.status(200).json({ provider: providers[idx] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: '更新供應商失敗：' + message });
    }
  }

  // DELETE — 刪除供應商
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: '缺少供應商 ID' });
      const providers = await getProviders();
      const filtered = providers.filter(p => p.id !== id);
      if (filtered.length === providers.length) return res.status(404).json({ error: '供應商不存在' });
      await setProviders(filtered);
      return res.status(200).json({ ok: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: '刪除供應商失敗：' + message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
