import { useState, useEffect, useCallback } from 'react';

const MODELS = [
  { value: 'gpt-image-1', label: 'GPT Image 1' },
  { value: 'gpt-image-1.5', label: 'GPT Image 1.5' },
  { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' },
  { value: 'grok-image', label: 'Grok' },
];

const SIZES = [
  { value: '', label: '預設' },
  { value: '256x256', label: '256x256' },
  { value: '512x512', label: '512x512' },
  { value: '1024x1024', label: '1024x1024' },
  { value: '1024x1792', label: '1024x1792' },
  { value: '1792x1024', label: '1792x1024' },
];

const TEMPLATES = [
  { label: '攝影', prompt: 'Professional photography, ultra realistic, 8K, dramatic lighting' },
  { label: '插畫', prompt: 'Digital illustration, vibrant colors, highly detailed, artstation' },
  { label: '概念藝術', prompt: 'Concept art, cinematic, epic fantasy, artstation trending' },
  { label: '水彩', prompt: 'Watercolor painting, soft brushstrokes, pastel colors, artistic' },
  { label: '賽博龐克', prompt: 'Cyberpunk city, neon lights, rain reflections, futuristic, cinematic' },
  { label: '動漫', prompt: 'Anime illustration, Japanese animation style, vibrant colors, detailed' },
];

interface ImageResult { url?: string; b64_json?: string; }
interface GenRecord {
  id: string; prompt: string; model: string; size: string;
  n: number; images: ImageResult[]; createdAt: number; duration: number;
}
interface ApiResp {
  data?: ImageResult[]; created?: number; model?: string;
  usage?: { prompt_tokens?: number; total_tokens?: number };
  error?: string;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt-image-1');
  const [size, setSize] = useState('');
  const [n, setN] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [useEnvKey, setUseEnvKey] = useState(false);
  const [apiResp, setApiResp] = useState<ApiResp | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [records, setRecords] = useState<GenRecord[]>([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [lightbox, setLightbox] = useState('');
  const [currentRec, setCurrentRec] = useState<GenRecord | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    try {
      const h = localStorage.getItem('ph'); if (h) setHistory(JSON.parse(h));
      const r = localStorage.getItem('gr'); if (r) setRecords(JSON.parse(r));
      const k = localStorage.getItem('ak'); if (k) setApiKey(k);
    } catch {}
  }, []);

  const onKey = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      (document.getElementById('gbtn') as HTMLButtonElement | null)?.click();
    }
    if (e.key === 'Escape') setLightbox('');
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  const saveKey = (k: string) => { setApiKey(k); try { localStorage.setItem('ak', k); } catch {} };

  const addHistory = (p: string) => {
    setHistory(prev => {
      const next = [p, ...prev.filter(x => x !== p)].slice(0, 15);
      try { localStorage.setItem('ph', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const addRecord = (rec: GenRecord) => {
    setRecords(prev => {
      const next = [rec, ...prev].slice(0, 50);
      try { localStorage.setItem('gr', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const deleteRecord = (id: string) => {
    setRecords(prev => {
      const next = prev.filter(r => r.id !== id);
      try { localStorage.setItem('gr', JSON.stringify(next)); } catch {}
      return next;
    });
    if (currentRec?.id === id) setCurrentRec(null);
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem('ph'); } catch {}
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('請輸入提示詞'); return; }
    if (!useEnvKey && !apiKey.trim()) { setError('請輸入 API Key'); return; }
    setError(''); setLoading(true);
    const t0 = Date.now();
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, size: size || undefined, n, apiKey, useEnvKey }),
      });
      const rem = res.headers.get('X-RateLimit-Remaining');
      if (rem !== null) setRemaining(Number(rem));
      const data: ApiResp = await res.json();
      setApiResp(data);
      if (!res.ok) { setError(data.error || '生成失敗'); return; }
      const rec: GenRecord = {
        id: Date.now().toString(), prompt, model,
        size: size || '預設', n,
        images: data.data || [],
        createdAt: Date.now(), duration: Date.now() - t0,
      };
      addRecord(rec); setCurrentRec(rec); addHistory(prompt);
      setActiveTab('generate');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '未知錯誤');
    } finally { setLoading(false); }
  };

  const download = (imgSrc: string, i: number) => {
    const a = document.createElement('a');
    a.href = imgSrc; a.download = `ai-image-${i + 1}.png`; a.target = '_blank'; a.click();
  };

  const batchDownload = (imgs: ImageResult[]) =>
    imgs.forEach((img, i) => {
      const imgSrc = img.url || (img.b64_json ? `data:image/png;base64,${img.b64_json}` : '');
      if (imgSrc) setTimeout(() => download(imgSrc, i), i * 300);
    });

  const getImgSrc = (img: ImageResult) =>
    img.url || (img.b64_json ? `data:image/png;base64,${img.b64_json}` : '');

  const formatTs = (ms: number) =>
    new Date(ms).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatDuration = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(1)}s`;

  const currentImages = currentRec?.images || [];

  return (
    <>
      <style jsx global>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{min-height:100vh;background:#0a0812;background-image:radial-gradient(ellipse 80% 50% at 20% -10%,rgba(120,60,220,.3),transparent),radial-gradient(ellipse 60% 40% at 80% 110%,rgba(30,90,220,.2),transparent);font-family:'Segoe UI',system-ui,sans-serif;color:#e2e8f0;overflow-x:hidden}
        .hdr{position:sticky;top:0;z-index:100;background:rgba(10,8,18,.9);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between}
        .logo{font-size:1.1rem;font-weight:800;background:linear-gradient(90deg,#a78bfa,#60a5fa,#34d399);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .hdr-r{display:flex;align-items:center;gap:10px}
        .rbadge{font-size:.72rem;color:#64748b;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:3px 10px}
        .rbadge.low{color:#f87171;border-color:rgba(248,113,113,.3)}
        .layout{display:grid;grid-template-columns:350px 1fr;min-height:calc(100vh - 56px)}
        @media(max-width:900px){.layout{grid-template-columns:1fr}.sidebar{border-right:none;border-bottom:1px solid rgba(255,255,255,.06);position:static;height:auto;overflow-y:visible}}
        .sidebar{border-right:1px solid rgba(255,255,255,.06);padding:18px;overflow-y:auto;position:sticky;top:56px;height:calc(100vh - 56px)}
        .sidebar::-webkit-scrollbar{width:4px}.sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        .slabel{font-size:.67rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6366f1;margin-bottom:7px;margin-top:16px;display:flex;align-items:center;gap:6px}
        .slabel:first-child{margin-top:0}.slabel::after{content:'';flex:1;height:1px;background:rgba(99,102,241,.2)}
        label{display:block;font-size:.76rem;font-weight:600;color:#94a3b8;margin-bottom:5px}
        input,select,textarea{width:100%;padding:9px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:9px;color:#e2e8f0;font-size:.87rem;outline:none;transition:border-color .15s,background .15s;font-family:inherit}
        input:focus,select:focus,textarea:focus{border-color:rgba(124,58,237,.6);background:rgba(255,255,255,.07);box-shadow:0 0 0 2px rgba(124,58,237,.1)}
        textarea{min-height:88px;resize:vertical;line-height:1.6}
        select option{background:#1a1530}
        .fg{margin-bottom:11px}.fr{display:grid;grid-template-columns:1fr 1fr;gap:9px}
        .kw{position:relative}.kw input{padding-right:40px}
        .ebtn{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#64748b;font-size:.95rem;padding:3px;transition:color .15s}.ebtn:hover{color:#94a3b8}
        .crow{display:flex;align-items:center;gap:8px;margin-top:8px;cursor:pointer}.crow input{width:auto;margin:0;cursor:pointer}.crow span{font-size:.77rem;color:#64748b}
        .pmeta{display:flex;justify-content:space-between;align-items:center;margin-top:3px}
        .pcount{font-size:.69rem;color:#475569}
        .twrap{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
        .tbtn{padding:3px 9px;font-size:.71rem;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:20px;color:#818cf8;cursor:pointer;transition:all .12s}.tbtn:hover{background:rgba(99,102,241,.22);color:#a5b4fc;border-color:rgba(99,102,241,.4)}
        .gbtn{width:100%;margin-top:14px;padding:12px;background:linear-gradient(135deg,#7c3aed,#2563eb);border:none;border-radius:11px;color:#fff;font-size:.92rem;font-weight:700;cursor:pointer;transition:opacity .15s,transform .1s,box-shadow .15s;letter-spacing:.02em;box-shadow:0 4px 20px rgba(124,58,237,.35)}
        .gbtn:hover:not(:disabled){opacity:.9;transform:translateY(-1px);box-shadow:0 8px 28px rgba(124,58,237,.5)}
        .gbtn:disabled{opacity:.45;cursor:not-allowed;transform:none}
        .spin{display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:7px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .khint{font-size:.7rem;color:#475569;text-align:center;margin-top:5px}
        .ebox{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:9px;padding:9px 12px;color:#fca5a5;margin-top:10px;font-size:.84rem}
        .main{padding:24px;overflow-y:auto}
        .tabs{display:flex;gap:3px;margin-bottom:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px;padding:4px;width:fit-content}
        .tab{padding:6px 16px;border:none;border-radius:8px;cursor:pointer;font-size:.83rem;font-weight:600;transition:all .15s;color:#64748b;background:transparent}.tab.on{background:rgba(124,58,237,.28);color:#c4b5fd}.tab:hover:not(.on){color:#94a3b8}
        .card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px;margin-bottom:18px}
        .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .ct{font-size:.82rem;font-weight:700;color:#c4b5fd;letter-spacing:.02em}
        .igrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
        .icard{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden;transition:transform .15s,border-color .15s;cursor:pointer}.icard:hover{transform:translateY(-2px);border-color:rgba(124,58,237,.4)}
        .icard img{width:100%;display:block;aspect-ratio:1;object-fit:cover}
        .ifoot{padding:8px 10px;display:flex;justify-content:space-between;align-items:center}
        .ilabel{font-size:.75rem;color:#94a3b8}
        .dlbtn{background:rgba(167,139,250,.15);border:1px solid rgba(167,139,250,.3);color:#a78bfa;border-radius:7px;padding:4px 10px;font-size:.75rem;cursor:pointer;transition:background .15s}.dlbtn:hover{background:rgba(167,139,250,.25)}
        .empty{text-align:center;color:#475569;padding:40px 20px;font-size:.85rem}
        .rlist{max-height:400px;overflow-y:auto}
        .ritem{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px;margin-bottom:10px;cursor:pointer;transition:border-color .15s}.ritem:hover{border-color:rgba(124,58,237,.4)}
        .ritem.on{border-color:rgba(124,58,237,.6);background:rgba(124,58,237,.1)}
        .rmeta{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
        .rmtag{font-size:.7rem;color:#64748b;background:rgba(255,255,255,.05);padding:2px 7px;border-radius:4px}
        .rprompt{font-size:.8rem;color:#94a3b8;margin-top:6px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .rthumbs{display:flex;gap:4px;margin-top:8px}
        .rthumb{width:40px;height:40px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,.1)}
        .rdel{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171;border-radius:6px;padding:3px 8px;font-size:.7rem;cursor:pointer;margin-left:auto}.rdel:hover{background:rgba(239,68,68,.2)}
        .lb{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:200;display:flex;align-items:center;justify-content:center;cursor:zoom-out}
        .lb img{max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
        .lbclose{position:absolute;top:20px;right:20px;background:rgba(255,255,255,.1);border:none;color:#fff;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:1.2rem}
        .anah{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .anabtn{background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);color:#818cf8;border-radius:7px;padding:5px 12px;font-size:.78rem;cursor:pointer}.anabtn:hover{background:rgba(99,102,241,.25)}
        .pre{background:rgba(0,0,0,.3);padding:12px;border-radius:8px;overflow:auto;font-size:.8rem;color:#a5b4fc;white-space:pre-wrap;word-break:break-all;max-height:300px}
        .metainfo{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px}
        .metatag{font-size:.75rem;color:#64748b;display:flex;align-items:center;gap:4px}
        .hrow{display:flex;gap:6px;margin-bottom:6px;align-items:center}
        .hbtn{flex:1;padding:6px 10px;font-size:.75rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:6px;color:#94a3b8;text-align:left;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hbtn:hover{background:rgba(255,255,255,.1);color:#e2e8f0}
        .hclear{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171;border-radius:6px;padding:6px 10px;font-size:.72rem;cursor:pointer}.hclear:hover{background:rgba(239,68,68,.2)}
      `}</style>

      <header className="hdr">
        <div className="logo">AI Image Generator</div>
        <div className="hdr-r">
          {remaining !== null && (
            <span className={`rbadge${remaining < 5 ? ' low' : ''}`}>
              剩餘 {remaining}/20 次
            </span>
          )}
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="slabel">API 設定</div>
          <div className="fg">
            <label>API Key</label>
            <div className="kw">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="輸入 API Key"
                value={apiKey}
                onChange={e => saveKey(e.target.value)}
              />
              <button className="ebtn" onClick={() => setShowKey(v => !v)}>
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            <label className="crow">
              <input
                type="checkbox"
                checked={useEnvKey}
                onChange={e => setUseEnvKey(e.target.checked)}
              />
              <span>使用伺服器端 API Key</span>
            </label>
            {!useEnvKey && <div className="khint">Key 僅在本地使用，不會上傳</div>}
          </div>

          <div className="slabel">提示詞</div>
          <div className="twrap">
            {TEMPLATES.map(t => (
              <button key={t.label} className="tbtn" onClick={() => setPrompt(p => p ? `${p}, ${t.prompt}` : t.prompt)}>
                {t.label}
              </button>
            ))}
          </div>
          {history.length > 0 && (
            <div className="fg">
              <label>歷史記錄</label>
              <div className="hrow">
                <select
                  className="hbtn"
                  value=""
                  onChange={e => { if (e.target.value) setPrompt(e.target.value); }}
                >
                  <option value="">選擇歷史...</option>
                  {history.map((h, i) => <option key={i} value={h}>{h.slice(0, 50)}...</option>)}
                </select>
                <button className="hclear" onClick={clearHistory}>清除</button>
              </div>
            </div>
          )}
          <div className="fg">
            <label>Prompt</label>
            <textarea
              placeholder="描述你想要生成的圖片..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <div className="pmeta">
              <span className="pcount">{prompt.length} 字</span>
            </div>
          </div>

          <div className="slabel">生成設定</div>
          <div className="fr">
            <div className="fg">
              <label>模型</label>
              <select value={model} onChange={e => setModel(e.target.value)}>
                {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>尺寸</label>
              <select value={size} onChange={e => setSize(e.target.value)}>
                {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="fg">
            <label>數量 (1-4)</label>
            <input type="number" min={1} max={4} value={n} onChange={e => setN(Math.min(4, Math.max(1, Number(e.target.value))))} />
          </div>

          <button id="gbtn" className="gbtn" onClick={handleGenerate} disabled={loading}>
            {loading ? <><span className="spin" />生成中...</> : '✨ 生成圖片'}
          </button>
          <div className="khint">快捷鍵：Ctrl + Enter</div>
          {error && <div className="ebox">{error}</div>}
        </aside>

        <main className="main">
          <div className="tabs">
            <button className={`tab${activeTab === 'generate' ? ' on' : ''}`} onClick={() => setActiveTab('generate')}>
              生成結果
            </button>
            <button className={`tab${activeTab === 'history' ? ' on' : ''}`} onClick={() => setActiveTab('history')}>
              歷史記錄 ({records.length})
            </button>
          </div>

          {activeTab === 'generate' && (
            <>
              {currentImages.length > 0 ? (
                <div className="card">
                  <div className="ch">
                    <span className="ct">生成結果 ({currentImages.length} 張)</span>
                    <button className="dlbtn" onClick={() => batchDownload(currentRec!.images)}>批次下載</button>
                  </div>
                  <div className="igrid">
                    {currentImages.map((img, i) => {
                      const imgSrc = getImgSrc(img);
                      return (
                        <div key={i} className="icard" onClick={() => setLightbox(imgSrc)}>
                          <img src={imgSrc} alt={`Image ${i + 1}`} />
                          <div className="ifoot">
                            <span className="ilabel">#{i + 1}</span>
                            <button className="dlbtn" onClick={e => { e.stopPropagation(); download(imgSrc, i); }}>下載</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {currentRec && (
                    <div className="metainfo">
                      <span className="metatag">📌 {currentRec.model}</span>
                      <span className="metatag">📐 {currentRec.size}</span>
                      <span className="metatag">⏱️ {formatDuration(currentRec.duration)}</span>
                      <span className="metatag">🕐 {formatTs(currentRec.createdAt)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card">
                  <div className="empty">輸入提示詞並點擊「生成圖片」開始</div>
                </div>
              )}

              {apiResp && (
                <div className="card">
                  <div className="anah">
                    <span className="ct">API 分析</span>
                    <button className="anabtn" onClick={() => setShowAnalysis(v => !v)}>
                      {showAnalysis ? '隱藏' : '顯示'}
                    </button>
                  </div>
                  {showAnalysis && <pre className="pre">{JSON.stringify(apiResp, null, 2)}</pre>}
                  {apiResp.model && <span className="metatag">📌 模型: {apiResp.model}</span>}
                  {apiResp.usage && (
                    <span className="metatag">📊 Tokens: {apiResp.usage.total_tokens || 'N/A'}</span>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div className="card">
              <div className="ch">
                <span className="ct">生成歷史 ({records.length})</span>
              </div>
              {records.length > 0 ? (
                <div className="rlist">
                  {records.map(rec => (
                    <div
                      key={rec.id}
                      className={`ritem${currentRec?.id === rec.id ? ' on' : ''}`}
                      onClick={() => { setCurrentRec(rec); setActiveTab('generate'); }}
                    >
                      <div className="rmeta">
                        <span className="rmtag">{rec.model}</span>
                        <span className="rmtag">{rec.size}</span>
                        <span className="rmtag">{formatDuration(rec.duration)}</span>
                        <span className="rmtag">{formatTs(rec.createdAt)}</span>
                        <button className="rdel" onClick={e => { e.stopPropagation(); deleteRecord(rec.id); }}>刪除</button>
                      </div>
                      <div className="rprompt">{rec.prompt}</div>
                      <div className="rthumbs">
                        {rec.images.slice(0, 4).map((img, i) => (
                          <img key={i} className="rthumb" src={getImgSrc(img)} alt="" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">尚無生成記錄</div>
              )}
            </div>
          )}
        </main>
      </div>

      {lightbox && (
        <div className="lb" onClick={() => setLightbox('')}>
          <button className="lbclose" onClick={() => setLightbox('')}>×</button>
          <img src={lightbox} alt="Preview" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
