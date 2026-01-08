<template>
  <div class="zhihu-hot-section">
    <!-- 标题区域 -->
    <div class="section-header">
      <h2>🔥 知乎热榜监控</h2>
      <p class="subtitle">实时抓取 + 历史数据 + GitHub 自动保存</p>
    </div>

    <!-- 配置面板 -->
    <div class="config-panel">
      <div class="config-group">
        <label>GitHub 用户名</label>
        <input
          v-model="config.username"
          type="text"
          placeholder="your-username"
          :disabled="isConfigured"
        />
      </div>
      <div class="config-group">
        <label>仓库名</label>
        <input
          v-model="config.repo"
          type="text"
          placeholder="first_page"
          :disabled="isConfigured"
        />
      </div>
      <div class="config-group">
        <label>GitHub Token</label>
        <input
          v-model="config.token"
          type="password"
          placeholder="ghp_xxxxxxxxxxxx"
          :disabled="isConfigured"
        />
        <small class="hint">Token 仅保存在本地浏览器中</small>
      </div>
      <div class="config-group">
        <label>数据文件路径</label>
        <input
          v-model="config.dataPath"
          type="text"
          placeholder="data/zhihu-hot.json"
          :disabled="isConfigured"
        />
      </div>
      <div class="config-actions">
        <button
          v-if="!isConfigured"
          @click="saveConfig"
          class="btn btn-primary"
          :disabled="!canSaveConfig"
        >
          保存配置
        </button>
        <button
          v-else
          @click="resetConfig"
          class="btn btn-secondary"
        >
          重置配置
        </button>
        <button
          v-if="isConfigured"
          @click="testGitHub"
          class="btn btn-info"
          :disabled="isTesting"
        >
          {{ isTesting ? '测试中...' : '测试连接' }}
        </button>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel" v-if="isConfigured">
      <div class="control-group">
        <button
          @click="manualFetch"
          class="btn btn-primary"
          :disabled="isFetching"
        >
          {{ isFetching ? '抓取中...' : '手动抓取' }}
        </button>
        <button
          @click="toggleAutoFetch"
          class="btn"
          :class="autoFetchEnabled ? 'btn-danger' : 'btn-success'"
          :disabled="isFetching"
        >
          {{ autoFetchEnabled ? '停止自动抓取' : '启用自动抓取' }}
        </button>
        <button
          @click="loadFromGitHub"
          class="btn btn-info"
          :disabled="isLoading"
        >
          {{ isLoading ? '加载中...' : '从 GitHub 加载' }}
        </button>
      </div>

      <div class="schedule-config">
        <label>自动抓取间隔（分钟）:</label>
        <input
          v-model.number="interval"
          type="number"
          min="5"
          max="1440"
          style="width: 80px;"
        />
        <span v-if="nextFetchTime" class="next-fetch">
          下次抓取: {{ nextFetchTime }}
        </span>
      </div>
    </div>

    <!-- 状态提示 -->
    <div class="status-bar" v-if="statusMessage">
      <div :class="['status', statusType]">
        {{ statusMessage }}
      </div>
    </div>

    <!-- 错误提示 -->
    <div class="error-bar" v-if="error">
      <div class="error">
        ❌ {{ error }}
        <button @click="error = ''" class="btn-close">✕</button>
      </div>
    </div>

    <!-- 当前热榜数据 -->
    <div class="hot-list-section" v-if="currentHot.length > 0">
      <div class="section-title">
        <h3>📊 当前热榜 ({{ currentHot.length }}条)</h3>
        <span class="timestamp">最后更新: {{ lastUpdateTime }}</span>
      </div>

      <div class="hot-list">
        <div
          v-for="(item, index) in currentHot"
          :key="item.id"
          class="hot-item"
          :class="{ 'top-3': index < 3 }"
        >
          <div class="rank">{{ index + 1 }}</div>
          <div class="content">
            <div class="title">
              <a :href="item.url" target="_blank">{{ item.title }}</a>
            </div>
            <div class="description" v-if="item.description">
              {{ item.description }}
            </div>
            <div class="meta">
              <span class="heat">🔥 {{ formatNumber(item.heat) }}</span>
              <span class="time">{{ item.fetchTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史快照 -->
    <div class="snapshots-section" v-if="snapshots.length > 0">
      <div class="section-title">
        <h3>📚 历史快照 ({{ snapshots.length }}条)</h3>
        <button @click="clearHistory" class="btn btn-danger btn-sm">清空历史</button>
      </div>

      <div class="snapshots-list">
        <div
          v-for="snapshot in snapshots"
          :key="snapshot.id"
          class="snapshot-item"
        >
          <div class="snapshot-header" @click="toggleSnapshot(snapshot.id)">
            <span class="snapshot-time">📅 {{ snapshot.formattedTime }}</span>
            <span class="snapshot-count">{{ snapshot.count }} 条</span>
            <span class="toggle-icon">{{ expandedSnapshots.has(snapshot.id) ? '▼' : '▶' }}</span>
          </div>

          <div
            v-if="expandedSnapshots.has(snapshot.id)"
            class="snapshot-content"
          >
            <div
              v-for="(item, idx) in snapshot.items"
              :key="item.id"
              class="snapshot-item-detail"
            >
              <span class="idx">{{ idx + 1 }}</span>
              <span class="title">{{ item.title }}</span>
              <span class="heat">{{ formatNumber(item.heat) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="!isFetching && currentHot.length === 0 && !error">
      <div class="empty-icon">🔍</div>
      <div class="empty-text">暂无数据，请配置 GitHub 信息后点击"手动抓取"</div>
      <div class="empty-hint">
        💡 提示：配置 Token 后数据会自动保存到 GitHub<br/>
        📝 数据文件路径: {{ config.dataPath || 'data/zhihu-hot.json' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ZhihuHotItem, HotSnapshot, GitHubConfig, ScheduleConfig } from '@/types/zhihu'
import { zhihuCrawler } from '@/services/zhihuCrawler'
import { initGitHubStorage, githubStorage } from '@/services/githubStorage'
import { initScheduler, scheduler } from '@/services/scheduler'

// 配置状态
const config = ref<GitHubConfig>({
  username: '',
  repo: 'first_page',
  token: '',
  dataPath: 'data/zhihu-hot.json'
})

// 应用状态
const currentHot = ref<ZhihuHotItem[]>([])
const snapshots = ref<HotSnapshot[]>([])
const isFetching = ref(false)
const isLoading = ref(false)
const isTesting = ref(false)
const lastFetchTime = ref<number | undefined>()
const error = ref('')
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'warning'>('info')

// 定时任务状态
const autoFetchEnabled = ref(false)
const interval = ref<number>(30) // 默认30分钟
const nextFetchTime = ref<string>('')

// UI 状态
const expandedSnapshots = ref<Set<string>>(new Set())

// 计算属性
const isConfigured = computed(() => {
  return !!config.value.username && !!config.value.repo && !!config.value.token
})

const canSaveConfig = computed(() => {
  return config.value.username && config.value.repo
})

const lastUpdateTime = computed(() => {
  if (!lastFetchTime.value) return '暂无'
  const date = new Date(lastFetchTime.value)
  return date.toLocaleString('zh-CN')
})

// 方法
const showStatus = (message: string, type: 'info' | 'success' | 'warning' = 'info', duration: number = 3000) => {
  statusMessage.value = message
  statusType.value = type
  if (duration > 0) {
    setTimeout(() => {
      statusMessage.value = ''
    }, duration)
  }
}

const showError = (message: string) => {
  error.value = message
}

const clearError = () => {
  error.value = ''
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 配置管理
const saveConfig = () => {
  try {
    // 保存到 localStorage
    localStorage.setItem('zhihu_config', JSON.stringify(config.value))

    // 初始化 GitHub 存储
    initGitHubStorage(config.value)

    showStatus('✅ 配置已保存', 'success')

    // 自动从 GitHub 加载数据
    loadFromGitHub()

  } catch (e) {
    showError(`保存配置失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

const resetConfig = () => {
  if (confirm('确定要重置配置吗？这将清除本地保存的 Token 等信息。')) {
    localStorage.removeItem('zhihu_config')
    config.value = {
      username: '',
      repo: 'first_page',
      token: '',
      dataPath: 'data/zhihu-hot.json'
    }
    currentHot.value = []
    snapshots.value = []
    autoFetchEnabled.value = false
    if (scheduler) {
      scheduler.stop()
    }
    showStatus('⚠️ 配置已重置', 'warning')
  }
}

const loadConfig = () => {
  const saved = localStorage.getItem('zhihu_config')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      config.value = { ...config.value, ...parsed }

      if (config.value.token) {
        initGitHubStorage(config.value)
      }

      // 恢复间隔设置
      const savedInterval = localStorage.getItem('zhihu_interval')
      if (savedInterval) {
        interval.value = parseInt(savedInterval)
      }

      showStatus('✅ 配置已恢复', 'info', 2000)
    } catch (e) {
      console.error('加载配置失败:', e)
    }
  }
}

// GitHub 操作
const testGitHub = async () => {
  if (!config.value.token) {
    showError('请先输入 GitHub Token')
    return
  }

  isTesting.value = true
  clearError()

  try {
    const storage = initGitHubStorage(config.value)
    const success = await storage.testConnection()

    if (success) {
      showStatus('✅ GitHub 连接成功', 'success')
    } else {
      showError('GitHub 连接失败，请检查 Token 和仓库权限')
    }
  } catch (e) {
    showError(`测试失败: ${e instanceof Error ? e.message : '未知错误'}`)
  } finally {
    isTesting.value = false
  }
}

const loadFromGitHub = async () => {
  if (!githubStorage) {
    showError('请先配置 GitHub 信息')
    return
  }

  isLoading.value = true
  clearError()

  try {
    const data = await githubStorage.readData()

    if (data.length > 0) {
      snapshots.value = data

      // 显示最新的快照作为当前数据
      if (data[0].items) {
        currentHot.value = data[0].items
        lastFetchTime.value = data[0].timestamp
      }

      showStatus(`✅ 成功加载 ${data.length} 条历史记录`, 'success')
    } else {
      showStatus('ℹ️ GitHub 上暂无数据，请先手动抓取', 'info')
    }
  } catch (e) {
    showError(`加载失败: ${e instanceof Error ? e.message : '未知错误'}`)
  } finally {
    isLoading.value = false
  }
}

// 抓取操作
const manualFetch = async () => {
  if (!githubStorage) {
    showError('请先配置 GitHub 信息')
    return
  }

  isFetching.value = true
  clearError()
  showStatus('🔄 正在抓取数据...', 'info', 0)

  try {
    // 执行抓取
    const items = await zhihuCrawler.fetchHotList()

    if (items.length > 0) {
      currentHot.value = items
      lastFetchTime.value = Date.now()

      // 创建快照
      const snapshot: HotSnapshot = {
        id: `snapshot-${Date.now()}`,
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleString('zh-CN'),
        items: items,
        count: items.length
      }

      // 保存到 GitHub
      const success = await githubStorage.addSnapshot(snapshot)

      if (success) {
        showStatus(`✅ 抓取成功并保存 (${items.length} 条)`, 'success')

        // 更新历史记录
        snapshots.value.unshift(snapshot)
        if (snapshots.value.length > 50) {
          snapshots.value = snapshots.value.slice(0, 50)
        }
      } else {
        showStatus(`⚠️ 抓取成功但保存失败 (${items.length} 条)`, 'warning')
      }
    } else {
      showError('未获取到数据')
    }
  } catch (e) {
    showError(`抓取失败: ${e instanceof Error ? e.message : '未知错误'}`)
  } finally {
    isFetching.value = false
  }
}

// 自动抓取控制
const toggleAutoFetch = () => {
  if (autoFetchEnabled.value) {
    // 停止
    if (scheduler) {
      scheduler.stop()
    }
    autoFetchEnabled.value = false
    nextFetchTime.value = ''
    showStatus('⏰ 自动抓取已停止', 'warning')
  } else {
    // 启动
    if (!githubStorage) {
      showError('请先配置 GitHub 信息')
      return
    }

    const scheduleConfig: ScheduleConfig = {
      enabled: true,
      interval: interval.value,
      nextFetch: Date.now() + interval.value * 60 * 1000
    }

    initScheduler(scheduleConfig)

    if (scheduler) {
      scheduler.start()
      autoFetchEnabled.value = true
      updateNextFetchDisplay()
      showStatus(`⏰ 自动抓取已启动 (${interval.value} 分钟间隔)`, 'success')

      // 保存间隔设置
      localStorage.setItem('zhihu_interval', interval.value.toString())
    }
  }
}

const updateNextFetchDisplay = () => {
  if (scheduler) {
    const status = scheduler.getStatus()
    if (status.nextFetch) {
      const time = new Date(status.nextFetch)
      nextFetchTime.value = time.toLocaleTimeString('zh-CN')

      // 每秒更新一次倒计时
      setTimeout(updateNextFetchDisplay, 1000)
    }
  }
}

// 快照展开/收起
const toggleSnapshot = (id: string) => {
  if (expandedSnapshots.value.has(id)) {
    expandedSnapshots.value.delete(id)
  } else {
    expandedSnapshots.value.add(id)
  }
}

// 清空历史
const clearHistory = () => {
  if (confirm('确定要清空所有历史记录吗？（仅本地，不影响 GitHub 上的数据）')) {
    snapshots.value = []
    expandedSnapshots.value.clear()
    showStatus('✅ 历史记录已清空', 'info')
  }
}

// 生命周期
onMounted(() => {
  loadConfig()

  // 检查是否有保存的自动抓取状态
  const savedAutoFetch = localStorage.getItem('zhihu_auto_fetch')
  if (savedAutoFetch === 'true' && isConfigured.value) {
    // 延迟启动，避免初始化冲突
    setTimeout(() => {
      toggleAutoFetch()
    }, 1000)
  }
})

onUnmounted(() => {
  // 清理定时器
  if (scheduler) {
    scheduler.stop()
  }

  // 保存自动抓取状态
  localStorage.setItem('zhihu_auto_fetch', autoFetchEnabled.value.toString())
})
</script>

<style scoped>
/* 配置面板 */
.config-panel {
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
}

.config-group {
  margin-bottom: 15px;
}

.config-group label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 5px;
  font-size: 0.9em;
}

.config-group input {
  width: 100%;
  padding: 10px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95em;
  transition: all 0.3s ease;
}

.config-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.config-group input:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
  opacity: 0.7;
}

.hint {
  color: #718096;
  font-size: 0.8em;
  margin-top: 3px;
  display: block;
}

.config-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* 控制面板 */
.control-panel {
  background: #fff;
  border: 2px solid #667eea;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
}

.control-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.btn-success {
  background: #48bb78;
  color: white;
}

.btn-info {
  background: #4299e1;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
}

.schedule-config {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.schedule-config label {
  font-weight: 600;
  color: #2d3748;
}

.schedule-config input {
  padding: 6px 10px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
}

.next-fetch {
  color: #667eea;
  font-weight: 600;
  margin-left: 10px;
}

/* 状态栏 */
.status-bar {
  margin: 15px 0;
}

.status {
  padding: 12px 20px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
}

.status.info {
  background: #bee3f8;
  color: #2c5282;
  border: 2px solid #90cdf4;
}

.status.success {
  background: #c6f6d5;
  color: #22543d;
  border: 2px solid #9ae6b4;
}

.status.warning {
  background: #feebc8;
  color: #744210;
  border: 2px solid #fbd38d;
}

/* 错误栏 */
.error-bar {
  margin: 15px 0;
}

.error {
  padding: 12px 20px;
  background: #fed7d7;
  color: #742a2a;
  border: 2px solid #fc8181;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-close {
  background: transparent;
  border: none;
  color: #742a2a;
  font-size: 1.2em;
  cursor: pointer;
  padding: 0 5px;
}

/* 热榜列表 */
.hot-list-section,
.snapshots-section {
  margin: 25px 0;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0;
}

.section-title h3 {
  color: #2d3748;
  font-size: 1.3em;
}

.timestamp {
  color: #718096;
  font-size: 0.85em;
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hot-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.hot-item:hover {
  transform: translateX(5px);
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.hot-item.top-3 {
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
  border-color: #fc8181;
  border-width: 3px;
}

.rank {
  font-size: 1.8em;
  font-weight: bold;
  color: #667eea;
  min-width: 40px;
  text-align: center;
  font-family: 'Courier New', monospace;
}

.hot-item.top-3 .rank {
  color: #e53e3e;
  font-size: 2em;
}

.content {
  flex: 1;
}

.title {
  margin-bottom: 8px;
}

.title a {
  color: #2d3748;
  font-weight: 600;
  text-decoration: none;
  font-size: 1.05em;
  line-height: 1.4;
}

.title a:hover {
  color: #667eea;
  text-decoration: underline;
}

.description {
  color: #4a5568;
  font-size: 0.9em;
  margin-bottom: 8px;
  line-height: 1.5;
}

.meta {
  display: flex;
  gap: 15px;
  font-size: 0.85em;
  color: #718096;
}

.heat {
  color: #dd6b20;
  font-weight: 600;
}

.time {
  color: #a0aec0;
}

/* 快照列表 */
.snapshots-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 600px;
  overflow-y: auto;
}

.snapshot-item {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.snapshot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f7fafc;
  cursor: pointer;
  transition: background 0.2s ease;
}

.snapshot-header:hover {
  background: #edf2f7;
}

.snapshot-time {
  font-weight: 600;
  color: #2d3748;
}

.snapshot-count {
  color: #718096;
  font-size: 0.9em;
}

.toggle-icon {
  color: #667eea;
  font-weight: bold;
}

.snapshot-content {
  padding: 10px;
  background: white;
  max-height: 300px;
  overflow-y: auto;
}

.snapshot-item-detail {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9em;
}

.snapshot-item-detail:last-child {
  border-bottom: none;
}

.snapshot-item-detail .idx {
  color: #667eea;
  font-weight: 600;
  min-width: 25px;
}

.snapshot-item-detail .title {
  flex: 1;
  color: #2d3748;
}

.snapshot-item-detail .heat {
  color: #dd6b20;
  font-weight: 600;
  min-width: 60px;
  text-align: right;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 1.2em;
  font-weight: 600;
  margin-bottom: 15px;
  color: #4a5568;
}

.empty-hint {
  font-size: 0.9em;
  line-height: 1.8;
  color: #a0aec0;
  background: #f7fafc;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .config-panel,
  .control-panel {
    padding: 15px;
  }

  .control-group {
    flex-direction: column;
  }

  .control-group button {
    width: 100%;
  }

  .schedule-config {
    flex-direction: column;
    align-items: flex-start;
  }

  .hot-item {
    flex-direction: column;
    gap: 10px;
  }

  .rank {
    align-self: flex-start;
  }

  .section-title {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .snapshot-header {
    flex-direction: column;
    gap: 5px;
    align-items: flex-start;
  }
}
</style>
