import { useState, useEffect } from 'react';
import { ImageRecord, BatchJob } from '@/lib/types';

export default function Features() {
  const [activeTab, setActiveTab] = useState<'images' | 'batch' | 'share'>('images');
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchPrompts, setBatchPrompts] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    loadImages();
    loadBatchJobs();
  }, []);

  const loadImages = async () => {
    try {
      const res = await fetch('/api/features/images?limit=50');
      if (res.ok) {
        setImages(await res.json());
      }
    } catch (error) {
      console.error('載入圖片失敗:', error);
    }
  };

  const loadBatchJobs = async () => {
    try {
      const res = await fetch('/api/features/batch?limit=20');
      if (res.ok) {
        setBatchJobs(await res.json());
      }
    } catch (error) {
      console.error('載入批量任務失敗:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const img = images.find(i => i.id === id);
      if (!img) return;

      await fetch('/api/features/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isFavorite: !img.isFavorite }),
      });

      setImages(images.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch (error) {
      console.error('更新收藏失敗:', error);
    }
  };

  const deleteImage = async (id: string) => {
    try {
      await fetch('/api/features/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      setImages(images.filter(i => i.id !== id));
    } catch (error) {
      console.error('刪除圖片失敗:', error);
    }
  };

  const createShareLink = async (imageId: string) => {
    try {
      const res = await fetch('/api/features/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, expiresIn: 7 * 24 * 60 * 60 }),
      });

      if (res.ok) {
        const link = await res.json();
        const shareUrl = `${window.location.origin}/share/${link.token}`;
        alert(`分享連結: ${shareUrl}`);
      }
    } catch (error) {
      console.error('建立分享連結失敗:', error);
    }
  };

  const submitBatchJob = async () => {
    if (!batchPrompts.trim() || !selectedModel) {
      alert('請輸入提示詞並選擇模型');
      return;
    }

    setLoading(true);
    try {
      const prompts = batchPrompts.split('\n').filter(p => p.trim());
      const res = await fetch('/api/features/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts, modelId: selectedModel }),
      });

      if (res.ok) {
        const job = await res.json();
        setBatchJobs([job, ...batchJobs]);
        setBatchPrompts('');
        alert('批量任務已建立');
      }
    } catch (error) {
      console.error('建立批量任務失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>功能模組</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('images')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'images' ? '#007bff' : 'transparent',
            color: activeTab === 'images' ? 'white' : 'inherit',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
          }}
        >
          📸 圖片管理 ({images.length})
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'batch' ? '#007bff' : 'transparent',
            color: activeTab === 'batch' ? 'white' : 'inherit',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
          }}
        >
          ⚡ 批量生成 ({batchJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('share')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'share' ? '#007bff' : 'transparent',
            color: activeTab === 'share' ? 'white' : 'inherit',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
          }}
        >
          🔗 分享管理
        </button>
      </div>

      {activeTab === 'images' && (
        <div>
          <h2>圖片管理</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {images.map(img => (
              <div key={img.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <img src={img.imageUrl} alt={img.prompt} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <div style={{ padding: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>{img.prompt.substring(0, 50)}...</p>
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => toggleFavorite(img.id)}
                      style={{
                        padding: '5px 10px',
                        background: img.isFavorite ? '#ff6b6b' : '#f0f0f0',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {img.isFavorite ? '❤️' : '🤍'}
                    </button>
                    <button
                      onClick={() => createShareLink(img.id)}
                      style={{
                        padding: '5px 10px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      分享
                    </button>
                    <button
                      onClick={() => deleteImage(img.id)}
                      style={{
                        padding: '5px 10px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'batch' && (
        <div>
          <h2>批量生成</h2>
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label>選擇模型:</label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              >
                <option value="">-- 選擇模型 --</option>
                <option value="gpt-image-1">GPT Image 1</option>
                <option value="gpt-image-1.5">GPT Image 1.5</option>
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>提示詞 (每行一個):</label>
              <textarea
                value={batchPrompts}
                onChange={e => setBatchPrompts(e.target.value)}
                placeholder="輸入多個提示詞，每行一個..."
                style={{ width: '100%', height: '150px', padding: '8px', marginTop: '5px', fontFamily: 'monospace' }}
              />
            </div>
            <button
              onClick={submitBatchJob}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '處理中...' : '開始批量生成'}
            </button>
          </div>

          <h3>批量任務</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {batchJobs.map(job => (
              <div key={job.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>任務 ID: {job.id.substring(0, 20)}...</p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>提示詞數: {job.prompts.length}</p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>建立時間: {new Date(job.createdAt).toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      background: job.status === 'completed' ? '#28a745' : job.status === 'failed' ? '#dc3545' : '#ffc107',
                      color: 'white',
                      fontSize: '12px',
                    }}>
                      {job.status === 'pending' ? '待處理' : job.status === 'processing' ? '處理中' : job.status === 'completed' ? '已完成' : '失敗'}
                    </span>
                    <p style={{ margin: '10px 0 0 0', fontSize: '12px' }}>結果: {job.results.length}/{job.prompts.length}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'share' && (
        <div>
          <h2>分享管理</h2>
          <p style={{ color: '#666' }}>分享功能已整合到圖片管理中。點擊圖片卡片上的「分享」按鈕即可生成分享連結。</p>
        </div>
      )}
    </div>
  );
}
