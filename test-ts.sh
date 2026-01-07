#!/bin/bash

# TypeScript 测试脚本

echo "🔍 开始 TypeScript 配置测试..."

# 检查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查 TypeScript 配置文件
echo "📋 检查 TypeScript 配置文件..."
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json 存在"
else
    echo "❌ tsconfig.json 不存在"
    exit 1
fi

# 检查类型定义文件
echo "📋 检查类型定义文件..."
if [ -f "src/env.d.ts" ]; then
    echo "✅ src/env.d.ts 存在"
else
    echo "❌ src/env.d.ts 不存在"
    exit 1
fi

# 检查 TypeScript 入口文件
echo "📋 检查 TypeScript 入口文件..."
if [ -f "src/main.ts" ]; then
    echo "✅ src/main.ts 存在"
else
    echo "❌ src/main.ts 不存在"
    exit 1
fi

# 检查 Vite 配置
echo "📋 检查 Vite 配置..."
if [ -f "vite.config.ts" ]; then
    echo "✅ vite.config.ts 存在"
else
    echo "❌ vite.config.ts 不存在"
    exit 1
fi

# 运行类型检查
echo "🔍 运行 TypeScript 类型检查..."
npm run type-check

if [ $? -eq 0 ]; then
    echo "✅ TypeScript 类型检查通过！"
else
    echo "❌ TypeScript 类型检查失败"
    exit 1
fi

# 尝试构建
echo "🔨 尝试构建项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "🎉 项目构建成功！"
    echo "📱 您可以使用 'npm run dev' 启动开发服务器"
    echo "🚀 或者推送代码到 GitHub 进行自动部署"
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi