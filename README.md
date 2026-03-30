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

## 技術棧

- Next.js 14 (App Router)
- TypeScript
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

## API 端點

專案包含一個 API 代理端點：

- `POST /api/generate` - 生成圖片

請求格式：
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

本專案不需要額外的環境變數，API Key 會由使用者在瀏覽器端輸入。

## 授權

MIT License