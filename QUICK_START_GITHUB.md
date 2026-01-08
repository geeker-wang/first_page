# 🚀 快速开始 - 纯 GitHub 方案

## 3分钟部署完成！

---

## 📋 前置条件

- ✅ GitHub 账号
- ✅ 一个 Public 仓库
- ✅ 仓库已启用 GitHub Pages

---

## ⚡ 超快速部署

### 第1步: 检查文件 ✅

确保你的仓库包含以下文件：

```bash
# 如果已有项目
cd your-project

# 检查关键文件是否存在
ls -la .github/workflows/fetch-hot.yml
ls -la scripts/fetch.js
ls -la src/components/ZhihuHot.vue
```

### 第2步: 提交代码 ✅

```bash
git add .
git commit -m "feat: 添加知乎热榜监控"
git push origin main
```

### 第3步: 手动触发第一次抓取 ✅

1. 打开 GitHub 仓库
2. 点击 **Actions** 标签
3. 找到 **自动抓取知乎热榜**
4. 点击 **Run workflow**
5. 等待 10-20 秒

### 第4步: 验证数据 ✅

```bash
# 检查 data/zhihu-hot.json 是否已创建
# 应该包含类似这样的数据：
[
  {
    "id": "snapshot-1736312096000",
    "timestamp": 1736312096000,
    "formattedTime": "2026-01-08 12:34:56",
    "count": 30,
    "items": [...]
  }
]
```

### 第5步: 访问前端 ✅

1. 访问 GitHub Pages 地址：
   ```
   https://your-username.github.io/your-repo/
   ```

2. 配置信息：
   ```
   GitHub 用户名: your-username
   仓库名:        your-repo
   数据文件路径:  data/zhihu-hot.json
   ```

3. 点击 **保存配置**

4. 点击 **测试连接** → 应该显示 ✅ 成功

5. 点击 **从 GitHub 加载** → 应该显示热榜数据

---

## 🎯 完成！

**部署成功！** 🎉

现在你拥有：
- ⏰ 每30分钟自动抓取
- 📊 完整的历史数据
- 🔄 手动触发抓取
- 💾 本地缓存优化

---

## 📱 下一步

### 查看数据
- 点击 **从 GitHub 加载** - 查看所有历史记录
- 点击 **加载最新** - 只看最新数据
- 点击 **统计信息** - 查看数据统计

### 手动抓取
- 点击 **手动触发抓取** - 查看操作指南
- 或访问 GitHub Actions 手动运行

### 管理数据
- 点击 **清除缓存** - 清空本地缓存
- 点击 **清空本地历史** - 清空显示的历史记录
- 点击 **重置配置** - 重新配置

---

## ⚠️ 常见问题

### Q: 第一次使用没有数据？
**A**: 手动触发一次 Actions，或等待30分钟自动执行

### Q: 显示 "数据文件不存在"？
**A**:
1. 检查 Actions 是否成功执行
2. 检查仓库中是否有 `data/zhihu-hot.json`
3. 手动触发一次 Actions

### Q: 显示 "API 限制"？
**A**:
1. 等待1小时后重试
2. 或添加 GitHub Token (高级配置)

### Q: 想修改抓取频率？
**A**: 编辑 `.github/workflows/fetch-hot.yml`:
```yaml
# 改为每1小时
- cron: '0 */60 * * * *'

# 改为每天一次
- cron: '0 0 * * *'
```

---

## 🎨 自定义配置

### 修改抓取数量

编辑 `scripts/fetch.js`:
```javascript
const CONFIG = {
  MAX_SNAPSHOTS: 50,  // 改为你想要的数量
  // ...
}
```

### 修改前端默认配置

编辑 `src/components/ZhihuHot.vue`:
```typescript
const config = ref<GitHubConfig>({
  username: 'your-username',  // 改为你的用户名
  repo: 'your-repo',          // 改为你的仓库名
  dataPath: 'data/zhihu-hot.json'
})
```

---

## 📞 获取帮助

如果遇到问题：

1. **查看文档**: `PURE_GITHUB_SOLUTION.md`
2. **检查日志**: GitHub → Actions → 查看详细日志
3. **测试 API**: 浏览器控制台测试 GitHub API

---

## ✅ 检查清单

- [ ] 代码已提交到 main 分支
- [ ] Actions 已手动触发一次
- [ ] data/zhihu-hot.json 已创建
- [ ] GitHub Pages 已启用
- [ ] 前端页面可访问
- [ ] 配置已保存
- [ ] 测试连接成功
- [ ] 数据加载成功

---

**恭喜！你的知乎热榜监控系统已部署完成！** 🎉

*预计用时: 3分钟*
*成本: ¥0/月*
*维护: 0分钟/月*