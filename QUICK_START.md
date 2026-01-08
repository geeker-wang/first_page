# 🚀 知乎热榜监控 - 快速开始

## 📋 一分钟启动指南

### 1️⃣ 获取 GitHub Token
```
GitHub → Settings → Developer settings → Personal access tokens
→ Generate new token (classic)
→ 勾选: repo
→ 生成并复制
```

### 2️⃣ 访问网站
```
https://geeker-wang.github.io/first_page/
```

### 3️⃣ 填写配置
```
GitHub 用户名: geeker-wang
仓库名: first_page
Token: ghp_xxxxxxxxxxxx
数据路径: data/zhihu-hot.json
→ 点击"保存配置"
```

### 4️⃣ 测试功能
```
→ 点击"手动抓取"
→ 等待 2-3 秒
→ 查看热榜数据
```

### 5️⃣ 启用自动
```
→ 设置间隔: 30 分钟
→ 点击"启用自动抓取"
→ 页面保持打开
```

## 🎯 核心功能

| 功能 | 操作 | 结果 |
|------|------|------|
| 手动抓取 | 点击按钮 | 立即获取热榜 |
| 自动抓取 | 启用开关 | 定时获取热榜 |
| 数据保存 | 自动 | 保存到 GitHub |
| 历史查看 | 展开快照 | 查看过去数据 |
| 数据查询 | 从 GitHub 加载 | 获取历史记录 |

## 📱 页面布局

```
顶部: 配置面板
  ↓
中间: 控制面板
  ↓
下方: 当前热榜 (Top 30)
  ↓
底部: 历史快照
```

## ⚡ 快捷操作

### 手动抓取
```
配置 → 手动抓取 → 查看数据
```

### 自动监控
```
配置 → 设置间隔 → 启用自动 → 保持页面打开
```

### 查看历史
```
从 GitHub 加载 → 展开快照 → 查看详情
```

## 🔍 数据位置

**GitHub 仓库文件**:
```
/data/zhihu-hot.json
```

**本地存储**:
```
localStorage:
  - zhihu_config (配置)
  - zhihu_auto_fetch (状态)
  - zhihu_interval (间隔)
```

## ⚠️ 重要提示

1. **Token 安全**: 只保存在本地浏览器
2. **页面保持**: 自动抓取需要页面打开
3. **网络依赖**: 首次需要网络连接
4. **数据备份**: GitHub 自动保存历史

## 🐛 常见问题

**Q: 抓取失败？**
A: 网络问题会自动使用模拟数据

**Q: 无法保存到 GitHub？**
A: 检查 Token 权限和仓库是否存在

**Q: 自动抓取不工作？**
A: 确保页面未关闭，浏览器未限制

## 📊 成功标志

✅ 看到热榜数据
✅ GitHub 仓库有数据文件
✅ 历史快照可查看
✅ 自动抓取正常运行

---

**开始使用**: 访问 `https://geeker-wang.github.io/first_page/`
