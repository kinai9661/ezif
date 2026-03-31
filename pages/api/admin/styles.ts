import type { NextApiRequest, NextApiResponse } from 'next';
import { getStyles, setStyles } from '../../../lib/kv';
import { isAuthenticated } from '../../../lib/auth';
import { StyleConfig } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const styles = await getStyles();
      return res.status(200).json(styles);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch styles' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, style } = req.body;

      if (action === 'add') {
        const styles = await getStyles();
        const newStyle: StyleConfig = {
          id: Date.now().toString(),
          name: style.name,
          value: style.value,
          description: style.description,
          enabled: true,
          order: styles.length,
          supportedModels: style.supportedModels || [],
        };
        styles.push(newStyle);
        await setStyles(styles);
        return res.status(200).json(newStyle);
      }

      if (action === 'update') {
        const styles = await getStyles();
        const idx = styles.findIndex(s => s.id === style.id);
        if (idx === -1) return res.status(404).json({ error: 'Style not found' });
        styles[idx] = { ...styles[idx], ...style };
        await setStyles(styles);
        return res.status(200).json(styles[idx]);
      }

      if (action === 'delete') {
        const styles = await getStyles();
        const filtered = styles.filter(s => s.id !== style.id);
        await setStyles(filtered);
        return res.status(200).json({ success: true });
      }

      if (action === 'reorder') {
        const { styles: reorderedStyles } = req.body;
        await setStyles(reorderedStyles);
        return res.status(200).json(reorderedStyles);
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update styles' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
