#!/bin/bash

# Chrome 擴充功能打包腳本
echo "🚀 開始打包 Chrome 擴充功能..."

# 建立打包目錄
mkdir -p dist

# 複製必要檔案
cp manifest.json dist/
cp content.js dist/
cp styles.css dist/
cp icon16.png dist/
cp icon48.png dist/
cp icon128.png dist/
cp -r locales dist/

# 建立 ZIP 檔案
cd dist
zip -r ../twitter-to-discord-extension.zip *
cd ..

echo "✅ 打包完成！"
echo "📦 套件檔案：twitter-to-discord-extension.zip"
echo "📁 套件目錄：dist/"
echo ""
echo "🎯 下一步："
echo "1. 前往 https://chrome.google.com/webstore/devconsole/"
echo "2. 點擊「新增項目」"
echo "3. 上傳 twitter-to-discord-extension.zip"
echo "4. 填寫商店資訊"
echo "5. 提交審核"
