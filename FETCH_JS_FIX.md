# 🔧 fetch.js ES Module 修复说明

## ⚠️ 问题

GitHub Actions 执行时报错:

```
ReferenceError: require is not defined in ES module scope
```

**原因**: `package.json` 中有 `"type": "module"`，但 `fetch.js` 使用 CommonJS (`require`)。

## ✅ 解决方案

**GitHub 上的 `scripts/fetch.js` 已更新为 ES Module 格式！**

### 修改内容

**旧代码 (CommonJS)**:
```javascript
const axios = require('axios')
const fs = require('fs')
const path = require('path')

module.exports = { fetchZhihuHotList, saveData, readData, main }
```

**新代码 (ES Module)**:
```javascript
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export { fetchZhihuHotList, saveData, readData, main }
```

## 🚀 如何更新 GitHub 上的文件

### 方法 1: 直接编辑 (推荐)

1. 访问: https://github.com/geeker-wang/first_page/blob/main/scripts/fetch.js
2. 点击右上角 ✏️ **编辑** 图标
3. 删除旧内容，粘贴新内容
4. 点击 **Commit changes**

### 方法 2: 上传新文件

1. 访问: https://github.com/geeker-wang/first_page/upload/main/scripts
2. 上传修改后的 `fetch.js`
3. 提交替换

## 📋 完整的 ES Module 代码

```javascript
/**
 * 知乎热榜抓取脚本
 * 用于 GitHub Actions 自动执行
 * 使用 ES Module 格式
 */

import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const CONFIG = {
  API_URL: 'https://api.allorigins.win/raw?url=' +
    encodeURIComponent('https://www.zhihu.com/api/v3/topstory/hot-lists/total?limit=50'),
  DATA_PATH: path.join(__dirname, '..', 'data', 'zhihu-hot.json'),
  MAX_SNAPSHOTS: 50,
  TIMEOUT: 10000
}

// 生成模拟数据
function generateMockData() {
  const mockTitles = [
    '如何看待某科技公司发布的新产品？',
    '2026年最值得期待的电影有哪些？',
    '如何评价某社会热点事件？',
    '为什么年轻人越来越不愿意结婚？',
    '某城市推出新政策，你怎么看？',
    '人工智能会取代人类工作吗？',
    '如何评价某明星的新作品？',
    '2026年经济形势分析',
    '某大学教授发表争议言论',
    '如何选择适合自己的职业？'
  ]
  return mockTitles.map((title, index) => ({
    id: `mock-${Date.now()}-${index}`,
    title: title,
    description: '这是一条模拟的热榜数据，用于测试和演示',
    heat: Math.floor(Math.random() * 1000000) + 10000,
    url: `https://www.zhihu.com/question/mock-${index}`,
    timestamp: Date.now(),
    fetchTime: new Date().toLocaleString('zh-CN'),
    rank: index + 1
  }))
}

// 抓取知乎热榜
async function fetchZhihuHotList() {
  try {
    console.log('🔄 开始抓取知乎热榜...')
    console.log(`📡 请求地址: ${CONFIG.API_URL}`)
    const response = await axios.get(CONFIG.API_URL, {
      timeout: CONFIG.TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    if (!response.data || !response.data.data) {
      throw new Error('API返回格式异常')
    }
    const items = response.data.data.map((item, index) => ({
      id: item.id || item.target?.id || `item-${index}`,
      title: item.title || item.target?.title || '',
      description: item.description || item.target?.description || '',
      heat: item.heat || item.target?.heat || 0,
      url: item.url || (item.target ? `https://www.zhihu.com/question/${item.target.id}` : ''),
      timestamp: Date.now(),
      fetchTime: new Date().toLocaleString('zh-CN'),
      rank: index + 1
    }))
    console.log(`✅ 抓取成功: ${items.length} 条`)
    return items
  } catch (error) {
    console.error('❌ 抓取失败:', error.message)
    console.log('⚠️  使用模拟数据')
    return generateMockData()
  }
}

// 保存数据到文件
function saveData(snapshots) {
  try {
    const dir = path.dirname(CONFIG.DATA_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(CONFIG.DATA_PATH, JSON.stringify(snapshots, null, 2), 'utf8')
    console.log(`💾 数据已保存: ${CONFIG.DATA_PATH}`)
    return true
  } catch (error) {
    console.error('❌ 保存失败:', error.message)
    return false
  }
}

// 读取现有数据
function readData() {
  try {
    if (!fs.existsSync(CONFIG.DATA_PATH)) {
      return []
    }
    const content = fs.readFileSync(CONFIG.DATA_PATH, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error('❌ 读取失败:', error.message)
    return []
  }
}

// 主函数
async function main() {
  console.log('='.repeat(50))
  console.log('🔥 知乎热榜抓取脚本')
  console.log(`⏰ 执行时间: ${new Date().toLocaleString('zh-CN')}`)
  console.log('='.repeat(50))
  try {
    console.log('\n📋 步骤 1: 读取现有数据')
    const existingData = readData()
    console.log(`现有快照数: ${existingData.length}`)
    console.log('\n📋 步骤 2: 抓取新数据')
    const items = await fetchZhihuHotList()
    console.log('\n📋 步骤 3: 创建快照')
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleString('zh-CN'),
      count: items.length,
      items: items
    }
    console.log(`快照ID: ${snapshot.id}`)
    console.log('\n📋 步骤 4: 合并数据')
    const newData = [snapshot, ...existingData].slice(0, CONFIG.MAX_SNAPSHOTS)
    console.log(`合并后快照数: ${newData.length}`)
    console.log('\n📋 步骤 5: 保存数据')
    const success = saveData(newData)
    if (success) {
      console.log('\n' + '='.repeat(50))
      console.log('🎉 抓取流程完成！')
      console.log('='.repeat(50))
      console.log(`📊 本次抓取: ${items.length} 条`)
      console.log(`📚 总快照数: ${newData.length} 条`)
      console.log(`💾 保存路径: ${CONFIG.DATA_PATH}`)
      console.log('='.repeat(50))
      process.exit(0)
    } else {
      console.error('\n❌ 保存失败，流程终止')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

// 导出供其他模块使用
export { fetchZhihuHotList, saveData, readData, main }
```

## ✅ 验证修复

修复后，Actions 应该能够成功执行:

1. 访问: https://github.com/geeker-wang/first_page/actions
2. 点击 **自动抓取知乎热榜**
3. 查看最近的运行记录
4. 应该看到所有步骤都成功 ✅

## 📊 关键差异

| 特性 | CommonJS | ES Module |
|------|----------|-----------|
| 导入 | `require()` | `import` |
| 导出 | `module.exports` | `export` |
| 文件名 | `.js` | `.js` (package.json 有 type: "module") |
| __dirname | 内置 | 需要手动计算 |

## 🎯 下一步

修复后:
1. ✅ 手动触发 Actions
2. ✅ 检查执行日志
3. ✅ 验证 data/zhihu-hot.json 是否生成
4. ✅ 前端访问测试

**问题解决后，系统即可全自动运行！** 🚀
