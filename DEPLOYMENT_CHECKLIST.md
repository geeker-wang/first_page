# 📋 部署检查清单 - V2 新架构

## 🎯 快速开始

**一句话总结**: 部署后端服务到 VPS，前端部署到 GitHub Pages，配置连接即可使用。

---

## 📦 完整部署流程

### 阶段一：后端部署（VPS/云服务器）

#### 1. 准备环境 ✅
- [ ] 购买 VPS（阿里云/腾讯云/Vultr）
- [ ] 系统：Ubuntu 20.04+ 或 CentOS 7+
- [ ] 配置：1核 1GB 内存（最低配置）
- [ ] 开放端口：22 (SSH), 80/443 (HTTP/HTTPS), 3000 (API)

#### 2. 安装 Node.js ✅
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v  # v18.x.x
npm -v
```

#### 3. 上传代码 ✅
```bash
# 方式 A: 使用 Git（推荐）
git clone https://github.com/geeker-wang/first_page.git
cd first_page/backend

# 方式 B: 使用 SCP
scp -r backend/ user@your-server:/path/to/zhihu-hot
```

#### 4. 配置环境变量 ✅
```bash
cd backend
cp .env.example .env  # 如果有模板
# 或直接编辑 .env
nano .env
```

**必须配置**:
```bash
PORT=3000
CRON_SCHEDULE=0 */30 * * * *
ALLOWED_ORIGINS=https://geeker-wang.github.io,http://localhost:5173
```

#### 5. 安装依赖 ✅
```bash
npm install
```

#### 6. 选择部署方式 ✅

**方式 A: PM2（推荐，简单）**
```bash
# 运行部署脚本
./deploy.sh
# 选择 1

# 或手动操作
npm install -g pm2
pm2 start server.js --name zhihu-hot
pm2 save
pm2 startup
```

**方式 B: Docker**
```bash
# 运行部署脚本
./deploy.sh
# 选择 2

# 或手动操作
docker-compose up -d --build
```

#### 7. 验证后端 ✅
```bash
# 检查状态
curl http://localhost:3000/api/health

# 预期响应
{"status":"ok","timestamp":1704067200000,"version":"1.0.0"}
```

#### 8. 配置反向代理（可选但推荐）✅
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/zhihu-hot
```

**Nginx 配置**:
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

**启用配置**:
```bash
sudo ln -s /etc/nginx/sites-available/zhihu-hot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**访问地址**:
- 不用 Nginx: `http://your-server-ip:3000`
- 用 Nginx: `http://your-domain.com` 或 `https://your-domain.com`

---

### 阶段二：前端部署（GitHub Pages）

#### 1. 构建前端 ✅
```bash
cd first_page
npm install
npm run build
```

#### 2. 部署到 GitHub Pages ✅

**方式 A: 自动部署（推荐）**
```bash
npm run deploy
```

**方式 B: 手动部署**
1. 进入 GitHub 仓库设置
2. 进入 Pages 页面
3. Source 选择 `gh-pages` 分支
4. 保存

**方式 C: GitHub Actions（如果已配置）**
```bash
git add . && git commit -m "deploy" && git push
```

#### 3. 访问前端 ✅
```
https://geeker-wang.github.io/first_page/
```

---

### 阶段三：配置和测试

#### 1. 配置前端 ✅
1. 访问前端页面
2. 在"配置面板"输入后端地址：
   ```
   # 如果没用 Nginx
   http://your-server-ip:3000

   # 如果用了 Nginx
   http://your-domain.com
   # 或
   https://your-domain.com
   ```
3. 点击"保存配置"

#### 2. 测试连接 ✅
1. 点击"测试连接"
2. 应该看到：✅ 后端连接成功

#### 3. 测试抓取 ✅
1. 点击"手动抓取"
2. 等待 2-3 秒
3. 应该看到热榜数据

#### 4. 测试历史 ✅
1. 点击"从后端加载"
2. 应该看到历史记录列表

#### 5. 测试统计 ✅
1. 点击"统计信息"
2. 应该看到数据统计

---

## 🎯 功能验证清单

### 配置面板
- [ ] 可以输入后端地址
- [ ] 可以保存配置
- [ ] 可以重置配置
- [ ] 可以测试连接

### 控制面板
- [ ] 手动抓取按钮正常
- [ ] 加载数据按钮正常
- [ ] 加载最新按钮正常
- [ ] 统计信息按钮正常

### 数据展示
- [ ] 当前热榜显示正常
- [ ] 历史快照列表正常
- [ ] 可展开查看详情
- [ ] 可清空本地历史

### 状态反馈
- [ ] 成功提示（绿色）
- [ ] 警告提示（黄色）
- [ ] 错误提示（红色）
- [ ] 加载状态显示

