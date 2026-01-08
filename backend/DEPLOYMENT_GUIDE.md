# 🔥 知乎热榜后端部署指南

## 📋 部署方式对比

| 方式 | 难度 | 成本 | 适用场景 |
|------|------|------|----------|
| **PM2** | ⭐⭐ | 免费 | VPS、个人服务器 |
| **Docker** | ⭐⭐⭐ | 免费 | 有 Docker 环境 |
| **云函数** | ⭐⭐ | 按量计费 | Serverless 部署 |

---

## 🚀 方式一：PM2 部署（推荐）

### 1. 准备 VPS
```bash
# 购买 VPS（推荐）
- 阿里云 ECS
- 腾讯云 CVM
- Vultr / DigitalOcean
- 最低配置: 1核 1GB 内存
```

### 2. 安装 Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v  # 应该显示 v18.x.x
npm -v
```

### 3. 上传代码
```bash
# 方式 A: 使用 git
git clone https://github.com/geeker-wang/first_page.git
cd first_page/backend

# 方式 B: 使用 scp
scp -r backend/ user@your-server:/path/to/zhihu-hot
```

### 4. 运行部署脚本
```bash
cd backend
chmod +x deploy.sh
./deploy.sh

# 选择 1 (PM2)
```

### 5. 配置反向代理（可选但推荐）

#### 使用 Nginx
```bash
sudo apt install nginx
```

创建配置文件 `/etc/nginx/sites-available/zhihu-hot`:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/zhihu-hot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🐳 方式二：Docker 部署

### 1. 安装 Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt install docker-compose-plugin
```

### 2. 部署
```bash
cd backend
./deploy.sh

# 选择 2 (Docker)
```

### 3. Docker 常用命令
```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新代码后重新部署
docker-compose up -d --build
```

---

## ☁️ 方式三：云函数部署（Serverless）

### 腾讯云 SCF
```bash
# 1. 安装 SCF CLI
npm install -g @serverless/cli

# 2. 创建项目
scf init zhihu-hot-backend

# 3. 部署
scf deploy
```

### 阿里云 FC
```bash
# 1. 安装 CLI
npm install -g @alicloud/fun

# 2. 部署
fun deploy
```

**注意**: 云函数需要修改代码适配 Serverless 环境

---

## 🎯 部署后的配置

### 1. 修改前端配置

编辑前端的 `.env.production` 或直接在页面配置：

```
后端地址: http://your-server-ip:3000
```

如果使用了 Nginx 反向代理：
```
后端地址: https://your-domain.com
```

### 2. 配置定时任务

PM2 会自动处理，但需要确保：
- 服务器时间正确
- 服务持续运行

### 3. 安全配置

#### 修改 .env
```bash
# 设置强密码（如果需要）
PORT=3000

# 限制 CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com

# 生产环境建议添加 API Key 验证
# API_KEY=your-secure-key
```

#### 防火墙配置
```bash
# 只开放必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 🔍 验证部署

### 1. 测试 API
```bash
# 健康检查
curl http://localhost:3000/api/health

# 手动抓取
curl -X POST http://localhost:3000/api/fetch

# 查看历史
curl http://localhost:3000/api/history

# 查看统计
curl http://localhost:3000/api/stats
```

### 2. 前端测试
1. 访问前端页面
2. 配置后端地址
3. 点击"测试连接"
4. 点击"手动抓取"
5. 查看数据是否正常显示

---

## 📊 监控和维护

### PM2 监控
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs zhihu-hot

# 监控资源
pm2 monit

# 重启服务
pm2 restart zhihu-hot

# 停止服务
pm2 stop zhihu-hot
```

### 数据库维护
```bash
# 查看数据库文件大小
ls -lh data/zhihu-hot.db

# 备份数据库
cp data/zhihu-hot.db data/zhihu-hot.db.backup.$(date +%Y%m%d)

# 清理旧数据（保留最近30天）
# 需要手动执行 SQL
```

### 日志轮转
```bash
# 安装 logrotate
sudo apt install logrotate

# 创建配置
sudo nano /etc/logrotate.d/zhihu-hot

# 配置内容
/home/user/zhihu-hot/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 user user
}
```

---

## 🐛 故障排除

### 问题 1: 端口被占用
```bash
# 查看占用端口的进程
lsof -i:3000

# 杀死进程
kill -9 <PID>

# 或修改 .env 中的 PORT
```

### 问题 2: PM2 无法启动
```bash
# 检查 Node.js 版本
node -v  # 需要 18+

# 重新安装依赖
npm install

# 手动启动测试
node server.js
```

### 问题 3: 数据库错误
```bash
# 检查权限
ls -la data/

# 修复权限
chmod 755 data/
chmod 644 data/zhihu-hot.db

# 删除重建（会丢失数据）
rm data/zhihu-hot.db
# 重启服务会自动重建
```

### 问题 4: CORS 错误
```bash
# 检查 .env 中的 ALLOWED_ORIGINS
# 确保包含前端域名
# 多个域名用逗号分隔
```

### 问题 5: 定时任务不执行
```bash
# 检查服务器时间
date

# 查看 PM2 运行时间
pm2 info zhihu-hot

# 手动触发测试
curl -X POST http://localhost:3000/api/fetch
```

---

## 🚀 性能优化

### 1. 数据库优化
```sql
-- 定期清理旧数据（保留最近100条快照）
DELETE FROM hot_items WHERE snapshot_id NOT IN (
  SELECT snapshot_id FROM hot_snapshots
  ORDER BY timestamp DESC LIMIT 100
);
DELETE FROM hot_snapshots WHERE snapshot_id NOT IN (
  SELECT snapshot_id FROM hot_snapshots
  ORDER BY timestamp DESC LIMIT 100
);
```

### 2. PM2 配置优化
```bash
# 创建 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'zhihu-hot',
    script: 'server.js',
    instances: 1,
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512',
    env: {
      NODE_ENV: 'production'
    }
  }]
}

# 启动
pm2 start ecosystem.config.js
```

### 3. Nginx 缓存
```nginx
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_cache zhihu_cache;
    proxy_cache_valid 200 5m;  # 缓存5分钟
}
```

---

## 📈 扩展功能

### 1. 添加 API 认证
```javascript
// 在 server.js 中添加中间件
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ success: false, message: '未授权' });
  }
  next();
});
```

### 2. 添加数据导出
```javascript
// 新增 API 端点
app.get('/api/export', (req, res) => {
  // 导出为 CSV/JSON
});
```

### 3. 添加数据可视化
```javascript
// 新增统计 API
app.get('/api/analytics', (req, res) => {
  // 返回趋势分析数据
});
```

---

## 📞 技术支持

如有问题，请检查：
1. ✅ 服务器是否正常运行
2. ✅ 端口是否开放
3. ✅ 数据库权限是否正确
4. ✅ 环境变量是否配置
5. ✅ 日志是否有错误信息

---

*版本: 1.0.0*
*更新时间: 2026-01-08*
