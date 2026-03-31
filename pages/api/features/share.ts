import type { NextApiRequest, NextApiResponse } from 'next';
import { getShareLinks, addShareLink, getShareLink, updateShareLink } from '@/lib/kv';
import { ShareLink } from '@/lib/types';

function generateToken(): string {
  return Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { token } = req.query;
      
      if (token) {
        const link = await getShareLink(token as string);
        if (!link) {
          return res.status(404).json({ error: '分享連結不存在或已過期' });
        }

        // 更新瀏覽次數
        await updateShareLink(token as string, { viewCount: link.viewCount + 1 });
        return res.status(200).json(link);
      }

      const links = await getShareLinks();
      return res.status(200).json(links);
    }

    if (req.method === 'POST') {
      const { imageId, expiresIn } = req.body;
      if (!imageId) {
        return res.status(400).json({ error: '缺少圖片 ID' });
      }

      const token = generateToken();
      const link: ShareLink = {
        token,
        imageId,
        createdAt: Date.now(),
        expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
        viewCount: 0,
      };

      await addShareLink(link);
      return res.status(201).json(link);
    }

    if (req.method === 'PUT') {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ error: '缺少 token' });
      }

      const link = await getShareLink(token as string);
      if (!link) {
        return res.status(404).json({ error: '分享連結不存在' });
      }

      await updateShareLink(token as string, { viewCount: link.viewCount + 1 });
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: '方法不允許' });
  } catch (error) {
    console.error('分享 API 錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
}