---

## 🔧 故障排查

### 问题 1: 后端无法访问
```bash
# 检查端口是否监听
netstat -tlnp | grep 3000

# 检查防火墙
sudo ufw status
sudo ufw allow 3000

# 检查服务状态
pm2 status
# 或
docker-compose ps
```

### 问题 2: 前端连接失败
```bash
# 检查浏览器控制台错误
# 检查 CORS 配置
# 检查后端地址是否正确
```

### 问题 3: 抓取失败
```bash
# 查看后端日志
pm2 logs zhihu-hot
# 或
docker-compose logs

# 检查网络连接
curl https://api.allorigins.win/raw?url=https://www.zhihu.com/api/v3/topstory/hot-lists/total?limit=50
```

### 问题 4: 定时任务不执行
```bash
# 检查服务器时间
date

# 检查 PM2 运行时间
pm2 info zhihu-hot

# 手动触发测试
curl -X POST http://localhost:3000/api/fetch
```

### 问题 5: 数据库错误
```bash
# 检查权限
ls -la data/

# 修复权限
chmod 755 data/
chmod 644 data/zhihu-hot.db

# 查看数据库
sqlite3 data/zhihu-hot.db "SELECT COUNT(*) FROM hot_snapshots;"
```

---

## 📊 监控和维护

### 日常检查
```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs zhihu-hot

# 查看数据库大小
ls -lh data/zhihu-hot.db

# 查看磁盘空间
df -h
```

### 数据备份
```bash
# 备份数据库
cp data/zhihu-hot.db backup/zhihu-hot.db.$(date +%Y%m%d)

# 备份整个项目
tar -czf zhihu-hot-backup.tar.gz backend/
```

### 性能监控
```bash
# CPU/内存使用
pm2 monit

# 网络连接
netstat -an | grep :3000
```

---

## 🚀 生产环境优化

### 1. 添加 SSL 证书
```bash
# 使用 Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 2. 配置防火墙
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3. 设置日志轮转
```bash
sudo nano /etc/logrotate.d/zhihu-hot
```

### 4. 监控告警
```bash
# 安装监控工具（可选）
# - PM2 Plus
# - Grafana + Prometheus
# - 阿里云监控
```

---

## 📝 部署后检查

### 系统检查
- [ ] 后端服务正在运行
- [ ] 端口 3000 可访问
- [ ] 数据库文件存在
- [ ] 定时任务已启动
- [ ] 日志正常输出

### 功能检查
- [ ] 前端可访问
- [ ] 配置保存正常
- [ ] 连接测试成功
- [ ] 手动抓取成功
- [ ] 数据显示正常
- [ ] 历史记录可查
- [ ] 统计信息正确

### 性能检查
- [ ] 响应时间 < 5秒
- [ ] 内存使用 < 200MB
- [ ] CPU 使用 < 20%
- [ ] 磁盘空间充足

---

## 🎯 成功标志

✅ **部署成功**:
1. 访问前端页面正常
2. 配置后端地址成功
3. 手动抓取返回数据
4. 历史记录可查询
5. 定时任务自动执行

📊 **运行指标**:
- 响应时间: < 5秒
- 可用性: 99%+
- 数据完整性: 100%

---

## 📞 获取帮助

### 文档位置
- `backend/README.md` - 后端文档
- `backend/DEPLOYMENT_GUIDE.md` - 详细部署
- `ARCHITECTURE_V2.md` - 架构说明
- `QUICK_START_V2.md` - 快速开始

### 常见问题
1. **端口被占用** → 修改 .env 中的 PORT
2. **CORS 错误** → 检查 ALLOWED_ORIGINS
3. **数据库错误** → 检查 data/ 权限
4. **定时任务不执行** → 检查服务器时间

---

## ✅ 最终检查清单

### 部署前
- [ ] VPS 已购买并配置
- [ ] Node.js 18+ 已安装
- [ ] 代码已上传
- [ ] .env 配置完成

### 部署中
- [ ] 依赖已安装
- [ ] 服务已启动
- [ ] 端口已开放
- [ ] Nginx 配置完成（可选）

### 部署后
- [ ] 后端可访问
- [ ] 前端已部署
- [ ] 配置已保存
- [ ] 功能已测试
- [ ] 监控已设置

---

## 🎉 部署完成！

**恭喜！** 如果你完成了以上所有步骤，你的知乎热榜监控系统已经完全部署完成！

现在你可以：
1. 随时手动抓取数据
2. 查看历史记录
3. 监控热榜变化
4. 享受自动化的数据收集

---

*版本: 2.0.0*
*更新时间: 2026-01-08*
*状态: ✅ 所有代码已完成，等待部署*
