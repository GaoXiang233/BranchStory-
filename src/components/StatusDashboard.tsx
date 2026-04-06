// src/components/StatusDashboard.tsx
import React from 'react';
import { PlayerState } from '../types/story';

interface Metrics {
  generationTime: number;
  location: string;
  cacheStatus: 'hit' | 'miss';
  modelUsed: string;
  tokenCount: number;
}

interface StatusDashboardProps {
  metrics?: Metrics;
  playerState?: PlayerState;
  className?: string;
}

export const StatusDashboard: React.FC<StatusDashboardProps> = ({
  metrics,
  playerState,
  className = ''
}) => {
  return (
    <div className={`status-dashboard ${className}`}>
      <div className="dashboard-header">
        <h3>性能仪表板</h3>
      </div>
      
      <div className="dashboard-content">
        {metrics && (
          <div className="metrics-section">
            <h4>性能指标</h4>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">生成时间</div>
                <div className="metric-value">{metrics.generationTime.toFixed(2)}毫秒</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">位置</div>
                <div className="metric-value">{metrics.location}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">使用模型</div>
                <div className="metric-value">{metrics.modelUsed}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">生成令牌数</div>
                <div className="metric-value">{metrics.tokenCount}</div>
              </div>
            </div>
          </div>
        )}
        
        {playerState && (
          <div className="player-state-section">
            <h4>玩家状态</h4>
            <div className="state-grid">
              <div className="state-card">
                <div className="state-label">当前节点</div>
                <div className="state-value">{playerState.currentNodeId}</div>
              </div>
              <div className="state-card">
                <div className="state-label">故事历史</div>
                <div className="state-value">{playerState.storyHistory.length} 个事件</div>
              </div>
            </div>
          </div>
        )}
        
        
      </div>
    </div>
  );
};

export default StatusDashboard;