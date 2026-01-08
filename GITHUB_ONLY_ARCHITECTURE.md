# 🔥 纯 GitHub 方案架构

## 📋 方案概述

**完全使用 GitHub 服务，无需任何服务器**

```
┌─────────────────────────────────────────┐
│  GitHub Actions (定时任务)               │
│  - 每30分钟执行                          │
│  - 抓取知乎热榜                          │
│  - 保存到 data/zhihu-hot.json           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  GitHub 仓库 (数据存储)                  │
│  - data/zhihu-hot.json                  │
│  - 包含所有历史快照                      │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  GitHub Pages (前端)                     │
│  - Vue 3 + TypeScript                   │
│  - 读取 GitHub API                      │
│  - 显示数据和图表                        │
└─────────────────────────────────────────┘
```

---

## 🎯 核心组件

### 1. GitHub Actions - 自动抓取
```yaml
# .github/workflows/fetch-hot.yml
name: 自动抓取知乎热榜

on:
  schedule:
    - cron: '0 */30 * * * *'  # 每30分钟
  workflow_dispatch:          # 手动触发

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 抓取知乎热榜
        run: node scripts/fetch.js

      - name: 提交数据
        run: |
          git add data/zhihu-hot.json
          git commit -m "chore: 更新热榜数据 $(date)" || exit 0
          git push
```

### 2. 数据存储格式
```json
[
  {
    "id": "snapshot-1704067200000",
    "timestamp": 1704067200000,
    "formattedTime": "2024-01-01 12:00:00",
    "count": 30,
    "items": [
      {
        "id": "123456",
        "title": "热榜标题",
        "description": "热榜描述",
        "heat": 1250000,
        "url": "https://www.zhihu.com/question/123456",
        "timestamp": 1704067200000,
        "fetchTime": "2024-01-01 12:00:00",
        "rank": 1
      }
    ]
  }
]
```

### 3. 前端读取方式
```typescript
// 通过 GitHub API 读取
const response = await fetch(
  'https://api.github.com/repos/{username}/{repo}/contents/data/zhihu-hot.json'
);

const data = await response.json();
const content = atob(data.content); // Base64 解码
const snapshots = JSON.parse(content);
```

---

## 📁 项目结构

```
first_page/
├── .github/
│   └── workflows/
│       ├── fetch-hot.yml          # 定时抓取
│       └── deploy.yml             # 部署前端
│
├── scripts/
│   └── fetch.js                   # 抓取脚本
│
├── data/
│   └── zhihu-hot.json            # 数据文件
│
├── src/
│   ├── components/
│   │   └── ZhihuHot.vue          # 热榜组件
│   ├── types/
│   │   └── zhihu.ts              # 类型定义
│   └── App.vue
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🔄 数据流程

### 自动抓取流程
```
GitHub Actions 定时器 (每30分钟)
  ↓
执行 fetch.js
  ↓
请求知乎 API (通过 CORS 代理)
  ↓
转换数据格式
  ↓
读取现有 data/zhihu-hot.json
  ↓
追加新快照 (保留最近50条)
  ↓
提交到 GitHub 仓库
```

### 前端读取流程
```
用户访问页面
  ↓
调用 GitHub API
  ↓
获取 data/zhihu-hot.json
  ↓
Base64 解码 + JSON 解析
  ↓
显示热榜数据
  ↓
展示历史快照
```

---

## 🚀 实现步骤

### 步骤 1: 创建抓取脚本

**scripts/fetch.js**:
```javascript
const fs = require('fs');
const axios = require('axios');

// 知乎 API (通过 CORS 代理)
const API_URL = 'https://api.allorigins.win/raw?url=' +
  encodeURIComponent('https://www.zhihu.com/api/v3/topstory/hot-lists/total?limit=50');

// 数据文件路径
const DATA_FILE = './data/zhihu-hot.json';

