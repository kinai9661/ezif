import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ShareLink, ImageRecord } from '@/lib/types';

export default function SharePage() {
  const router = useRouter();
  const { token } = router.query;
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const loadShare = async () => {
      try {
        const res = await fetch(`/api/features/share?token=${token}`);
        if (!res.ok) {
          setError('分享連結不存在或已過期');
          setLoading(false);
          return;
        }

        const link = await res.json();
        setShareLink(link);

        // 載入圖片資訊
        const imgRes = await fetch(`/api/features/images`);
        if (imgRes.ok) {
          const images = await imgRes.json();
          const img = images.find((i: ImageRecord) => i.id === link.imageId);
          if (img) {
            setImage(img);
          }
        }
      } catch (err) {
        setError('載入分享內容失敗');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadShare();
  }, [token]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>載入中...</div>;
  }

  if (error) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  if (!image) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>圖片不存在</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1>分享的圖片</h1>
      <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <img
          src={image.imageUrl}
          alt={image.prompt}
          style={{ width: '100%', borderRadius: '8px', marginBottom: '20px' }}
        />
        <div>
          <h2>提示詞</h2>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333' }}>{image.prompt}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '20px' }}>
            {image.size && (
              <div>
                <strong>尺寸:</strong> {image.size}
              </div>
            )}
            {image.style && (
              <div>
                <strong>風格:</strong> {image.style}
              </div>
            )}
            {image.quality && (
              <div>
                <strong>質量:</strong> {image.quality}
              </div>
            )}
            <div>
              <strong>建立時間:</strong> {new Date(image.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {shareLink && (
        <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>
            ✓ 此分享連結已被瀏覽 <strong>{shareLink.viewCount}</strong> 次
          </p>
          {shareLink.expiresAt && (
            <p style={{ margin: '0', color: '#2e7d32', fontSize: '12px' }}>
              過期時間: {new Date(shareLink.expiresAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            const link = `${window.location.origin}/share/${token}`;
            navigator.clipboard.writeText(link);
            alert('連結已複製到剪貼板');
          }}
          style={{
            flex: 1,
            padding: '12px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          複製分享連結
        </button>
        <button
          onClick={() => {
            const link = `${window.location.origin}/share/${token}`;
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
          }}
          style={{
            flex: 1,
            padding: '12px',
            background: '#1877f2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          分享到 Facebook
        </button>
      </div>
    </div>
  );
}
