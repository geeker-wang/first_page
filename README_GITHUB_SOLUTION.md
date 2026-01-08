# 🎯 纯 GitHub 解决方案 - 项目说明

## 📋 项目概览

这是一个**完全基于 GitHub 服务**的知乎热榜监控系统，无需任何云服务器。

**核心特点**:
- ✅ **零成本** - 完全免费
- ✅ **全自动化** - GitHub Actions 定时抓取
- ✅ **数据持久化** - 存储在 GitHub 仓库
- ✅ **部署简单** - 提交代码即可运行

---

## 🚀 快速开始

### 3分钟部署

1. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 知乎热榜监控"
   git push
   ```

2. **手动触发第一次抓取**
   - GitHub → Actions → 自动抓取知乎热榜 → Run workflow

3. **访问前端**
   - GitHub Pages 地址: `https://your-username.github.io/first_page/`
   - 配置用户名/仓库名
   - 点击"从 GitHub 加载"

**详细步骤**: 查看 `QUICK_START_GITHUB.md`

---

## 📁 项目文件说明

### 核心文件

| 文件 | 说明 | 行数 |
|------|------|------|
| `scripts/fetch.js` | 抓取脚本 | 206 |
| `.github/workflows/fetch-hot.yml` | Actions 工作流 | 90 |
| `src/components/ZhihuHot.vue` | 前端组件 | 1029 |
| `src/types/zhihu.ts` | 类型定义 | 15 |

### 文档文件

| 文件 | 说明 |
|------|------|
| `PURE_GITHUB_SOLUTION.md` | 完整技术文档 |
| `QUICK_START_GITHUB.md` | 快速开始指南 |
| `README_GITHUB_SOLUTION.md` | 项目说明（本文件） |

---

## 🔄 工作原理

### 1. 自动抓取 (GitHub Actions)

```
每30分钟 → 执行 fetch.js → 抓取知乎 → 保存到 data/zhihu-hot.json → 提交到仓库
```

### 2. 前端读取

```
用户访问 → 检查缓存 → 调用 GitHub API → 解析数据 → 显示热榜
```

---

## 🎯 功能清单

### 配置管理
- ✅ GitHub 用户名/仓库名配置
- ✅ 数据文件路径配置
- ✅ 配置保存/重置
- ✅ 连接测试

### 数据操作
- ✅ 从 GitHub 加载所有数据
- ✅ 加载最新数据
- ✅ 查看统计信息
- ✅ 手动触发抓取

### 数据展示
- ✅ 当前热榜列表（带排名）
- ✅ 历史快照（可展开/收起）
- ✅ 热度格式化（1.2M/850K）
- ✅ 最后更新时间

### 缓存优化
- ✅ 5分钟本地缓存
- ✅ 自动缓存更新
- ✅ 手动清除缓存

---

## 📊 数据格式

```json
[
  {
    "id": "snapshot-1736312096000",
    "timestamp": 1736312096000,
    "formattedTime": "2026-01-08 12:34:56",
    "count": 30,
    "items": [
      {
        "id": "123456",
        "title": "热榜标题",
        "description": "热榜描述",
        "heat": 1250000,
        "url": "https://www.zhihu.com/question/123456",
        "timestamp": 1736312096000,
        "fetchTime": "2026-01-08 12:34:56",
        "rank": 1
      }
    ]
  }
]
```

---

## 🔧 配置说明

### GitHub Actions 配置

文件: `.github/workflows/fetch-hot.yml`

```yaml
# 触发方式
on:
  schedule:
    - cron: '0 */30 * * * *'  # 每30分钟
  workflow_dispatch:          # 手动触发
```

**修改频率**:
- 每1小时: `'0 */60 * * * *'`
- 每天一次: `'0 0 * * *'`

### 抓取脚本配置

文件: `scripts/fetch.js`

```javascript
const CONFIG = {
  MAX_SNAPSHOTS: 50,  // 保留历史数量
  TIMEOUT: 10000      // 超时时间
}
```

### 前端配置

文件: `src/components/ZhihuHot.vue`

```typescript
const config = ref<GitHubConfig>({
  username: 'your-username',
  repo: 'first_page',
  dataPath: 'data/zhihu-hot.json'
})
```

---

## ⚠️ 重要提示

### API 限制
- 未认证: 60次/小时
- 认证: 5000次/小时
- **解决方案**: 5分钟缓存

### 仓库大小
- 50条快照 ≈ 2.5MB
- **解决方案**: 自动清理旧数据

### 提交频率
- 每30分钟 = 48次/天
- **解决方案**: 可调整为1小时

---

## 📞 获取帮助

### 文档
- 完整文档: `PURE_GITHUB_SOLUTION.md`
- 快速开始: `QUICK_START_GITHUB.md`

### 常见问题
1. **没有数据** → 手动触发 Actions
2. **连接失败** → 检查用户名/仓库名
3. **API 限制** → 等待1小时或添加 Token

---

## ✅ 部署检查清单

- [ ] 代码已提交到 main 分支
- [ ] Actions 已手动触发一次
- [ ] data/zhihu-hot.json 已创建
- [ ] GitHub Pages 已启用
- [ ] 前端配置已保存
- [ ] 测试连接成功
- [ ] 数据加载成功

---

## 🎉 部署成功！

你现在拥有：
- ⏰ 每30分钟自动抓取
- 📊 完整的历史数据
- 🔄 手动触发抓取
- 💾 智能缓存

**零成本，全自动化！** 🚀

---

## 📚 相关链接

- GitHub Actions: https://docs.github.com/actions
- GitHub API: https://docs.github.com/rest
- Vue 3: https://vuejs.org/
- Vite: https://vitejs.dev/

---

*版本: 3.0.0*
*类型: 纯 GitHub 解决方案*
*成本: ¥0/月*
*最后更新: 2026-01-08*