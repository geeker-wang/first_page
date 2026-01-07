# GitHub Actions 手动设置指南

由于权限限制，GitHub Actions 工作流文件需要手动创建。

## 📋 手动创建步骤

### 1. 确保 package-lock.json 存在

在本地运行以下命令生成锁文件：
```bash
npm install --package-lock-only
git add package-lock.json
git commit -m "Add package-lock.json"
git push origin main
```

### 2. 在 GitHub 网站上创建 Actions 文件

访问你的 GitHub 仓库，然后：

1. 点击 **Add file** → **Create new file**
2. 输入路径：`.github/workflows/deploy.yml`
3. 粘贴以下内容：

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

      - name: TypeScript Type Check
        run: npm run type-check

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

4. 点击 **Commit new file** 提交

### 3. 备用方案（如果不想使用 package-lock.json）

如果不想生成 package-lock.json，可以使用以下配置：

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
        run: npm install  # 使用 npm install 而不是 npm ci

      - name: TypeScript Type Check
        run: npm run type-check

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

### 2. 启用 GitHub Pages

1. 访问仓库 **Settings** → **Pages**
2. 在 **Build and deployment** 部分：
   - **Source**: 选择 `GitHub Actions`
3. GitHub 会自动检测工作流文件并开始构建

### 3. 验证部署

1. 推送代码后，查看 **Actions** 标签页
2. 等待绿色对勾出现
3. 访问：`https://geeker-wang.github.io/first_page/`

## 🔧 本地测试

在推送前，可以在本地测试：

```bash
# 安装依赖
npm install

# TypeScript 类型检查
npm run type-check

# 构建测试
npm run build

# 预览结果
npm run preview
```

## 📝 注意事项

- 确保所有 TypeScript 文件没有类型错误
- 构建脚本会自动执行类型检查
- 如果构建失败，Actions 会显示详细错误信息
- 首次部署可能需要几分钟

## 🎯 成功标志

✅ Actions 日志显示 "Build completed successfully"
✅ 网站可访问：`https://geeker-wang.github.io/first_page/`
✅ TypeScript 类型检查通过
✅ 所有依赖正确安装