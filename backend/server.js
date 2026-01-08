/**
 * 知乎热榜后端服务
 * 提供爬取、存储、查询 API
 */

import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import cron from 'node-cron'
import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// CORS 配置
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
app.use(cors({
  origin: function (origin, callback) {
    // 允许无 origin 的请求（如 Postman）
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 数据库初始化
const dbPath = process.env.DB_PATH || './data/zhihu-hot.db'
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message)
  } else {
    console.log('✅ 数据库连接成功:', dbPath)
    initDatabase()
  }
})

// 初始化数据库表
function initDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS hot_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id TEXT UNIQUE NOT NULL,
      timestamp INTEGER NOT NULL,
      formatted_time TEXT NOT NULL,
      count INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hot_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      heat INTEGER NOT NULL,
      url TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      fetch_time TEXT NOT NULL,
      rank INTEGER NOT NULL,
      FOREIGN KEY (snapshot_id) REFERENCES hot_snapshots(snapshot_id) ON DELETE CASCADE,
      UNIQUE(snapshot_id, item_id)
    );

    CREATE INDEX IF NOT EXISTS idx_snapshot_timestamp ON hot_snapshots(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_items_snapshot ON hot_items(snapshot_id);
  `

  db.exec(createTableSQL, (err) => {
    if (err) {
      console.error('初始化数据库失败:', err.message)
    } else {
      console.log('✅ 数据库表初始化完成')
    }
  })
}

// ==================== API 端点 ====================

/**
 * @route   GET /api/health
 * @desc    健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0'
  })
})

/**
 * @route   POST /api/fetch
 * @desc    手动抓取知乎热榜
 */
app.post('/api/fetch', async (req, res) => {
  console.log('🔄 收到抓取请求...')

  try {
    // 1. 抓取数据
    const items = await fetchZhihuHotList()

    if (!items || items.length === 0) {
      return res.status(500).json({
        success: false,
        message: '未获取到数据'
      })
    }

    // 2. 创建快照
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleString('zh-CN'),
      count: items.length,
      items: items
    }

    // 3. 保存到数据库
    const success = await saveSnapshot(snapshot)

    if (success) {
      console.log(`✅ 抓取并保存成功: ${items.length} 条`)
      res.json({
        success: true,
        message: '抓取成功',
        data: snapshot
      })
    } else {
      res.status(500).json({
        success: false,
        message: '保存失败'
      })
    }
  } catch (error) {
    console.error('❌ 抓取失败:', error.message)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route   GET /api/history
 * @desc    获取历史记录
 * @param   {number} limit - 返回数量限制（默认50）
 */
app.get('/api/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  const offset = parseInt(req.query.offset) || 0

  const sql = `
    SELECT
      s.snapshot_id as id,
      s.timestamp,
      s.formatted_time as formattedTime,
      s.count,
      s.created_at,
      GROUP_CONCAT(
        json_object(
          'item_id', i.item_id,
          'title', i.title,
          'description', i.description,
          'heat', i.heat,
          'url', i.url,
          'timestamp', i.timestamp,
          'fetch_time', i.fetch_time,
          'rank', i.rank
        )
      ) as items_json
    FROM hot_snapshots s
    LEFT JOIN hot_items i ON s.snapshot_id = i.snapshot_id
    GROUP BY s.snapshot_id
    ORDER BY s.timestamp DESC
    LIMIT ? OFFSET ?
  `

  db.all(sql, [limit, offset], (err, rows) => {
    if (err) {
      console.error('查询历史失败:', err.message)
      return res.status(500).json({
        success: false,
        message: '查询失败'
      })
    }

    const snapshots = rows.map(row => {
      let items = []
      if (row.items_json) {
        // 解析 JSON 数组
        const itemsArray = row.items_json.split(',')
          .filter(item => item && item !== 'null')
          .map(item => JSON.parse(item))
        items = itemsArray
      }

      return {
        id: row.id,
        timestamp: row.timestamp,
        formattedTime: row.formattedTime,
        count: row.count,
        items: items.sort((a, b) => a.rank - b.rank)
      }
    })

    res.json({
      success: true,
      data: snapshots
    })
  })
})

/**
 * @route   GET /api/latest
 * @desc    获取最新的一条记录
 */
app.get('/api/latest', (req, res) => {
  const sql = `
    SELECT
      s.snapshot_id as id,
      s.timestamp,
      s.formatted_time as formattedTime,
      s.count,
      GROUP_CONCAT(
        json_object(
          'item_id', i.item_id,
          'title', i.title,
          'description', i.description,
          'heat', i.heat,
          'url', i.url,
          'timestamp', i.timestamp,
          'fetch_time', i.fetch_time,
          'rank', i.rank
        )
      ) as items_json
    FROM hot_snapshots s
    LEFT JOIN hot_items i ON s.snapshot_id = i.snapshot_id
    GROUP BY s.snapshot_id
    ORDER BY s.timestamp DESC
    LIMIT 1
  `

  db.get(sql, (err, row) => {
    if (err) {
      console.error('查询最新记录失败:', err.message)
      return res.status(500).json({
        success: false,
        message: '查询失败'
      })
    }

    if (!row) {
      return res.json({
        success: true,
        data: null
      })
    }

    let items = []
    if (row.items_json) {
      const itemsArray = row.items_json.split(',')
        .filter(item => item && item !== 'null')
        .map(item => JSON.parse(item))
      items = itemsArray
    }

    const snapshot = {
      id: row.id,
      timestamp: row.timestamp,
      formattedTime: row.formattedTime,
      count: row.count,
      items: items.sort((a, b) => a.rank - b.rank)
    }

    res.json({
      success: true,
      data: snapshot
    })
  })
})

/**
 * @route   GET /api/stats
 * @desc    获取统计信息
 */
app.get('/api/stats', (req, res) => {
  const sql = `
    SELECT
      COUNT(*) as total_snapshots,
      SUM(count) as total_items,
      MIN(timestamp) as first_record,
      MAX(timestamp) as last_record
    FROM hot_snapshots
  `

  db.get(sql, (err, row) => {
    if (err) {
      console.error('查询统计失败:', err.message)
      return res.status(500).json({
        success: false,
        message: '查询失败'
      })
    }

    res.json({
      success: true,
      data: {
        totalSnapshots: row.total_snapshots || 0,
        totalItems: row.total_items || 0,
        firstRecord: row.first_record,
        lastRecord: row.last_record,
        firstRecordTime: row.first_record ? new Date(row.first_record).toLocaleString('zh-CN') : null,
        lastRecordTime: row.last_record ? new Date(row.last_record).toLocaleString('zh-CN') : null
      }
    })
  })
})

/**
 * @route   POST /api/clear-history
 * @desc    清空历史记录（谨慎操作）
 */
app.post('/api/clear-history', (req, res) => {
  const confirm = req.body.confirm

  if (confirm !== 'YES_CLEAR_ALL') {
    return res.status(400).json({
      success: false,
      message: '需要确认码'
    })
  }

  db.exec('DELETE FROM hot_items; DELETE FROM hot_snapshots;', (err) => {
    if (err) {
      console.error('清空历史失败:', err.message)
      return res.status(500).json({
        success: false,
        message: '清空失败'
      })
    }

    console.log('⚠️ 历史记录已清空')
    res.json({
      success: true,
      message: '历史记录已清空'
    })
  })
})

// ==================== 核心功能函数 ====================

/**
 * 抓取知乎热榜数据
 */
async function fetchZhihuHotList() {
  try {
    const apiUrl = process.env.CORS_PROXY + encodeURIComponent(process.env.ZHIHU_API_URL)
    console.log('请求知乎API:', apiUrl)

    const response = await axios.get(apiUrl, {
      timeout: 10000,
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

    return items
  } catch (error) {
    console.error('抓取知乎API失败:', error.message)

    // 返回模拟数据
    console.log('⚠️ 使用模拟数据')
    return generateMockData()
  }
}

/**
 * 生成模拟数据（备用）
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
    id: `mock-${index}`,
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
 * 保存快照到数据库
 */
function saveSnapshot(snapshot) {
  return new Promise((resolve, reject) => {
    // 开始事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION')

      // 插入快照
      const snapshotSQL = `
        INSERT OR REPLACE INTO hot_snapshots
        (snapshot_id, timestamp, formatted_time, count)
        VALUES (?, ?, ?, ?)
      `

      db.run(
        snapshotSQL,
        [snapshot.id, snapshot.timestamp, snapshot.formattedTime, snapshot.count],
        function (err) {
          if (err) {
            db.run('ROLLBACK')
            console.error('保存快照失败:', err.message)
            reject(err)
            return
          }

          // 插入所有条目
          const itemSQL = `
            INSERT OR REPLACE INTO hot_items
            (snapshot_id, item_id, title, description, heat, url, timestamp, fetch_time, rank)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `

          const stmt = db.prepare(itemSQL)
          let completed = 0

          snapshot.items.forEach(item => {
            stmt.run(
              [
                snapshot.id,
                item.id,
                item.title,
                item.description,
                item.heat,
                item.url,
                item.timestamp,
                item.fetchTime,
                item.rank
              ],
              (err) => {
                if (err) {
                  console.error('保存条目失败:', err.message)
                }
              }
            )
          })

          stmt.finalize((err) => {
            if (err) {
              db.run('ROLLBACK')
              reject(err)
            } else {
              db.run('COMMIT', (err) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(true)
                }
              })
            }
          })
        }
      )
    })
  })
}

/**
 * 定时任务执行
 */
async function scheduledFetch() {
  console.log('⏰ 定时任务开始执行...', new Date().toLocaleString('zh-CN'))

  try {
    const items = await fetchZhihuHotList()

    if (items && items.length > 0) {
      const snapshot = {
        id: `snapshot-${Date.now()}`,
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleString('zh-CN'),
        count: items.length,
        items: items
      }

      const success = await saveSnapshot(snapshot)

      if (success) {
        console.log(`✅ 定时抓取成功: ${items.length} 条`)
      } else {
        console.error('❌ 定时抓取保存失败')
      }
    } else {
      console.error('❌ 定时抓取未获取到数据')
    }
  } catch (error) {
    console.error('❌ 定时任务失败:', error.message)
  }
}

// ==================== 定时任务 ====================

// 启动定时任务
const cronSchedule = process.env.CRON_SCHEDULE || '0 */30 * * * *'
if (cron.validate(cronSchedule)) {
  console.log(`⏰ 定时任务已启动: ${cronSchedule}`)
  cron.schedule(cronSchedule, scheduledFetch)
} else {
  console.error('❌ 无效的 Cron 表达式:', cronSchedule)
}

// ==================== 服务器启动 ====================

app.listen(PORT, () => {
  console.log('='.repeat(50))
  console.log('🚀 知乎热榜后端服务已启动')
  console.log(`📍 服务地址: http://localhost:${PORT}`)
  console.log(`📊 API 文档:`)
  console.log(`   - GET  /api/health        健康检查`)
  console.log(`   - POST /api/fetch         手动抓取`)
  console.log(`   - GET  /api/history       历史记录`)
  console.log(`   - GET  /api/latest        最新记录`)
  console.log(`   - GET  /api/stats         统计信息`)
  console.log(`   - POST /api/clear-history 清空历史`)
  console.log(`⏰ 定时任务: ${cronSchedule}`)
  console.log('='.repeat(50))
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务...')
  db.close((err) => {
    if (err) {
      console.error('关闭数据库失败:', err.message)
    } else {
      console.log('✅ 数据库已关闭')
    }
    process.exit(0)
  })
})
