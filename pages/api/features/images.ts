import type { NextApiRequest, NextApiResponse } from 'next';
import { getImageRecords, addImageRecord, updateImageRecord, deleteImageRecord } from '@/lib/kv';
import { ImageRecord } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit as string) || 100;
      const records = await getImageRecords(limit);
      return res.status(200).json(records);
    }

    if (req.method === 'POST') {
      const { prompt, imageUrl, modelId, size, style, quality } = req.body;
      if (!prompt || !imageUrl || !modelId) {
        return res.status(400).json({ error: '缺少必要欄位' });
      }

      const record: ImageRecord = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        prompt,
        imageUrl,
        modelId,
        size,
        style,
        quality,
        createdAt: Date.now(),
        isFavorite: false,
      };

      await addImageRecord(record);
      return res.status(201).json(record);
    }

    if (req.method === 'PUT') {
      const { id, isFavorite } = req.body;
      if (!id) {
        return res.status(400).json({ error: '缺少 ID' });
      }

      await updateImageRecord(id, { isFavorite });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: '缺少 ID' });
      }

      await deleteImageRecord(id);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: '方法不允許' });
  } catch (error) {
    console.error('圖片 API 錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
}
