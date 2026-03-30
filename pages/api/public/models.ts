import type { NextApiRequest, NextApiResponse } from 'next';
import { getModels } from '../../../lib/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const models = await getModels();
  const enabled = models.filter(m => m.enabled).map(m => ({
    value: m.value,
    label: m.label,
    isGrok: m.isGrok,
  }));

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).json({ models: enabled });
}
