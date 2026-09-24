// src/config/appConfig.ts

// 应用配置文件
interface AppConfig {
  qwen: {
    apiKey: string;
    endpoint: string;
    model: string; // qwen-turbo, qwen-plus, qwen-max
  };
  edge: {
    cacheEnabled: boolean;
    defaultTimeout: number;
  };
  story: {
    defaultTypingSpeed: number;
    maxRetries: number;
  };
}

// 从环境变量或其他来源获取配置
const getConfig = (): AppConfig => {
  // 从环境变量获取，如果未定义则使用默认值
  const apiKey = import.meta.env.VITE_QWEN_API_KEY || 'sk-6712bc7b440042a2badf26552bd10576';// 填入你的API密钥
  
  if (!apiKey) {
    console.warn('警告: 未配置Qwen API密钥。使用模拟模式。');
  }

  return {
    qwen: {
      apiKey,
      endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: import.meta.env.VITE_QWEN_MODEL || 'qwen-plus', // 可以通过环境变量覆盖
    },
    edge: {
      cacheEnabled: true,
      defaultTimeout: 10000,
    },
    story: {
      defaultTypingSpeed: 20,
      maxRetries: 2,
    }
  };
};

export const appConfig = getConfig();
export type { AppConfig };