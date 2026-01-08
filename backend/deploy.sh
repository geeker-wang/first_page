#!/bin/bash

# 知乎热榜后端部署脚本

set -e

echo "=========================================="
echo "🚀 知乎热榜后端部署脚本"
echo "=========================================="

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then
  echo "⚠️  不建议使用 root 用户运行，请使用普通用户"
fi

# 1. 检查 Node.js
echo ""
echo "步骤 1: 检查 Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo "✅ Node.js 版本: $NODE_VERSION"
else
  echo "❌ 未找到 Node.js，请先安装 Node.js 18+"
  exit 1
fi

# 2. 安装依赖
echo ""
echo "步骤 2: 安装依赖..."
npm install
echo "✅ 依赖安装完成"

# 3. 配置环境变量
echo ""
echo "步骤 3: 配置环境变量..."
if [ ! -f .env ]; then
  echo "⚠️  未找到 .env 文件，已创建默认配置"
  echo "请编辑 .env 文件配置正确的参数"
  exit 1
else
  echo "✅ .env 文件已存在"
fi

# 4. 创建数据目录
echo ""
echo "步骤 4: 创建数据目录..."
mkdir -p data
echo "✅ 数据目录创建完成"

# 5. 选择部署方式
echo ""
echo "步骤 5: 选择部署方式"
echo "1) 使用 PM2 (推荐)"
echo "2) 使用 Docker"
echo "3) 直接运行 (测试)"
read -p "请选择 (1/2/3): " choice

case $choice in
  1)
    echo ""
    echo "使用 PM2 部署..."
    if ! command -v pm2 &> /dev/null; then
      echo "安装 PM2..."
      npm install -g pm2
    fi

    # 检查是否已存在进程
    if pm2 list | grep -q "zhihu-hot"; then
      echo "停止现有进程..."
      pm2 stop zhihu-hot
    fi

    # 启动应用
    pm2 start server.js --name zhihu-hot
    pm2 save
    pm2 startup

    echo ""
    echo "✅ PM2 部署完成！"
    echo "查看状态: pm2 status"
    echo "查看日志: pm2 logs zhihu-hot"
    echo "重启服务: pm2 restart zhihu-hot"
    ;;

  2)
    echo ""
    echo "使用 Docker 部署..."
    if ! command -v docker &> /dev/null; then
      echo "❌ 未找到 Docker，请先安装"
      exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
      echo "❌ 未找到 Docker Compose"
      exit 1
    fi

    echo "构建并启动容器..."
    docker-compose up -d --build

    echo ""
    echo "✅ Docker 部署完成！"
    echo "查看状态: docker-compose ps"
    echo "查看日志: docker-compose logs -f"
    echo "停止服务: docker-compose down"
    ;;

  3)
    echo ""
    echo "直接运行 (测试模式)..."
    echo "启动命令: node server.js"
    echo "按 Ctrl+C 停止"
    node server.js
    ;;

  *)
    echo "❌ 无效选择"
    exit 1
    ;;
esac

echo ""
echo "=========================================="
echo "🎉 部署完成！"
echo "=========================================="
echo "API 地址: http://$(hostname -I | awk '{print $1}'):3000"
echo "健康检查: curl http://localhost:3000/api/health"
echo "=========================================="
