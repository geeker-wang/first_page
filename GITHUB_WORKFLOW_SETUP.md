# 🔧 GitHub Actions 工作流手动创建指南

由于 GitHub 限制，`.github/workflows/` 目录下的文件需要手动创建。

## 📋 创建步骤

### 第1步: 访问 GitHub 仓库

打开: https://github.com/geeker-wang/first_page

### 第2步: 创建 workflows 目录

1. 点击 **Add file** → **Create new file**
2. 输入路径: `.github/workflows/fetch-hot.yml`
3. GitHub 会自动创建 `.github` 和 `workflows` 目录

### 第3步: 复制粘贴以下内容

```yaml
# 🕷️ 自动抓取知乎热榜
name: 自动抓取知乎热榜

on:
  # 定时触发（每30分钟）
  schedule:
    - cron: '0 */30 * * * *'

  # 手动触发
  workflow_dispatch:

  # 推送到 main 分支时也可触发（测试用）
  push:
    branches:
      - main
    paths:
      - '.github/workflows/fetch-hot.yml'
      - 'scripts/fetch.js'

# 权限配置
permissions:
  contents: write

jobs:
  fetch-and-save:
    runs-on: ubuntu-latest

    steps:
      # 1. 检出代码
      - name: 📥 检出代码
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0  # 获取完整历史

      # 2. 设置 Node.js
      - name: ⚙️ 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      # 3. 安装依赖
      - name: 📦 安装依赖
        run: |
          npm install axios

      # 4. 执行抓取
      - name: 🕷️ 执行抓取脚本
        run: node scripts/fetch.js

      # 5. 配置 Git
      - name: 🔧 配置 Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      # 6. 检查文件变化
      - name: 🔍 检查变化
        id: check_changes
        run: |
          if git diff --quiet data/zhihu-hot.json; then
            echo "has_changes=false" >> $GITHUB_OUTPUT
            echo "没有数据变化"
          else
            echo "has_changes=true" >> $GITHUB_OUTPUT
            echo "检测到数据变化"
          fi

      # 7. 提交和推送
      - name: 💾 提交数据
        if: steps.check_changes.outputs.has_changes == 'true'
        run: |
          git add data/zhihu-hot.json
          git commit -m "chore: 更新知乎热榜数据 $(date '+%Y-%m-%d %H:%M')"
          git push

      # 8. 总结
      - name: 📊 总结
        if: always()
        run: |
          echo "## 抓取结果" >> $GITHUB_STEP_SUMMARY
          echo "- 时间: $(date '+%Y-%m-%d %H:%M:%S')" >> $GITHUB_STEP_SUMMARY
          echo "- 状态: ${{ job.status }}" >> $GITHUB_STEP_SUMMARY
          if [ "${{ steps.check_changes.outputs.has_changes }}" == "true" ]; then
            echo "- 数据: ✅ 已更新" >> $GITHUB_STEP_SUMMARY
          else
            echo "- 数据: ⚠️ 无变化" >> $GITHUB_STEP_SUMMARY
          fi
```

### 第4步: 提交文件

点击 **Commit new file** → 提交信息填写: `feat: 添加自动抓取工作流`

---

## ✅ 验证创建成功

创建后，在仓库中应该看到:

```
.github/
└── workflows/
    └── fetch-hot.yml
```

---

## 🚀 下一步: 手动触发第一次抓取

### 方法 1: 通过 Actions 页面

1. 访问: https://github.com/geeker-wang/first_page/actions
2. 点击左侧 **自动抓取知乎热榜**
3. 点击右侧 **Run workflow**
4. 选择 `main` 分支
5. 点击 **Run workflow** 按钮
6. 等待 10-20 秒完成

### 方法 2: 通过 Settings 页面

1. 访问: https://github.com/geeker-wang/first_page/settings/actions
2. 向下滚动到 **Workflow permissions**
3. 确保选择: **Read and write permissions**
4. 保存设置

---

## 📊 检查执行结果

### 查看执行日志

1. 访问: https://github.com/geeker-wang/first_page/actions
2. 点击最近的运行记录
3. 查看每个步骤的输出

### 验证数据文件

1. 访问: https://github.com/geeker-wang/first_page/tree/main/data
2. 应该看到 `zhihu-hot.json` 文件
3. 点击查看内容，应该包含热榜数据

---

## 🔧 常见问题

### Q: Actions 没有执行权限？

**A**: 检查 Settings → Actions → General → Workflow permissions
- 选择: **Read and write permissions**
- 保存设置

### Q: 抓取脚本找不到？

**A**: 确认 `scripts/fetch.js` 已成功推送到仓库
- 访问: https://github.com/geeker-wang/first_page/tree/main/scripts

### Q: 执行失败？

**A**: 查看 Actions 日志
1. 访问 Actions 页面
2. 点击失败的运行
3. 查看具体错误信息

---

## 🎯 完整部署检查清单

- [ ] workflow 文件已创建 (`.github/workflows/fetch-hot.yml`)
- [ ] 脚本文件已推送 (`scripts/fetch.js`)
- [ ] 前端组件已推送 (`src/components/ZhihuHot.vue`)
- [ ] 手动触发 Actions 一次
- [ ] data/zhihu-hot.json 已创建
- [ ] GitHub Pages 已启用
- [ ] 前端页面可访问
- [ ] 配置已保存
- [ ] 测试连接成功
- [ ] 数据加载成功

---

## 📞 遇到问题？

1. **查看文档**: `PURE_GITHUB_SOLUTION.md`
2. **检查日志**: GitHub → Actions → 查看详细日志
3. **测试 API**: 浏览器控制台测试 GitHub API

---

**完成以上步骤后，你的知乎热榜监控系统就部署完成了！** 🎉
