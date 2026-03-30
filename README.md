# AI 圖片生成器

專業的 AI 圖片生成網站，支援多個 API 供應商和多種 AI 模型。

## 功能特色

- 支援多個 API 供應商管理
- 支援多種 AI 模型（GPT-Image-1、Gemini 3.1 Flash Image Preview、Grok 等）
- 支援多種圖片尺寸：256x256、512x512、1024x1024、1024x1792、1792x1024
- 支援一次生成多張圖片
- 支援 API Key 輸入（本地端處理，不儲存）
- 支援使用伺服器端環境變數的 API Key
- 支援圖片下載
- 專業的深色 UI 設計
- **後台管理系統**（模型管理、供應商管理、API 設定、速率限制）
- **多語言支援**（繁體中文、English）
- **Google OAuth 登入**（支援 Google 帳號快速登入）

## 技術棧

- Next.js 14 (Pages Router)
- TypeScript
- Neon Postgres（持久化儲存）
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

### 登入方式

後台支援兩種登入方式：

1. **密碼登入**：使用 `ADMIN_PASSWORD` 環境變數設定的密碼
2. **Google OAuth 登入**：使用 Google 帳號快速登入（需設定 Google OAuth 環境變數）

### 首次設定

1. 在 Vercel Dashboard 建立 Postgres 資料庫（Neon）：
   - 前往 Storage → Create Database → Postgres
   - 選擇與專案相同的區域
2. 將 Postgres 資料庫連結到專案：
   - 在 Postgres 設定頁面點擊 "Connect to Project"
   - 選擇你的專案
3. 設定環境變數（Settings → Environment Variables）：
   - `ADMIN_PASSWORD`: 後台管理員登入密碼
   - `JWT_SECRET`: JWT 簽名金鑰（建議 32 字元以上隨機字串）
   - `POSTGRES_URL` 或 `DATABASE_URL`: Postgres 連線字串（自動注入）
4. 重新部署專案使環境變數生效

### 後台功能

- **模型管理**：新增、編輯、刪除、啟用/停用模型，調整模型順序，關聯供應商
- **供應商管理**：新增、編輯、刪除 API 供應商，管理供應商 API Key 和基礎 URL
- **API 設定**：設定全域 API Base URL、API Key、速率限制
- **密碼變更**：變更管理員登入密碼

### 預設模型

首次登入後台時，系統會載入預設模型清單。你可以在後台管理頁面自訂模型。

### 多語言支援

後台管理系統支援繁體中文和英文兩種語言。在後台頁面右上角可切換語言。

翻譯檔案位置：
- `lib/i18n/zh-TW.json` - 繁體中文翻譯
- `lib/i18n/en.json` - 英文翻譯

### Google OAuth 設定

若要啟用 Google 登入功能，需進行以下設定：

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google+ API
4. 建立 OAuth 2.0 認證（應用程式類型：Web 應用程式）
5. 設定授權重新導向 URI：`https://yourdomain.com/api/auth/callback/google`
6. 複製用戶端 ID 和用戶端密鑰
7. 在 Vercel 環境變數中設定：
   - `GOOGLE_CLIENT_ID`: 用戶端 ID
   - `GOOGLE_CLIENT_SECRET`: 用戶端密鑰
   - `NEXTAUTH_SECRET`: 隨機生成的 32 字元密鑰
   - `NEXTAUTH_URL`: 你的部署域名（例如 `https://yourdomain.com`）
   - `GOOGLE_ALLOWED_EMAILS`（可選）: 允許登入的 Google 帳號清單

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
- `GET /api/admin/providers` - 取得所有供應商
- `POST /api/admin/providers` - 新增供應商
- `PUT /api/admin/providers` - 更新供應商
- `DELETE /api/admin/providers` - 刪除供應商
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
| `POSTGRES_URL` 或 `DATABASE_URL` | 是 | Neon Postgres 連線字串（連結 Postgres 後自動注入） |
| `GOOGLE_CLIENT_ID` | 否 | Google OAuth 用戶端 ID（啟用 Google 登入時必填） |
| `GOOGLE_CLIENT_SECRET` | 否 | Google OAuth 用戶端密鑰（啟用 Google 登入時必填） |
| `NEXTAUTH_SECRET` | 否 | NextAuth 簽名金鑰（啟用 Google 登入時必填，建議 32 字元以上） |
| `NEXTAUTH_URL` | 否 | NextAuth 回調 URL（生產環境必填，例如 `https://yourdomain.com`） |
| `GOOGLE_ALLOWED_EMAILS` | 否 | 允許登入的 Google 帳號清單（逗號分隔，例如 `user1@gmail.com,user2@gmail.com`） |
| `API_KEY` | 否 | 預設 API Key（可在後台設定覆蓋） |
| `API_BASE_URL` | 否 | 預設 API 基礎 URL（可在後台設定覆蓋） |

## 授權

MIT License
