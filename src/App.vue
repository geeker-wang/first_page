<template>
  <div id="app">
    <div class="container">
      <div class="header">
        <div class="logo">🚀</div>
        <h1>欢迎使用 Vue + GitHub Pages</h1>
        <p class="subtitle">现代化的单页应用部署方案</p>
      </div>

      <div class="counter-section">
        <div class="counter">{{ count }}</div>
        <div class="buttons">
          <button @click="decrement" class="btn btn-danger">-</button>
          <button @click="increment" class="btn btn-primary">+</button>
          <button @click="reset" class="btn btn-secondary">重置</button>
        </div>
      </div>

      <div class="features">
        <div class="feature-card" v-for="feature in features" :key="feature.title">
          <div class="icon">{{ feature.icon }}</div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.desc }}</p>
        </div>
      </div>

      <div class="actions">
        <a href="https://vitejs.dev" target="_blank" class="btn-link">Vite Docs</a>
        <a href="https://vuejs.org" target="_blank" class="btn-link">Vue Docs</a>
        <a href="https://docs.github.com/pages" target="_blank" class="btn-link">GitHub Pages</a>
      </div>

      <div class="footer">
        <p>使用 Vue 3 + Vite 构建</p>
        <p>部署于 {{ new Date().getFullYear() }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 定义 Feature 接口
interface Feature {
  icon: string
  title: string
  desc: string
}

const count = ref<number>(0)

const features = ref<Feature[]>([
  {
    icon: '⚡',
    title: '快速开发',
    desc: 'Vite 提供闪电般的开发体验'
  },
  {
    icon: '📦',
    title: '组件化',
    desc: 'Vue 3 组合式 API 更灵活'
  },
  {
    icon: '🎨',
    title: '现代化',
    desc: '响应式设计，完美适配'
  },
  {
    icon: '🚀',
    title: '自动部署',
    desc: 'GitHub Actions 集成'
  }
])

function increment(): void {
  count.value++
}

function decrement(): void {
  count.value--
}

function reset(): void {
  count.value = 0
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
}

#app {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  max-width: 900px;
  width: 100%;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
  font-weight: bold;
}

h1 {
  font-size: 2em;
  color: #2d3748;
  margin-bottom: 10px;
}

.subtitle {
  color: #718096;
  font-size: 1.1em;
}

.counter-section {
  text-align: center;
  margin: 30px 0;
  padding: 30px;
  background: #f7fafc;
  border-radius: 15px;
  border: 2px solid #e2e8f0;
}

.counter {
  font-size: 4em;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 20px;
  font-family: 'Courier New', monospace;
}

.buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #667eea;
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

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.feature-card {
  background: #f7fafc;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: #667eea;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.2);
}

.icon {
  font-size: 2em;
  margin-bottom: 10px;
}

.feature-card h3 {
  color: #667eea;
  margin-bottom: 8px;
  font-size: 1.1em;
}

.feature-card p {
  color: #718096;
  font-size: 0.9em;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 20px 0;
}

.btn-link {
  padding: 10px 20px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-link:hover {
  background: #667eea;
  color: white;
}

.footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  color: #a0aec0;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .container {
    padding: 20px;
  }

  h1 {
    font-size: 1.5em;
  }

  .counter {
    font-size: 3em;
  }

  .features {
    grid-template-columns: 1fr;
  }

  .buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>