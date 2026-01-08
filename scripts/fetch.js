/**
 * 知乎热榜抓取脚本
 * 用于 GitHub Actions 自动执行
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

// 配置
const CONFIG = {
  // 知乎 API (使用 CORS 代理)
  API_URL: 'https://api.allorigins.win/raw?url=' +
    encodeURIComponent('https://www.zhihu.com/api/v3/topstory/hot-lists/total?limit=50'),

  // 数据文件路径
  DATA_PATH: path.join(__dirname, '..', 'data', 'zhihu-hot.json'),

  // 保留的历史记录数量
  MAX_SNAPSHOTS: 50,

  // 超时时间
  TIMEOUT: 10000
}

/**
 * 生成模拟数据（用于测试或首次运行）
 */
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

/**
 * 抓取知乎热榜
 */
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

/**
 * 保存数据到文件
 */
function saveData(snapshots) {
  try {
    // 确保目录存在
    const dir = path.dirname(CONFIG.DATA_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // 写入文件
    fs.writeFileSync(
      CONFIG.DATA_PATH,
      JSON.stringify(snapshots, null, 2),
      'utf8'
    )

    console.log(`💾 数据已保存: ${CONFIG.DATA_PATH}`)
    return true

  } catch (error) {
    console.error('❌ 保存失败:', error.message)
    return false
  }
}

/**
 * 读取现有数据
 */
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

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(50))
  console.log('🔥 知乎热榜抓取脚本')
  console.log(`⏰ 执行时间: ${new Date().toLocaleString('zh-CN')}`)
  console.log('='.repeat(50))

  try {
    // 1. 读取现有数据
    console.log('\n📋 步骤 1: 读取现有数据')
    const existingData = readData()
    console.log(`现有快照数: ${existingData.length}`)

    // 2. 抓取新数据
    console.log('\n📋 步骤 2: 抓取新数据')
    const items = await fetchZhihuHotList()

    // 3. 创建快照
    console.log('\n📋 步骤 3: 创建快照')
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleString('zh-CN'),
      count: items.length,
      items: items
    }
    console.log(`快照ID: ${snapshot.id}`)

    // 4. 合并数据
    console.log('\n📋 步骤 4: 合并数据')
    const newData = [snapshot, ...existingData].slice(0, CONFIG.MAX_SNAPSHOTS)
    console.log(`合并后快照数: ${newData.length}`)

    // 5. 保存数据
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
if (require.main === module) {
  main()
}

// 导出供其他模块使用
module.exports = { fetchZhihuHotList, saveData, readData, main }
