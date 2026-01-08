# 🎯 知乎热榜监控系统 - 部署指南

## 📋 项目状态

**当前**: ✅ 代码已准备好，等待网络恢复后推送

**功能**: 完全自动化的知乎热榜监控系统

**成本**: ¥0/月 (纯 GitHub 服务)

---

## 🚀 快速开始 (3分钟)

### 前置条件
- ✅ GitHub 账号
- ✅ Public 仓库
- ✅ GitHub Pages 已启用

---

## ⚡ 部署步骤

### 1. 等待网络恢复后推送代码

```bash
# 在项目目录执行
git push origin main
```

### 2. 手动创建 GitHub Actions 工作流

**访问**: https://github.com/geeker-wang/first_page/new/main/.github/workflows

**文件名**: `fetch-hot.yml`

**内容**:
```yaml
name: 自动抓取知乎热榜

on:
  schedule:
    - cron: '*/30 * * * *'  # 每30分钟
  workflow_dispatch:         # 手动触发

permissions:
  contents: write

jobs:
  fetch-and-save:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install axios
      - run: node scripts/fetch.js
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/zhihu-hot.json
          git diff --quiet || git commit -m "chore: 更新知乎热榜数据"
          git push
```

### 3. 手动触发第一次抓取

1. 访问: https://github.com/geeker-wang/first_page/actions
2. 点击 **自动抓取知乎热榜**
3. 点击 **Run workflow**
4. 等待 10-20 秒

### 4. 启用 GitHub Pages

1. 访问: https://github.com/geeker-wang/first_page/settings/pages
2. 选择: **main** 分支, `/ (root)`
3. 点击 **Save**

### 5. 访问前端

访问: https://geeker-wang.github.io/first_page/

配置:
- GitHub 用户名: `geeker-wang`
- 仓库名: `first_page`
- 数据文件路径: `data/zhihu-hot.json`

点击: **保存配置** → **测试连接** → **从 GitHub 加载**

---

## 🔧 中文乱码修复

如果页面显示乱码，需要手动修复2个文件：

### 1. 清理数据文件

**访问**: https://github.com/geeker-wang/first_page/edit/main/data/zhihu-hot.json

**删除**: 第 163-215 行 (乱码快照)

**保留**: 第 1-162 行

### 2. 更新前端解码

**访问**: https://github.com/geeker-wang/first_page/edit/main/src/components/ZhihuHot.vue

**修改**: `fetchFromGitHub` 函数 (第 325-351 行)

**替换为**:
```javascript
const fetchFromGitHub = async (): Promise<HotSnapshot[]> => {
  const url = getGitHubApiUrl()
  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('数据文件不存在，请先运行 GitHub Actions 抓取数据')
    }
    if (response.status === 403) {
      throw new Error('API 限制，请稍后再试（或使用个人 Token）')
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  // ✅ 正确解码 Base64 + UTF-8
  const binaryString = atob(data.content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const decoder = new TextDecoder('utf-8')
  const content = decoder.decode(bytes)

  return JSON.parse(content)
}
```

---

## 📁 项目结构

```
first_page/
├── .github/
│   └── workflows/
│       └── fetch-hot.yml          # GitHub Actions (手动创建)
├── scripts/
│   └── fetch.js                   # 抓取脚本 (ES Module)
├── src/
│   ├── components/
│   │   └── ZhihuHot.vue          # 前端组件
│   └── types/
│       └── zhihu.ts              # 类型定义
├── data/
│   └── zhihu-hot.json            # 数据文件 (自动生成)
└── 文档/
    ├── QUICK_FIX.md              # 中文乱码快速修复
    ├── FINAL_SUMMARY.md          # 完整修复总结
    └── CHINESE_GARBLED_FIX.md    # 详细修复说明
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
```

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

### Q: 中文显示乱码？
**A**: 按照上面的"中文乱码修复"步骤操作

---

## 📚 相关文档

- `QUICK_FIX.md` - 中文乱码快速修复
- `FINAL_SUMMARY.md` - 完整修复总结
- `CHINESE_GARBLED_FIX.md` - 详细修复说明
- `ERROR_FIX_SUMMARY.md` - 所有错误修复

---

## ✅ 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] 手动创建 workflow 文件
- [ ] Actions 已手动触发一次
- [ ] data/zhihu-hot.json 已创建
- [ ] GitHub Pages 已启用
- [ ] 前端配置已保存
- [ ] 测试连接成功
- [ ] 数据加载成功
- [ ] 中文显示正常

---

## 🎉 部署成功！

你现在拥有：
- ⏰ 每30分钟自动抓取
- 📊 完整的历史数据
- 🔄 手动触发抓取
- 💾 智能缓存

**零成本，全自动化！** 🚀

---

*版本: 3.0.0*
*类型: 纯 GitHub 解决方案*
*成本: ¥0/月*
*最后更新: 2026-01-08*