async function fetchHotList() {
  try {
    console.log('🔄 开始抓取知乎热榜...');

    // 1. 抓取数据
    const response = await axios.get(API_URL, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    // 2. 转换格式
    const items = response.data.data.map((item, index) => ({
      id: item.id || `item-${index}`,
      title: item.title,
      description: item.description || '',
      heat: item.heat || 0,
      url: item.url || `https://www.zhihu.com/question/${item.id}`,
      timestamp: Date.now(),
      fetchTime: new Date().toLocaleString('zh-CN'),
      rank: index + 1
    }));

    // 3. 读取现有数据
    let snapshots = [];
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      snapshots = JSON.parse(content);
    }

    // 4. 创建新快照
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleString('zh-CN'),
      count: items.length,
      items: items
    };

    // 5. 追加到历史 (保留最近50条)
    snapshots.unshift(snapshot);
    snapshots = snapshots.slice(0, 50);

    // 6. 保存文件
    fs.writeFileSync(DATA_FILE, JSON.stringify(snapshots, null, 2));

    console.log(`✅ 抓取成功: ${items.length} 条，总快照: ${snapshots.length}`);
    return true;

  } catch (error) {
    console.error('❌ 抓取失败:', error.message);

    // 使用模拟数据（首次运行时）
    if (!fs.existsSync(DATA_FILE)) {
      const mockData = [{
        id: 'snapshot-mock',
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleString('zh-CN'),
        count: 10,
        items: generateMockItems()
      }];
      fs.writeFileSync(DATA_FILE, JSON.stringify(mockData, null, 2));
      console.log('⚠️  已创建模拟数据');
    }
    return false;
  }
}

function generateMockItems() {
  const titles = [
    '如何看待某科技公司发布的新产品？',
    '2026年最值得期待的电影有哪些？',
    '如何评价某社会热点事件？'
  ];
  return titles.map((title, i) => ({
    id: `mock-${i}`,
    title: title,
    description: '模拟数据',
    heat: Math.floor(Math.random() * 1000000),
    url: `https://www.zhihu.com/question/mock-${i}`,
    timestamp: Date.now(),
    fetchTime: new Date().toLocaleString('zh-CN'),
    rank: i + 1
  }));
}

// 执行
fetchHotList();
```

### 步骤 2: 创建 GitHub Actions

**.github/workflows/fetch-hot.yml**:
```yaml
name: 🕷️ 自动抓取知乎热榜

on:
  schedule:
    # 每30分钟执行一次
    - cron: '0 */30 * * * *'

  # 手动触发按钮
  workflow_dispatch:

permissions:
  contents: write

jobs:
  fetch:
    runs-on: ubuntu-latest

    steps:
      - name: 检出代码
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: 安装依赖
        run: npm install axios

      - name: 执行抓取
        run: node scripts/fetch.js

      - name: 配置 Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: 提交数据
        run: |
          git add data/zhihu-hot.json
          git diff --quiet && git diff --staged --quiet || git commit -m "chore: 更新热榜数据 $(date '+%Y-%m-%d %H:%M')"
          git push
