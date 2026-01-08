<template>
  <div class="zhihu-hot-section">
    <!-- 标题区域 -->
    <div class="section-header">
      <h2>🔥 知乎热榜监控</h2>
      <p class="subtitle">GitHub Actions 自动抓取 + GitHub API 存储</p>
    </div>

    <!-- GitHub 配置 -->
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
          @click="testConnection"
          class="btn btn-info"
          :disabled="isTesting"
        >
          {{ isTesting ? '测试中...' : '测试连接' }}
        </button>
      </div>
      <div class="config-hint">
        💡 提示：GitHub Actions 会每30分钟自动抓取并保存数据
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel" v-if="isConfigured">
      <div class="control-group">
        <button
          @click="loadData"
          class="btn btn-primary"
          :disabled="isLoading"
        >
          {{ isLoading ? '加载中...' : '从 GitHub 加载' }}
        </button>
        <button
          @click="loadLatest"
          class="btn btn-success"
          :disabled="isLoading"
        >
          加载最新
        </button>
        <button
          @click="showStats"
          class="btn btn-info"
          :disabled="isLoading"
        >
          统计信息
        </button>
        <button
          @click="triggerManualFetch"
          class="btn btn-warning"
          :disabled="isFetching"
        >
          {{ isFetching ? '触发中...' : '手动触发抓取' }}
        </button>
      </div>

      <div class="cache-info">
        <span>本地缓存: {{ cacheStatus }}</span>
        <button @click="clearCache" class="btn btn-sm">清除缓存</button>
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
        <button @click="clearHistory" class="btn btn-danger btn-sm">清空本地历史</button>
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
    <div class="empty-state" v-if="!isLoading && currentHot.length === 0 && !error">
      <div class="empty-icon">🔍</div>
      <div class="empty-text">暂无数据，请配置 GitHub 信息后点击"从 GitHub 加载"</div>
      <div class="empty-hint">
        💡 提示：<br/>
        1. 配置 GitHub 仓库信息<br/>
        2. 点击"测试连接"验证<br/>
        3. 点击"从 GitHub 加载"查看数据<br/>
        4. GitHub Actions 会自动定时抓取
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ZhihuHotItem, HotSnapshot } from '@/types/zhihu'

// 配置接口
interface GitHubConfig {
  username: string
  repo: string
  dataPath: string
}

// 配置状态
const config = ref<GitHubConfig>({
  username: 'geeker-wang',
  repo: 'first_page',
  dataPath: 'data/zhihu-hot.json'
})

// 应用状态
const currentHot = ref<ZhihuHotItem[]>([])
const snapshots = ref<HotSnapshot[]>([])
const isLoading = ref(false)
const isTesting = ref(false)
const isFetching = ref(false)
const lastFetchTime = ref<number | undefined>()
const error = ref('')
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'warning'>('info')
const expandedSnapshots = ref<Set<string>>(new Set())

// 缓存状态
const cacheStatus = computed(() => {
  const cached = localStorage.getItem('zhihu_cache_timestamp')
  if (!cached) return '无'
  const time = new Date(parseInt(cached))
  return time.toLocaleString('zh-CN')
})

// 计算属性
const isConfigured = computed(() => {
  return !!config.value.username && !!config.value.repo
})

const canSaveConfig = computed(() => {
  return config.value.username && config.value.repo
})

const lastUpdateTime = computed(() => {
  if (!lastFetchTime.value) return '暂无'
  return new Date(lastFetchTime.value).toLocaleString('zh-CN')
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
    localStorage.setItem('zhihu_github_config', JSON.stringify(config.value))
    showStatus('✅ 配置已保存', 'success')
    // 自动测试连接
    testConnection()
  } catch (e) {
    showError(`保存配置失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

const resetConfig = () => {
  if (confirm('确定要重置配置吗？')) {
    localStorage.removeItem('zhihu_github_config')
    config.value = {
      username: '',
      repo: 'first_page',
      dataPath: 'data/zhihu-hot.json'
    }
    currentHot.value = []
    snapshots.value = []
    showStatus('⚠️ 配置已重置', 'warning')
  }
}

const loadConfig = () => {
  const saved = localStorage.getItem('zhihu_github_config')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      config.value = { ...config.value, ...parsed }
      showStatus('✅ 配置已恢复', 'info', 2000)
    } catch (e) {
      console.error('加载配置失败:', e)
    }
  }
}

// GitHub API 调用
const getGitHubApiUrl = () => {
  return `https://api.github.com/repos/${config.value.username}/${config.value.repo}/contents/${config.value.dataPath}`
}

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
  const content = atob(data.content) // Base64 解码
  return JSON.parse(content)
}

// 测试连接
const testConnection = async () => {
  if (!config.value.username || !config.value.repo) {
    showError('请先输入 GitHub 用户名和仓库名')
    return
  }

  isTesting.value = true
  error.value = ''

  try {
    const url = getGitHubApiUrl()
    const response = await fetch(url)

    if (response.status === 200) {
      showStatus('✅ GitHub 连接成功', 'success')
    } else if (response.status === 404) {
      showError('数据文件不存在（data/zhihu-hot.json），请先运行 GitHub Actions')
    } else {
      showError(`连接失败: HTTP ${response.status}`)
    }
  } catch (e) {
    showError(`测试失败: ${e instanceof Error ? e.message : '未知错误'}`)
  } finally {
    isTesting.value = false
  }
}

// 从 GitHub 加载数据
const loadData = async () => {
  if (!isConfigured.value) {
    showError('请先配置 GitHub 信息')
    return
  }

  isLoading.value = true
  error.value = ''
  showStatus('🔄 正在从 GitHub 加载...', 'info', 0)

  try {
    // 检查缓存（5分钟内有效）
    const cacheKey = 'zhihu_cache_data'
    const cacheTimeKey = 'zhihu_cache_timestamp'
    const cached = localStorage.getItem(cacheKey)
    const cacheTime = localStorage.getItem(cacheTimeKey)

    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime)
      if (age < 5 * 60 * 1000) { // 5分钟
        console.log('使用缓存数据')
        const data = JSON.parse(cached)
        processLoadedData(data)
        showStatus('✅ 从缓存加载成功', 'success')
        isLoading.value = false
        return
      }
    }

    // 从 GitHub 获取
    const data = await fetchFromGitHub()

    if (data.length > 0) {
      // 保存到缓存
      localStorage.setItem(cacheKey, JSON.stringify(data))
      localStorage.setItem(cacheTimeKey, Date.now().toString())

      processLoadedData(data)
      showStatus(`✅ 加载成功: ${data.length} 条历史记录`, 'success')
    } else {
      showStatus('ℹ️ 暂无数据', 'info')
    }
  } catch (e) {
    showError(`加载失败: ${e instanceof Error ? e.message : '未知错误'}`)
  } finally {
    isLoading.value = false
  }
}

