# GitHub Pages 部署指南

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 本地开发测试
```bash
npm run dev
```
访问 `http://localhost:3000` 查看效果

### 3. 构建生产版本
```bash
npm run build
```
构建后的文件在 `dist/` 目录

### 4. 部署到 GitHub Pages

#### 方法 A：使用 GitHub Actions（推荐）

1. 在 GitHub 仓库设置中启用 GitHub Pages：
   - Settings → Pages → Source: GitHub Actions

2. 创建 `.github/workflows/deploy.yml` 文件（内容见下方）

3. 推送代码，Actions 会自动构建并部署

#### 方法 B：手动部署

1. 安装 gh-pages 包：
   ```bash
   npm install gh-pages --save-dev
   ```

2. 添加部署脚本到 `package.json`：
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. 运行部署：
   ```bash
   npm run deploy
   ```

4. 在 Settings → Pages 中选择 `gh-pages` 分支

## 📋 GitHub Actions 配置

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 🔧 常见配置

### 自定义域名

在项目根目录创建 `CNAME` 文件，内容为你的域名：
```
example.com
```

### 路径配置

如果部署到子路径（如 `https://username.github.io/repo/`），修改 `vite.config.js`：
```javascript
base: '/repo/'
```

## 🎯 验证部署

1. 推送代码后，查看 GitHub Actions 标签页
2. 等待绿色对勾出现（通常 1-3 分钟）
3. 访问 `https://username.github.io/repo/`

## 📝 调试提示

- 检查浏览器控制台错误
- 查看 GitHub Actions 日志
- 确保 `dist/` 目录包含 `index.html`
- 验证所有依赖已正确安装

---

**部署成功！** 🎉