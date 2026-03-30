import { useState } from 'react';

const MODELS = [
  { value: 'gpt-image-1', label: 'GPT Image 1' },
  { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image Preview' },
];

const SIZES = [
  { value: '', label: '預設 (Default)' },
  { value: '256x256', label: '256x256' },
  { value: '512x512', label: '512x512' },
  { value: '1024x1024', label: '1024x1024' },
  { value: '1024x1792', label: '1024x1792 (Portrait)' },
  { value: '1792x1024', label: '1792x1024 (Landscape)' },
];

interface ImageResult {
  url?: string;
  b64_json?: string;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt-image-1');
  const [size, setSize] = useState('');
  const [n, setN] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [useEnvKey, setUseEnvKey] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('請輸入提示詞'); return; }
    if (!useEnvKey && !apiKey.trim()) { setError('請輸入 API Key 或使用伺服器端的 API Key'); return; }
    setError('');
    setImages([]);
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, size: size || undefined, n, apiKey, useEnvKey }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '生成失敗'); return; }
      setImages(data.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (src: string, idx: number) => {
    const a = document.createElement('a');
    a.href = src;
    a.download = `ai-image-${idx + 1}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <>
      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { min-height: 100vh; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); font-family: 'Segoe UI', sans-serif; color: #fff; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        header { text-align: center; margin-bottom: 40px; }
        header h1 { font-size: 2.6rem; font-weight: 800; background: linear-gradient(90deg, #a78bfa, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        header p { color: #94a3b8; margin-top: 8px; font-size: 1.05rem; }
        .card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; backdrop-filter: blur(12px); margin-bottom: 28px; }
        label { display: block; font-size: 0.85rem; font-weight: 600; color: #a78bfa; margin-bottom: 8px; letter-spacing: 0.05em; text-transform: uppercase; }
        input, select, textarea { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; font-size: 1rem; outline: none; transition: border 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: #a78bfa; }
        textarea { min-height: 110px; resize: vertical; }
        select option { background: #302b63; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        @media (max-width: 600px) { .row { grid-template-columns: 1fr; } header h1 { font-size: 1.8rem; } }
        .key-wrap { position: relative; }
        .key-wrap input { padding-right: 48px; }
        .eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 1.2rem; }
        .generate-btn { width: 100%; margin-top: 24px; padding: 16px; background: linear-gradient(90deg, #7c3aed, #2563eb); border: none; border-radius: 12px; color: #fff; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s, transform 0.1s; letter-spacing: 0.03em; }
        .generate-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); border-radius: 10px; padding: 12px 16px; color: #fca5a5; margin-top: 16px; font-size: 0.95rem; }
        .images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin-top: 8px; }
        .img-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; overflow: hidden; }
        .img-card img { width: 100%; display: block; }
        .img-card-footer { padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; }
        .img-label { font-size: 0.8rem; color: #94a3b8; }
        .dl-btn { background: rgba(167,139,250,0.2); border: 1px solid rgba(167,139,250,0.4); color: #a78bfa; border-radius: 8px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; transition: background 0.2s; }
        .dl-btn:hover { background: rgba(167,139,250,0.35); }
        .spinner { display: inline-block; width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; margin-right: 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .hint { color: #64748b; font-size: 0.8rem; margin-top: 6px; }
        footer { text-align: center; color: #475569; font-size: 0.82rem; margin-top: 32px; }
        footer a { color: #7c3aed; text-decoration: none; }
        .checkbox-label { display: flex; align-items: center; gap: 10px; margin-top: 12px; cursor: pointer; }
        .checkbox-label input { width: auto; margin: 0; }
        .checkbox-label span { font-size: 0.85rem; color: #94a3b8; text-transform: none; font-weight: 400; }
      `}</style>

      <div className="container">
        <header>
          <h1>AI 圖片生成器</h1>
          <p>由 GPT-Image-1 & Gemini Flash Image 驅動的專業圖片生成平台</p>
        </header>

        <div className="card">
          <label>API Key</label>
          <div className="key-wrap">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="輸入你的 API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button className="eye-btn" onClick={() => setShowKey(v => !v)} title="顯示/隱藏">
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useEnvKey}
              onChange={(e) => setUseEnvKey(e.target.checked)}
            />
            <span>使用伺服器端的 API Key（需在 Vercel 環境變數設定）</span>
          </label>
          {!useEnvKey && <p className="hint">API Key 僅在瀏覽器本地使用，不會儲存至伺服器</p>}
        </div>

        <div className="card">
          <label>提示詞 Prompt</label>
          <textarea
            placeholder="描述你想要生成的圖片，例如：A futuristic city skyline at sunset, cyberpunk style"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="row">
            <div>
              <label>模型 Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label>尺寸 Size</label>
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="row">
            <div>
              <label>數量 N</label>
              <input
                type="number"
                min={1}
                max={10}
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
              />
            </div>
          </div>
          <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
            {loading ? <><span className="spinner"></span>生成中…</> : '✨ 生成圖片'}
          </button>
          {error && <div className="error">{error}</div>}
        </div>

        {images.length > 0 && (
          <div className="card">
            <label>生成結果</label>
            <div className="images-grid">
              {images.map((img, i) => {
                const src = img.url || (img.b64_json ? `data:image/png;base64,${img.b64_json}` : '');
                return (
                  <div key={i} className="img-card">
                    <img src={src} alt={`Generated image ${i + 1}`} />
                    <div className="img-card-footer">
                      <span className="img-label">圖片 {i + 1}</span>
                      <button className="dl-btn" onClick={() => handleDownload(src, i)}>下載</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <footer>
          Powered by <a href="https://ai.ezif.in" target="_blank" rel="noopener noreferrer">ai.ezif.in</a> · Built with Next.js & Vercel
        </footer>
      </div>
    </>
  );
}
