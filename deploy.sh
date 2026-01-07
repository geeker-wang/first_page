#!/bin/bash

# GitHub Pages 部署脚本
# 使用方法: ./deploy.sh

echo "🚀 开始部署到 GitHub Pages..."

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 请先安装 Node.js"
    exit 1
fi

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 请先安装 npm"
    exit 1
fi

echo "📦 安装依赖..."
npm install

echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 错误: 构建失败，dist 目录不存在"
    exit 1
fi

echo "✅ 构建成功！"

# 检查是否安装了 gh-pages
if ! npm list -g gh-pages &> /dev/null && ! npm list gh-pages &> /dev/null; then
    echo "📥 安装 gh-pages..."
    npm install gh-pages --save-dev
fi

echo "📤 部署到 GitHub Pages..."
npx gh-pages -d dist

if [ $? -eq 0 ]; then
    echo "🎉 部署成功！"
    echo "📱 访问: https://geeker-wang.github.io/first_page/"
else
    echo "❌ 部署失败，请检查错误信息"
    exit 1
fi