# 🎉 部署完成！下一步操作指南

## ✅ 当前状态

代码已成功推送到 GitHub！

**仓库地址**: https://github.com/geeker-wang/first_page

---

## 🚀 快速部署 (3分钟)

### 第1步: 创建 GitHub Actions 工作流

**访问**: https://github.com/geeker-wang/first_page/new/main/.github/workflows

**文件名**: `fetch-hot.yml`

**复制以下内容**:

```yaml
# 🕷️ 自动抓取知乎热榜
name: 自动抓取知乎热榜

on:
  schedule:
    - cron: '0 */30 * * * *'
  workflow_dispatch:
  push:
    branches: [main]
    paths: ['.github/workflows/fetch-hot.yml', 'scripts/fetch.js']

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

**点击**: **Commit new file**

---

### 第2步: 手动触发第一次抓取

1. 访问: https://github.com/geeker-wang/first_page/actions
2. 点击左侧 **自动抓取知乎热榜**
3. 点击 **Run workflow**
4. 选择 `main` 分支
5. 点击 **Run workflow** 按钮
6. 等待 10-20 秒

---

### 第3步: 验证数据文件

访问: https://github.com/geeker-wang/first_page/tree/main/data

应该看到 `zhihu-hot.json` 文件，包含类似内容:

```json
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

---

### 第4步: 启用 GitHub Pages

1. 访问: https://github.com/geeker-wang/first_page/settings/pages
2. **Source**: Deploy from a branch
3. **Branch**: main, `/ (root)`
4. 点击 **Save**
5. 等待 1-2 分钟

**访问地址**: https://geeker-wang.github.io/first_page/

---

### 第5步: 配置前端

1. 访问: https://geeker-wang.github.io/first_page/
2. 填写配置:
   - **GitHub 用户名**: `geeker-wang`
   - **仓库名**: `first_page`
   - **数据文件路径**: `data/zhihu-hot.json`
3. 点击 **保存配置**
4. 点击 **测试连接** (应该显示 ✅ 成功)
5. 点击 **从 GitHub 加载** (应该显示热榜数据)

---

## 📊 完成检查清单

- [ ] workflow 文件已创建
- [ ] 手动触发 Actions 一次
- [ ] data/zhihu-hot.json 已创建
- [ ] GitHub Pages 已启用
- [ ] 前端页面可访问
- [ ] 配置已保存
- [ ] 测试连接成功
- [ ] 数据加载成功

---

## 🎯 功能验证

### 自动抓取测试

等待 30 分钟后检查:
- Actions 是否自动执行
- data/zhihu-hot.json 是否更新
- Git 提交历史是否增加

### 手动抓取测试

在 Actions 页面点击 **Run workflow**:
- 是否立即执行
- 是否成功提交数据

### 前端功能测试

1. **加载数据**: 从 GitHub 加载所有历史记录
2. **查看统计**: 显示数据统计信息
3. **历史快照**: 展开/收起历史数据
4. **缓存优化**: 5分钟内重复访问使用缓存

---

## 📝 数据格式说明

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

## ⚙️ 自定义配置

### 修改抓取频率

编辑 `.github/workflows/fetch-hot.yml`:

```yaml
# 每1小时
- cron: '0 */60 * * * *'

# 每天一次
- cron: '0 0 * * *'
```

### 修改保留数量

编辑 `scripts/fetch.js`:

```javascript
const CONFIG = {
  MAX_SNAPSHOTS: 50  // 改为你想要的数量
}
```

---

## 🔧 故障排查

### Actions 执行失败

**检查日志**: https://github.com/geeker-wang/first_page/actions

**常见原因**:
1. 网络问题 - 知乎 API 不可用
2. 权限问题 - Settings → Actions → General → Read and write permissions

### 前端无法加载数据

**浏览器控制台测试**:

```javascript
fetch('https://api.github.com/repos/geeker-wang/first_page/contents/data/zhihu-hot.json')
  .then(r => r.json())
  .then(d => console.log(atob(d.content)))
```

### 数据文件不存在

**解决方案**:
1. 手动触发 Actions 一次
2. 检查 Actions 是否成功执行
3. 查看仓库中是否有 `data/zhihu-hot.json`

---

## 📚 相关文档

- `README_GITHUB_SOLUTION.md` - 项目说明
- `PURE_GITHUB_SOLUTION.md` - 完整技术文档
- `QUICK_START_GITHUB.md` - 快速开始指南
- `GITHUB_WORKFLOW_SETUP.md` - 工作流创建指南

---

## 🎉 部署成功！

你现在拥有:
- ⏰ 每30分钟自动抓取
- 📊 完整的历史数据
- 🔄 手动触发抓取
- 💾 智能缓存

**零成本，全自动化！** 🚀

---

**版本**: 3.0.0
**类型**: 纯 GitHub 解决方案
**成本**: ¥0/月
**最后更新**: 2026-01-08
