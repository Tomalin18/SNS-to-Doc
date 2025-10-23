#!/bin/bash

# Chrome 擴充功能打包腳本
echo "🚀 開始打包 Chrome 擴充功能..."

# 清理舊的打包檔案
rm -rf dist
rm -f share-to-discord-extension.zip

# 建立打包目錄
mkdir -p dist

# 複製必要檔案到 dist 目錄
cp manifest.json dist/
cp content.js dist/
cp styles.css dist/
cp icon16.png dist/
cp icon48.png dist/
cp icon128.png dist/
cp -r locales dist/

# 建立 ZIP 檔案（只包含 dist 目錄中的檔案）
cd dist
zip -r ../share-to-discord-extension.zip *
cd ..

echo "✅ 打包完成！"
echo "📦 套件檔案：share-to-discord-extension.zip"
echo "📁 套件目錄：dist/"
echo ""
echo "🔍 檢查套件內容："
unzip -l share-to-discord-extension.zip
echo ""
echo "🎯 下一步："
echo "1. 前往 https://chrome.google.com/webstore/devconsole/"
echo "2. 點擊「新增項目」"
echo "3. 上傳 share-to-discord-extension.zip"
echo "4. 填寫商店資訊"
echo "5. 提交審核"
