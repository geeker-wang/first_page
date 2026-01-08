/**
 * GitHub 数据存储服务
 * 使用 GitHub API 读写数据文件
 */

import type { HotSnapshot, GitHubConfig } from '@/types/zhihu';

/**
 * GitHub API 响应类型
 */
interface GitHubFileResponse {
  content: string;
  sha: string;
  message?: string;
}

/**
 * GitHub 存储服务
 */
export class GitHubStorage {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  /**
   * 获取 GitHub API URL
   */
  private getApiUrl(): string {
    return `https://api.github.com/repos/${this.config.username}/${this.config.repo}/contents/${this.config.dataPath}`;
  }

  /**
   * 检查是否配置了 Token
   */
  private checkToken(): void {
    if (!this.config.token) {
      throw new Error('GitHub Token 未配置，无法写入数据');
    }
  }

  /**
   * 从 GitHub 读取数据
   */
  async readData(): Promise<HotSnapshot[]> {
    try {
      const response = await fetch(this.getApiUrl(), {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Zhihu-Hot-Tracker'
        }
      });

      if (response.status === 404) {
        // 文件不存在，返回空数组
        console.log('📦 数据文件不存在，创建新文件');
        return [];
      }

      if (!response.ok) {
        throw new Error(`读取失败: ${response.status} ${response.statusText}`);
      }

      const data: GitHubFileResponse = await response.json();

      // GitHub 返回的是 base64 编码的内容
      const content = atob(data.content);
      const snapshots: HotSnapshot[] = JSON.parse(content);

      console.log(`✅ 成功读取 ${snapshots.length} 条历史记录`);
      return snapshots;

    } catch (error) {
      console.error('❌ 读取 GitHub 数据失败:', error);
      // 读取失败时返回空数组，不影响使用
      return [];
    }
  }

  /**
   * 写入数据到 GitHub
   */
  async writeData(snapshots: HotSnapshot[]): Promise<boolean> {
    this.checkToken();

    try {
      // 先获取当前文件的 SHA（如果存在）
      let sha: string | undefined;
      try {
        const getResponse = await fetch(this.getApiUrl(), {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Zhihu-Hot-Tracker'
          }
        });
        if (getResponse.ok) {
          const data: GitHubFileResponse = await getResponse.json();
          sha = data.sha;
        }
      } catch (e) {
        // 文件不存在，忽略
      }

      // 准备写入的数据
      const content = JSON.stringify(snapshots, null, 2);
      const base64Content = btoa(unescape(encodeURIComponent(content)));

      const body: any = {
        message: `Update hot snapshots - ${new Date().toLocaleString('zh-CN')}`,
        content: base64Content,
        branch: 'main'
      };

      if (sha) {
        body.sha = sha; // 更新现有文件需要提供 SHA
      }

      const response = await fetch(this.getApiUrl(), {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'Authorization': `token ${this.config.token}`,
          'User-Agent': 'Zhihu-Hot-Tracker'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`写入失败: ${response.status} - ${errorText}`);
      }

      console.log('✅ 成功写入数据到 GitHub');
      return true;

    } catch (error) {
      console.error('❌ 写入 GitHub 数据失败:', error);
      return false;
    }
  }

  /**
   * 添加新的快照并保存
   */
  async addSnapshot(newSnapshot: HotSnapshot, maxHistory: number = 50): Promise<boolean> {
    try {
      // 读取现有数据
      const existing = await this.readData();

      // 添加新快照
      const updated = [newSnapshot, ...existing];

      // 限制历史记录数量
      const trimmed = updated.slice(0, maxHistory);

      // 写入数据
      return await this.writeData(trimmed);

    } catch (error) {
      console.error('❌ 添加快照失败:', error);
      return false;
    }
  }

  /**
   * 测试 GitHub 连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`https://api.github.com/user`, {
        headers: {
          'Authorization': `token ${this.config.token}`,
          'User-Agent': 'Zhihu-Hot-Tracker'
        }
      });

      if (response.ok) {
        const user = await response.json();
        console.log(`✅ GitHub 连接成功，用户: ${user.login}`);
        return true;
      }

      console.error('❌ GitHub Token 无效');
      return false;

    } catch (error) {
      console.error('❌ GitHub 连接测试失败:', error);
      return false;
    }
  }
}

// 单例实例（将在主服务中初始化）
export let githubStorage: GitHubStorage | null = null;

/**
 * 初始化 GitHub 存储服务
 */
export function initGitHubStorage(config: GitHubConfig): GitHubStorage {
  githubStorage = new GitHubStorage(config);
  return githubStorage;
}
