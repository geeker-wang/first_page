# 🔧 中文乱码问题完整修复指南

## ⚠️ 问题

页面显示中文乱码:
```
2024å¹´æå¼å¾å³æ³¨çç§æè¶å¿æ¯ä»ä¹ï¼
```

## ✅ 已修复的代码

**前端解码逻辑** (src/components/ZhihuHot.vue:325-351):

```javascript
const fetchFromGitHub = async (): Promise<HotSnapshot[]> => {
  const url = getGitHubApiUrl()
  const response = await fetch(url)

  if (!response.ok) {
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

## 🎯 需要手动完成的步骤

### 步骤 1: 清理数据文件中的乱码

**访问**: https://github.com/geeker-wang/first_page/edit/main/data/zhihu-hot.json

**当前内容分析**:
- 第 1-108 行: ✅ 正常 (10条数据)
- 第 110-162 行: ✅ 正常 (5条数据)
- 第 163-215 行: ❌ 乱码 (5条数据)

**操作**: 删除第 163-215 行的乱码快照

**删除的内容**:
```json
,  // 删除这个逗号
{
  "id": "snapshot-1767836524316",
  "timestamp": 1767836524316,
  "formattedTime": "2026/1/8 09:42:04",
  "items": [
    {
      "id": "mock-1",
      "title": "2024å¹´æå¼å¾å³æ³¨çç§æè¶å¿æ¯ä»ä¹ï¼",  // 乱码
      "description": "äººå·¥æºè½ãéå­è®¡ç®ãçç©ææ¯ç­é¢åçåå±åæ¯",  // 乱码
      ...
    }
  ],
  "count": 5
}
```

**最终文件应该**:
```json
[
  {
    "id": "snapshot-1767842301378",
    "timestamp": 1767842301378,
    "formattedTime": "2026/1/8 03:18:21",
    "count": 10,
    "items": [...]
  },
  {
    "id": "snapshot-1767836547273",
    "timestamp": 1767836547273,
    "formattedTime": "2026/1/8 09:42:27",
    "items": [...],
    "count": 5
  }
]
```

**提交信息**: `fix: 删除乱码的快照数据`

---

### 步骤 2: 更新前端组件

**访问**: https://github.com/geeker-wang/first_page/edit/main/src/components/ZhihuHot.vue

**找到**: 第 325-351 行的 `fetchFromGitHub` 函数

**替换为**:

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

  // 正确解码 Base64 + UTF-8
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

**提交信息**: `fix: 修复 Base64 + UTF-8 解码问题`

---

### 步骤 3: 测试验证

1. **访问前端**: https://geeker-wang.github.io/first_page/
2. **配置信息**:
   - GitHub 用户名: `geeker-wang`
   - 仓库名: `first_page`
   - 数据文件路径: `data/zhihu-hot.json`
3. **点击**: 保存配置 → 测试连接 → 从 GitHub 加载
4. **检查**: 中文是否正常显示

---

## 📊 问题根源

### 为什么会出现乱码?

**GitHub API 返回**:
```
Base64 编码的 UTF-8 字节
```

**旧代码**:
```javascript
atob(data.content)  // 只支持 ASCII，中文会乱码
```

**新代码**:
```javascript
// 1. atob() 解码为二进制字符串
const binaryString = atob(data.content)

// 2. 转换为字节数组
const bytes = new Uint8Array(binaryString.length)
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i)
}

// 3. UTF-8 解码
const decoder = new TextDecoder('utf-8')
const content = decoder.decode(bytes)
```

---

## ✅ 修复验证

### 数据文件检查

访问: https://github.com/geeker-wang/first_page/blob/main/data/zhihu-hot.json

应该看到:
- ✅ 2 个快照
- ✅ 所有标题都是中文
- ✅ 没有 `å`, `æ`, `¼` 等乱码

### 前端显示检查

访问: https://geeker-wang.github.io/first_page/

应该看到:
- ✅ "如何看待某科技公司发布的新产品？"
- ✅ "2026年最值得期待的电影有哪些？"
- ✅ "如何评价某社会热点事件？"

---

## 🎯 完成检查清单

- [ ] 删除 data/zhihu-hot.json 中的乱码快照
- [ ] 更新 src/components/ZhihuHot.vue 的解码逻辑
- [ ] 提交所有更改
- [ ] 访问前端测试
- [ ] 确认中文正常显示

---

## 📝 提交信息建议

**数据文件**:
```
fix: 删除乱码快照数据

删除了 snapshot-1767836524316 (包含乱码的快照)
保留正常数据: 2个快照, 15条记录
```

**前端组件**:
```
fix: 修复中文乱码 - Base64 + UTF-8 解码

问题: atob() 不支持 UTF-8，导致中文乱码
解决: 使用 TextDecoder 正确解码 UTF-8

修改: fetchFromGitHub() 函数
```

---

**完成以上步骤后，中文乱码问题将完全解决！** ✅
