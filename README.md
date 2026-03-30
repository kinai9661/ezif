# AI 圖片生成器

專業的 AI 圖片生成網站，支援 GPT-Image-1 和 Gemini 3.1 Flash Image Preview 模型。

## 功能特色

- 支援 GPT-Image-1 和 Gemini 3.1 Flash Image Preview 模型
- 支援多種圖片尺寸：256x256、512x512、1024x1024、1024x1792、1792x1024
- 支援一次生成多張圖片
- 支援 API Key 輸入（本地端處理，不儲存）
- 支援使用伺服器端環境變數的 API Key
- 支援圖片下載
- 專業的深色 UI 設計
- **後台管理系統**（模型管理、API 設定、速率限制）

## 技術棧

- Next.js 14 (Pages Router)
- TypeScript
- Vercel KV（持久化儲存）
- Vercel 部署

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

開啟 http://localhost:3000

## 部署到 Vercel

### 方法一：透過 Vercel CLI 部署

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入 Vercel
vercel login

# 部署
vercel
```

### 方法二：透過 GitHub 部署

1. 將專案推送到 GitHub
2. 前往 [Vercel](https://vercel.com) 並使用 GitHub 登入
3. 點擊 "New Project" 並選擇你的 GitHub 倉庫
4. 點擊 "Deploy"

### 方法三：透過 Vercel Dashboard 上傳

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "New Project"
3. 選擇 "Import Project"
4. 選擇 "Continue with GitHub" 或上傳 ZIP 檔案

## 使用說明

1. 在輸入框中輸入你的 API Key（從 https://ai.ezif.in 獲取）
2. 輸入圖片描述 prompt
3. 選擇模型（GPT-Image-1 或 Gemini 3.1 Flash Image Preview）
4. 選擇圖片尺寸（可選）
5. 選擇生成數量（預設 1 張）
6. 點擊「生成圖片」按鈕
7. 等待生成完成，下載圖片

## 後台管理系統

部署後可透過 `/admin` 路徑訪問後台管理系統。

### 首次設定

1. 在 Vercel Dashboard 建立 KV 資料庫：
   - 前往 Storage → Create Database → KV
   - 選擇與專案相同的區域
2. 將 KV 資料庫連結到專案：
   - 在 KV 設定頁面點擊 "Connect to Project"
   - 選擇你的專案
3. 設定環境變數（Settings → Environment Variables）：
   - `ADMIN_PASSWORD`: 後台管理員登入密碼
   - `JWT_SECRET`: JWT 簽名金鑰（建議 32 字元以上隨機字串）
4. 重新部署專案使環境變數生效

### 後台功能

- **模型管理**：新增、編輯、刪除、啟用/停用模型，調整模型順序
- **API 設定**：設定 API Base URL、API Key、速率限制
- **密碼變更**：變更管理員登入密碼

### 預設模型

首次登入後台時，系統會載入預設模型清單。你可以在後台管理頁面自訂模型。

## API 端點

### 公開 API

- `POST /api/generate` - 生成圖片
- `GET /api/public/models` - 取得啟用的模型清單

### 後台 API（需登入）

- `POST /api/admin/auth` - 登入
- `DELETE /api/admin/auth` - 登出
- `PUT /api/admin/auth` - 變更密碼
- `GET /api/admin/models` - 取得所有模型
- `POST /api/admin/models` - 新增模型
- `PUT /api/admin/models` - 更新模型順序
- `DELETE /api/admin/models?id=xxx` - 刪除模型
- `GET /api/admin/settings` - 取得設定
- `PUT /api/admin/settings` - 更新設定

### 生成圖片請求格式

```json
{
  "prompt": "A futuristic city skyline at sunset",
  "model": "gpt-image-1",
  "size": "1024x1024",
  "n": 1,
  "apiKey": "your-api-key"
}
```

## 環境變數

| 變數名稱 | 必填 | 說明 |
|---------|------|------|
| `ADMIN_PASSWORD` | 是 | 後台管理員登入密碼 |
| `JWT_SECRET` | 是 | JWT 簽名金鑰（建議 32 字元以上） |
| `KV_REST_API_URL` | 自動 | Vercel KV URL（連結 KV 後自動注入） |
| `KV_REST_API_TOKEN` | 自動 | Vercel KV Token（連結 KV 後自動注入） |
| `API_KEY` | 否 | 預設 API Key（可在後台設定覆蓋） |

## 授權

MIT License