// 处理加载的数据
const processLoadedData = (data: HotSnapshot[]) => {
  snapshots.value = data

  // 显示最新的快照作为当前数据
  if (data[0]?.items) {
    currentHot.value = data[0].items
    lastFetchTime.value = data[0].timestamp
  }
}

// 加载最新
const loadLatest = async () => {
  if (!isConfigured.value) {
    showError('请先配置 GitHub 信息')
    return
  }

  isLoading.value = true
  error.value = ''
  showStatus('🔄 正在加载最新数据...', 'info', 0)

  try {
    const data = await fetchFromGitHub()

    if (data.length > 0) {
      currentHot.value = data[0].items
      lastFetchTime.value = data[0].timestamp
      showStatus(`✅ 最新数据: ${data[0].formattedTime}`, 'success')
    } else {
      showStatus('ℹ️ 暂无数据', 'info')
    }
  } catch (e) {
    showError(`加载失败: ${e instanceof Error ? e.message : '未知错误'}`)
  } finally {
    isLoading.value = false
  }
}

// 显示统计
const showStats = async () => {
  if (!isConfigured.value) {
    showError('请先配置 GitHub 信息')
    return
  }

  try {
    const data = await fetchFromGitHub()

    if (data.length === 0) {
      alert('暂无数据')
      return
    }

    const totalItems = data.reduce((sum, s) => sum + s.count, 0)
    const firstRecord = data[data.length - 1]?.formattedTime || '无'
    const lastRecord = data[0]?.formattedTime || '无'

    const message = `
📊 统计信息:
- 总快照数: ${data.length}
- 总条目数: ${totalItems}
- 首次记录: ${firstRecord}
- 最后记录: ${lastRecord}
    `.trim()

    alert(message)
  } catch (e) {
    showError(`获取统计失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

// 触发手动抓取（通过 GitHub Actions）
const triggerManualFetch = async () => {
  if (!isConfigured.value) {
    showError('请先配置 GitHub 信息')
    return
  }

  isFetching.value = true
  error.value = ''
  showStatus('🔄 正在触发 GitHub Actions...', 'info', 0)

  try {
    // 方法 1: 通过 GitHub API 触发 Workflow（需要 Token）
    // 方法 2: 提示用户手动触发
    const message = `
⚠️ 手动触发抓取

由于 GitHub 安全限制，前端无法直接触发 Actions。

请按以下步骤操作：

1. 访问你的 GitHub 仓库
2. 进入 Actions 标签页
3. 找到"自动抓取知乎热榜"
4. 点击"Run workflow"
5. 等待 10-20 秒
6. 返回页面点击"从 GitHub 加载"

或者等待下一次自动抓取（每30分钟）

提示：你也可以添加 GitHub Token 来自动触发
    `.trim()

    alert(message)
    showStatus('ℹ️ 请手动触发 GitHub Actions', 'info')
  } catch (e) {
    showError(`触发失败: ${e instanceof Error ? e.message : '未知错误'}`)
  } finally {
    isFetching.value = false
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
  if (confirm('确定要清空所有历史记录吗？（仅本地缓存，不影响 GitHub 上的数据）')) {
    snapshots.value = []
    expandedSnapshots.value.clear()
    showStatus('✅ 历史记录已清空', 'info')
  }
}

// 清除缓存
const clearCache = () => {
  localStorage.removeItem('zhihu_cache_data')
  localStorage.removeItem('zhihu_cache_timestamp')
  showStatus('✅ 缓存已清除', 'success')
}

// 生命周期
onMounted(() => {
  loadConfig()
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

.config-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.config-hint {
  margin-top: 10px;
  padding: 10px;
  background: #e6fffa;
  border-radius: 6px;
  color: #234e52;
  font-size: 0.85em;
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

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95em;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-success {
  background: #48bb78;
  color: white;
}

.btn-info {
  background: #4299e1;
  color: white;
}

.btn-warning {
  background: #ed8936;
  color: white;
}

.btn-danger {
  background: #e53e3e;
  color: white;
}

.btn-secondary {
  background: #718096;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
}

.cache-info {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  background: #f7fafc;
  border-radius: 8px;
  font-size: 0.85em;
  color: #4a5568;
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
  text-align: left;
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

  .cache-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>
