// src/components/ApiKeyConfig.tsx
import React, { useState } from 'react';
import { configManager } from '../config/configManager';

interface ApiKeyConfigProps {
  onApiKeySet?: () => void;
}

export const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(configManager.getCurrentModel());
  const [isVisible, setIsVisible] = useState(false);
  const [isConfigured, setIsConfigured] = useState(configManager.isApiKeyConfigured());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      configManager.updateApiKey(apiKey.trim());
      configManager.updateModel(model);
      setIsConfigured(true);
      onApiKeySet?.();
    }
  };

  const handleClear = () => {
    configManager.updateApiKey('');
    setApiKey('');
    setIsConfigured(false);
  };

  if (isConfigured) {
    return (
      <div className="api-config api-configured">
        <div className="config-status">
          <h3>✅ API密钥已配置</h3>
          <p>当前模型: <strong>{configManager.getCurrentModel()}</strong></p>
          <button onClick={handleClear} className="btn-secondary">清除配置</button>
        </div>
      </div>
    );
  }

  return (
    <div className="api-config">
      <form onSubmit={handleSubmit} className="api-config-form">
        <h3>配置通义千问API</h3>
        
        <div className="form-group">
          <label htmlFor="api-key">API密钥:</label>
          <div className="input-with-toggle">
            <input
              type={isVisible ? "text" : "password"}
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入您的DashScope API密钥"
              required
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <p className="help-text">
            您可以在{' '}
            <a 
              href="https://dashscope.console.aliyun.com/apiKey" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              阿里云控制台
            </a>{' '}
            获取API密钥
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="model">模型选择:</label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="qwen-turbo">Qwen-Turbo (快速, 经济)</option>
            <option value="qwen-plus">Qwen-Plus (平衡)</option>
            <option value="qwen-max">Qwen-Max (强大, 复杂任务)</option>
          </select>
        </div>

        <button type="submit" className="btn-primary">
          配置API
        </button>
      </form>
    </div>
  );
};