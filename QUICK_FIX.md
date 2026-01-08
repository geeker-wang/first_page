# ⚡ 快速修复 - 中文乱码

## 问题
页面显示: `2024å¹´æå¼å¾å³æ³¨çç§æè¶å¿æ¯ä»ä¹ï¼`

## 原因
GitHub API 返回 Base64 编码，前端 `atob()` 不支持 UTF-8

## ✅ 2步修复

### 1️⃣ 删除乱码数据

**访问**: https://github.com/geeker-wang/first_page/edit/main/data/zhihu-hot.json

**删除**: 第 163-215 行 (最后一个快照)

**保留**: 前 162 行 (2个正常快照)

**提交**: `fix: 删除乱码数据`

---

### 2️⃣ 更新前端解码

**访问**: https://github.com/geeker-wang/first_page/edit/main/src/components/ZhihuHot.vue

**找到**: 第 325 行 `fetchFromGitHub` 函数

**替换**: 使用以下代码

```javascript
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

  // ✅ 正确解码 Base64 + UTF-8
  const binaryString = atob(data.content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const decoder = new TextDecoder('utf-8')
  const content = decoder.decode(bytes)

  return JSON.parse(content)
}
```

**提交**: `fix: 修复 Base64 + UTF-8 解码`

---

### 3️⃣ 测试

访问: https://geeker-wang.github.io/first_page/

应该看到正常中文！

---

## 📋 完整修复文档

详细说明: `CHINESE_GARBLED_FIX.md`

## 🔍 验证

**数据文件**: https://github.com/geeker-wang/first_page/blob/main/data/zhihu-hot.json
- 应该只有 2 个快照
- 所有标题都是中文

**前端页面**: https://geeker-wang.github.io/first_page/
- 应该显示正常中文
- 没有乱码字符

---

**2步完成，问题解决！** ✅