```

### 步骤 3: 前端组件

**src/components/ZhihuHot.vue** (简化版):
```vue
<template>
  <div class="zhihu-section">
    <div class="header">
      <h2>🔥 知乎热榜监控</h2>
      <p>数据来自 GitHub Actions 自动抓取</p>
    </div>

    <div class="controls">
      <button @click="loadData" :disabled="loading">
        {{ loading ? '加载中...' : '从 GitHub 加载' }}
      </button>
      <button @click="loadLatest" :disabled="loading">
        加载最新
      </button>
      <button @click="showStats" :disabled="loading">
        统计信息
      </button>
    </div>

    <div class="status" v-if="status">
      {{ status }}
    </div>

    <div class="error" v-if="error">
      {{ error }}
    </div>

    <!-- 当前热榜 -->
    <div class="hot-list" v-if="currentHot.length > 0">
      <h3>📊 当前热榜 ({{ currentHot.length }}条)</h3>
      <div class="item" v-for="(item, i) in currentHot" :key="item.id">
        <span class="rank">{{ i + 1 }}</span>
        <div class="info">
          <a :href="item.url" target="_blank">{{ item.title }}</a>
          <span class="heat">🔥 {{ formatHeat(item.heat) }}</span>
        </div>
      </div>
    </div>

    <!-- 历史快照 -->
    <div class="snapshots" v-if="snapshots.length > 0">
      <h3>📚 历史快照 ({{ snapshots.length }}条)</h3>
      <div v-for="snap in snapshots" :key="snap.id" class="snapshot">
        <div @click="toggleSnapshot(snap.id)" class="snapshot-header">
          <span>{{ snap.formattedTime }}</span>
          <span>{{ snap.count }} 条</span>
          <span>{{ expanded.has(snap.id) ? '▼' : '▶' }}</span>
        </div>
        <div v-if="expanded.has(snap.id)" class="snapshot-items">
          <div v-for="(item, i) in snap.items" :key="item.id" class="snapshot-item">
            <span>{{ i + 1 }}</span>
            <span class="title">{{ item.title }}</span>
            <span>{{ formatHeat(item.heat) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ZhihuHotItem, HotSnapshot } from '@/types/zhihu'

const currentHot = ref<ZhihuHotItem[]>([])
const snapshots = ref<HotSnapshot[]>([])
const loading = ref(false)
const error = ref('')
const status = ref('')
const expanded = ref(new Set<string>())

// GitHub 配置
const GITHUB_USERNAME = 'geeker-wang'
const GITHUB_REPO = 'first_page'
const DATA_PATH = 'data/zhihu-hot.json'

// 格式化热度
const formatHeat = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// 从 GitHub 读取数据
const loadFromGitHub = async () => {
  try {
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${DATA_PATH}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const content = atob(data.content) // Base64 解码
    return JSON.parse(content)
  } catch (e) {
    throw new Error(`无法读取数据: ${e.message}`)
  }
}

// 加载所有数据
const loadData = async () => {
  loading.value = true
  error.value = ''
  status.value = '正在从 GitHub 加载...'

  try {
    const data = await loadFromGitHub()

    if (data.length === 0) {
      status.value = '暂无数据'
      return
    }

    snapshots.value = data
    currentHot.value = data[0].items
    status.value = `✅ 加载成功: ${data.length} 条历史记录`
  } catch (e) {
    error.value = e.message
    status.value = ''
  } finally {
    loading.value = false
  }
}

// 加载最新
const loadLatest = async () => {
  loading.value = true
  error.value = ''
  status.value = '正在加载最新数据...'

  try {
    const data = await loadFromGitHub()

    if (data.length > 0) {
      currentHot.value = data[0].items
      status.value = `✅ 最新数据: ${data[0].formattedTime}`
    } else {
      status.value = '暂无数据'
    }
  } catch (e) {
    error.value = e.message
    status.value = ''
  } finally {
    loading.value = false
  }
}

// 显示统计
const showStats = async () => {
  try {
    const data = await loadFromGitHub()
    const stats = {
      总快照: data.length,
      总条目: data.reduce((sum, s) => sum + s.count, 0),
      首次记录: data[data.length - 1]?.formattedTime || '无',
      最后记录: data[0]?.formattedTime || '无'
    }

    alert(JSON.stringify(stats, null, 2))
  } catch (e) {
    error.value = e.message
  }
}

// 展开/收起快照
const toggleSnapshot = (id: string) => {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}
</script>

<style scoped>
.zhihu-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.controls button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #667eea;
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.controls button:hover:not(:disabled) {
  background: #5568d3;
}

.status {
  background: #c6f6d5;
  color: #22543d;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.error {
  background: #fed7d7;
  color: #742a2a;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.hot-list, .snapshots {
  margin: 20px 0;
}

.hot-list h3, .snapshots h3 {
  margin-bottom: 10px;
  color: #2d3748;
}

.item {
  display: flex;
  gap: 15px;
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
}

.item:hover {
  background: #edf2f7;
}

.rank {
  font-size: 1.5em;
  font-weight: bold;
  color: #667eea;
  min-width: 40px;
  text-align: center;
}

.info {
  flex: 1;
}

.info a {
  color: #2d3748;
  text-decoration: none;
  font-weight: 600;
  display: block;
  margin-bottom: 5px;
}

.info a:hover {
  color: #667eea;
  text-decoration: underline;
}

.heat {
  color: #dd6b20;
  font-weight: 600;
  font-size: 0.9em;
}

.snapshot {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}

.snapshot-header {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f7fafc;
  cursor: pointer;
  font-weight: 600;
}

.snapshot-header:hover {
  background: #edf2f7;
}

.snapshot-items {
  padding: 10px;
  background: white;
}

.snapshot-item {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9em;
}

.snapshot-item:last-child {
  border-bottom: none;
}

.snapshot-item .title {
  flex: 1;
  color: #2d3748;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  .controls button {
    width: 100%;
  }

  .item {
    flex-direction: column;
    gap: 8px;
  }

  .snapshot-header {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
```

### 步骤 4: 类型定义

**src/types/zhihu.ts**:
```typescript
export interface ZhihuHotItem {
  id: string
  title: string
  description: string
  heat: number
  url: string
  timestamp: number
  fetchTime: string
  rank: number
}

export interface HotSnapshot {
  id: string
  timestamp: number
  formattedTime: string
  count: number
  items: ZhihuHotItem[]
}
```

---

## 🚀 部署步骤（3分钟）

### 1. 准备仓库
```bash
# 确保你的仓库是 public（GitHub Pages 需要）
# 或 private（但需要 GitHub Pro）

# 创建目录结构
mkdir -p scripts data .github/workflows
```

### 2. 创建抓取脚本
```bash
# 创建 scripts/fetch.js
# 复制上面的代码
```

### 3. 创建 GitHub Actions
```bash
# 创建 .github/workflows/fetch-hot.yml
# 复制上面的代码
```

### 4. 创建前端组件
```bash
# 更新 src/components/ZhihuHot.vue
# 复制上面的代码
```

### 5. 提交代码
```bash
git add .
git commit -m "feat: 纯 GitHub 方案实现"
git push origin main
```

### 6. 手动触发第一次抓取
1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 找到 **自动抓取知乎热榜**
4. 点击 **Run workflow**
5. 等待执行完成

### 7. 检查数据文件
1. 查看 `data/zhihu-hot.json` 是否已创建
2. 应该包含至少一条数据

### 8. 部署前端
```bash
# 方法 A: GitHub Pages 自动部署
# 确保 .github/workflows/deploy.yml 存在

# 方法 B: 手动部署
npm run build
# 将 dist/ 上传到 gh-pages 分支
```

### 9. 访问测试
1. 访问前端页面
2. 点击"从 GitHub 加载"
3. 应该看到热榜数据

---

## 📊 成本对比

| 项目 | 纯 GitHub 方案 | 云服务器方案 |
|------|----------------|--------------|
| **服务器费用** | ¥0 | ¥50/月 |
| **域名费用** | ¥0 (可选) | ¥10/年 |
| **维护成本** | 0 | 需要维护 |
| **部署难度** | ⭐⭐ | ⭐⭐⭐ |
| **稳定性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## ⚠️ 注意事项

### 1. GitHub API 限制
- 未认证: 60次/小时
- 认证: 5000次/小时
- **影响**: 前端频繁刷新可能受限

**解决方案**:
- 前端添加缓存（localStorage）
- 限制自动刷新频率

### 2. 数据文件大小
- 每条快照 ~50KB
- 保留50条 = ~2.5MB
- **影响**: 仓库大小

**解决方案**:
- 定期清理旧数据
- 只保留最近30天

### 3. 提交频率
- 每30分钟一次
- 一天 = 48次提交
- **影响**: Git 历史频繁

**解决方案**:
- 使用单独的 data 分支
- 或合并多次提交

### 4. 私有仓库
- GitHub Pages 对私有仓库需要 Pro 账号
- **解决方案**: 使用 public 仓库

---

## 🎯 推荐配置

### 最小配置
- ✅ Public 仓库
- ✅ GitHub Pages 启用
- ✅ Actions 权限开启
- ✅ 前端页面访问正常

### 完整配置
- ✅ 自定义域名
- ✅ HTTPS 证书
- ✅ 数据缓存
- ✅ 错误处理
- ✅ 自动清理旧数据

---

## 📝 总结

**纯 GitHub 方案完全可行！**

优势:
- 💰 完全免费
- 🤖 自动化运行
- 📊 数据持久化
- 🚀 部署简单

只需要:
1. 创建抓取脚本
2. 配置 GitHub Actions
3. 更新前端组件
4. 提交代码

**无需任何服务器费用！** 🎉

---

*版本: 1.0.0*
*类型: 纯 GitHub 方案*
*成本: ¥0/月*
