# 🚀 Chrome 擴充功能上架檢查清單

## ✅ 準備工作

### 1. 開發者帳號
- [ ] 註冊 Chrome Web Store 開發者帳號
- [ ] 支付一次性註冊費用 ($5 USD)
- [ ] 驗證開發者身份

### 2. 檔案準備
- [x] ✅ manifest.json (已準備)
- [x] ✅ content.js (已準備)
- [x] ✅ styles.css (已準備)
- [x] ✅ 圖示檔案 (16px, 48px, 128px)
- [x] ✅ 語言檔案 (en.json, zh-TW.json)
- [x] ✅ 套件檔案 (twitter-to-discord-extension.zip)

## 📝 商店資訊填寫

### 基本資訊
- **名稱**: Twitter to Discord
- **摘要**: AI-powered Twitter content sharing to Discord
- **描述**: 使用 store-description.md 中的內容
- **類別**: 生產力工具
- **語言**: 英文、繁體中文

### 圖片需求
- [ ] **主要截圖** (1280x800): 展示擴充功能使用畫面
- [ ] **小圖示** (128x128): 使用現有 icon128.png
- [ ] **宣傳圖片** (440x280): 商店橫幅

### 詳細資訊
- [ ] **隱私政策**: 使用 PRIVACY_POLICY.md
- [ ] **支援網站**: GitHub 專案頁面
- [ ] **聯絡資訊**: guanyulin@freema.co.jp

## 🔍 審核前檢查

### 功能測試
- [ ] 在 Twitter.com 上測試按鈕顯示
- [ ] 測試設定對話框功能
- [ ] 測試語言切換
- [ ] 測試 Discord 發送功能
- [ ] 測試錯誤處理

### 程式碼檢查
- [ ] 無 console.error 或未處理的錯誤
- [ ] 所有硬編碼文字已國際化
- [ ] 表單驗證正常運作
- [ ] 隱私政策符合要求

### 權限檢查
- [ ] 只請求必要權限
- [ ] 權限說明清楚
- [ ] 符合 Chrome 政策

## 📤 上架步驟

### 1. 上傳套件
1. 前往 [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/)
2. 點擊「新增項目」
3. 上傳 `twitter-to-discord-extension.zip`
4. 等待上傳完成

### 2. 填寫商店資訊
1. **基本資訊**
   - 名稱: Twitter to Discord
   - 摘要: AI-powered Twitter content sharing to Discord
   - 描述: 使用 store-description.md

2. **圖片**
   - 主要截圖: 1280x800
   - 小圖示: 128x128
   - 宣傳圖片: 440x280

3. **詳細資訊**
   - 隱私政策: 上傳 PRIVACY_POLICY.md
   - 支援網站: GitHub 專案 URL
   - 聯絡資訊: guanyulin@freema.co.jp

### 3. 提交審核
1. 檢查所有資訊是否正確
2. 點擊「提交審核」
3. 等待 Google 審核 (通常 1-3 個工作天)

## 🎯 審核後續

### 審核通過
- [ ] 發布擴充功能
- [ ] 監控用戶回饋
- [ ] 準備更新版本

### 審核被拒
- [ ] 查看拒絕原因
- [ ] 修正問題
- [ ] 重新提交

## 📊 上架後維護

### 監控指標
- [ ] 下載數量
- [ ] 用戶評分
- [ ] 錯誤報告
- [ ] 功能請求

### 更新計劃
- [ ] 定期更新 AI 模型支援
- [ ] 新增語言支援
- [ ] 改善用戶體驗
- [ ] 修復錯誤

## 🔗 重要連結

- [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/)
- [Chrome 擴充功能政策](https://developer.chrome.com/docs/webstore/program-policies/)
- [Chrome 擴充功能最佳實踐](https://developer.chrome.com/docs/extensions/mv3/best-practices/)
