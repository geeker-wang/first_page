/**
 * 知乎热榜爬取服务
 * 使用 CORS 代理绕过跨域限制
 */

import type { ZhihuHotItem } from '@/types/zhihu';

/**
 * 知乎热榜 API 响应类型
 */
interface ZhihuHotResponse {
  data: Array<{
    id: string;
    title: string;
    excerpt: string;
    answer_count: number;
    follower_count: number;
    visit_count: number;
    hot: number;
    url: string;
    target: {
      id: string;
      type: string;
    };
  }>;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * CORS 代理配置
 */
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

/**
 * 知乎热榜 API 地址
 */
const ZHIHU_HOT_API = 'https://www.zhihu.com/api/v3/topstory/hot-lists/total?limit=50';

/**
 * 知乎热榜爬取器
 */
export class ZhihuCrawler {
  /**
   * 获取当前时间戳
   */
  private getTimestamp(): number {
    return Date.now();
  }

  /**
   * 格式化时间
   */
  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  /**
   * 从原始数据转换为应用数据
   */
  private convertToHotItem(raw: any): ZhihuHotItem {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.excerpt || '',
      heat: raw.hot || raw.visit_count || 0,
      url: `https://www.zhihu.com${raw.target?.url || raw.url || ''}`,
      target: raw.target?.id,
      timestamp: this.getTimestamp(),
      fetchTime: this.formatTime(this.getTimestamp())
    };
  }

  /**
   * 抓取知乎热榜数据
   * @returns 热榜条目列表
   */
  async fetchHotList(): Promise<ZhihuHotItem[]> {
    try {
      // 使用 CORS 代理
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(ZHIHU_HOT_API)}`;

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': 'https://www.zhihu.com/'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ZhihuHotResponse = await response.json();

      if (data.error) {
        throw new Error(`API Error: ${data.error.message}`);
      }

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format');
      }

      // 转换并返回数据
      const hotItems = data.data
        .slice(0, 30) // 限制前30条
        .map(item => this.convertToHotItem(item));

      console.log(`✅ 成功抓取 ${hotItems.length} 条热榜数据`);
      return hotItems;

    } catch (error) {
      console.error('❌ 抓取失败:', error);

      // 返回模拟数据（用于测试）
      return this.getMockData();
    }
  }

  /**
   * 获取模拟数据（用于测试或 API 不可用时）
   */
  private getMockData(): ZhihuHotItem[] {
    const mockItems: ZhihuHotItem[] = [
      {
        id: 'mock-1',
        title: '2024年最值得关注的科技趋势是什么？',
        description: '人工智能、量子计算、生物技术等领域的发展前景',
        heat: 1250000,
        url: 'https://www.zhihu.com/question/123456',
        timestamp: this.getTimestamp(),
        fetchTime: this.formatTime(this.getTimestamp())
      },
      {
        id: 'mock-2',
        title: '如何评价某知名公司的新产品发布？',
        description: '产品性能、定价策略、市场反响等多角度分析',
        heat: 980000,
        url: 'https://www.zhihu.com/question/234567',
        timestamp: this.getTimestamp(),
        fetchTime: this.formatTime(this.getTimestamp())
      },
      {
        id: 'mock-3',
        title: '年轻人应该如何规划自己的职业发展？',
        description: '从入门到精通，不同阶段的职业建议和经验分享',
        heat: 850000,
        url: 'https://www.zhihu.com/question/345678',
        timestamp: this.getTimestamp(),
        fetchTime: this.formatTime(this.getTimestamp())
      },
      {
        id: 'mock-4',
        title: '为什么最近股市波动如此剧烈？',
        description: '宏观经济、政策影响、国际形势等多方面因素分析',
        heat: 720000,
        url: 'https://www.zhihu.com/question/456789',
        timestamp: this.getTimestamp(),
        fetchTime: this.formatTime(this.getTimestamp())
      },
      {
        id: 'mock-5',
        title: '如何评价某热门电影/电视剧？',
        description: '剧情、演技、制作等全方位深度解析',
        heat: 680000,
        url: 'https://www.zhihu.com/question/567890',
        timestamp: this.getTimestamp(),
        fetchTime: this.formatTime(this.getTimestamp())
      }
    ];

    console.log('⚠️ 使用模拟数据（API 可能不可用）');
    return mockItems;
  }

  /**
   * 验证数据格式
   */
  validateData(items: ZhihuHotItem[]): boolean {
    if (!Array.isArray(items)) return false;
    return items.every(item =>
      item.id &&
      item.title &&
      typeof item.heat === 'number' &&
      item.timestamp > 0
    );
  }
}

// 单例实例
export const zhihuCrawler = new ZhihuCrawler();
