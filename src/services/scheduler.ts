/**
 * 定时任务管理器
 * 负责自动抓取和调度
 */

import { zhihuCrawler } from './zhihuCrawler';
import { githubStorage } from './githubStorage';
import type { HotSnapshot, ScheduleConfig } from '@/types/zhihu';

/**
 * 定时任务管理器
 */
export class Scheduler {
  private config: ScheduleConfig;
  private timer: number | null = null;
  private isRunning: boolean = false;

  constructor(config: ScheduleConfig) {
    this.config = config;
  }

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
   * 创建快照
   */
  private createSnapshot(items: any[]): HotSnapshot {
    const timestamp = this.getTimestamp();
    return {
      id: `snapshot-${timestamp}`,
      timestamp,
      formattedTime: this.formatTime(timestamp),
      items: items,
      count: items.length
    };
  }

  /**
   * 执行一次抓取任务
   */
  async executeFetch(): Promise<HotSnapshot | null> {
    try {
      console.log('🔄 开始执行抓取任务...');

      // 1. 抓取数据
      const items = await zhihuCrawler.fetchHotList();

      if (!items || items.length === 0) {
        console.warn('⚠️ 未获取到有效数据');
        return null;
      }

      // 2. 创建快照
      const snapshot = this.createSnapshot(items);

      // 3. 保存到 GitHub（如果配置了）
      if (githubStorage && this.config.enabled) {
        const success = await githubStorage.addSnapshot(snapshot);
        if (success) {
          console.log('✅ 数据已保存到 GitHub');
        } else {
          console.warn('⚠️ 数据保存失败，但已生成快照');
        }
      }

      // 4. 更新配置中的下次抓取时间
      this.config.nextFetch = this.getTimestamp() + this.config.interval * 60 * 1000;

      console.log(`✅ 抓取任务完成，下次抓取时间: ${this.formatTime(this.config.nextFetch)}`);

      return snapshot;

    } catch (error) {
      console.error('❌ 抓取任务失败:', error);
      return null;
    }
  }

  /**
   * 启动定时任务
   */
  start(): void {
    if (this.isRunning) {
      console.warn('⚠️ 定时任务已在运行');
      return;
    }

    if (!this.config.enabled) {
      console.log('⏰ 定时任务未启用');
      return;
    }

    this.isRunning = true;
    console.log(`⏰ 定时任务已启动，间隔: ${this.config.interval} 分钟`);

    // 立即执行一次
    this.executeFetch();

    // 设置定时器
    this.timer = window.setInterval(() => {
      this.executeFetch();
    }, this.config.interval * 60 * 1000);
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('⏰ 定时任务已停止');
  }

  /**
   * 重新配置并重启
   */
  restart(newConfig: ScheduleConfig): void {
    this.stop();
    this.config = newConfig;
    this.start();
  }

  /**
   * 获取下次抓取时间
   */
  getNextFetchTime(): number | null {
    return this.config.nextFetch || null;
  }

  /**
   * 获取运行状态
   */
  getStatus(): {
    isRunning: boolean;
    enabled: boolean;
    interval: number;
    nextFetch?: number;
    nextFetchFormatted?: string;
  } {
    return {
      isRunning: this.isRunning,
      enabled: this.config.enabled,
      interval: this.config.interval,
      nextFetch: this.config.nextFetch,
      nextFetchFormatted: this.config.nextFetch ? this.formatTime(this.config.nextFetch) : undefined
    };
  }
}

// 单例实例（将在主服务中初始化）
export let scheduler: Scheduler | null = null;

/**
 * 初始化调度器
 */
export function initScheduler(config: ScheduleConfig): Scheduler {
  scheduler = new Scheduler(config);
  return scheduler;
}
