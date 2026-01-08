// 知乎热榜数据类型定义

/**
 * 单个热榜条目
 */
export interface ZhihuHotItem {
  /** 热榜ID */
  id: string;
  /** 标题 */
  title: string;
  /** 描述/摘要 */
  description: string;
  /** 热度值 */
  heat: number;
  /** 原始链接 */
  url: string;
  /** 话题ID */
  target?: string;
  /** 抓取时间戳 */
  timestamp: number;
  /** 抓取时间（格式化） */
  fetchTime: string;
}

/**
 * 热榜数据快照
 */
export interface HotSnapshot {
  /** 快照ID */
  id: string;
  /** 抓取时间戳 */
  timestamp: number;
  /** 抓取时间（格式化） */
  formattedTime: string;
  /** 热榜条目列表 */
  items: ZhihuHotItem[];
  /** 条目数量 */
  count: number;
}

/**
 * 应用状态
 */
export interface AppState {
  /** 当前显示的热榜数据 */
  currentHot: ZhihuHotItem[];
  /** 历史快照列表 */
  snapshots: HotSnapshot[];
  /** 抓取状态 */
  isFetching: boolean;
  /** 最后抓取时间 */
  lastFetchTime?: number;
  /** 错误信息 */
  error?: string;
}
