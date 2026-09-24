// src/config/configManager.ts

import { appConfig } from './appConfig';

class ConfigManager {
  private static instance: ConfigManager;
  private config = appConfig;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // 获取Qwen配置
  getQwenConfig() {
    return this.config.qwen;
  }

  // 获取边缘计算配置
  getEdgeConfig() {
    return this.config.edge;
  }

  // 获取故事配置
  getStoryConfig() {
    return this.config.story;
  }

  // 更新API密钥（在运行时，例如用户输入）
  updateApiKey(apiKey: string) {
    this.config = {
      ...this.config,
      qwen: {
        ...this.config.qwen,
        apiKey
      }
    };
  }

  // 检查是否配置了API密钥
  isApiKeyConfigured(): boolean {
    return !!this.config.qwen.apiKey && this.config.qwen.apiKey !== '';
  }

  // 获取当前模型
  getCurrentModel(): string {
    return this.config.qwen.model;
  }

  // 更新模型
  updateModel(model: string) {
    this.config = {
      ...this.config,
      qwen: {
        ...this.config.qwen,
        model
      }
    };
  }
}

export const configManager = ConfigManager.getInstance();