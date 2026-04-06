// src/components/StoryViewer.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStoryEngine } from '../hooks/useStoryEngine';
import { NarrativeDisplay } from './NarrativeDisplay';
import { ChoiceInteraction } from './ChoiceInteraction';
import { TimelineVisualizer } from './TimelineVisualizer';
import { StatusDashboard } from './StatusDashboard';
import { ApiKeyConfig } from './ApiKeyConfig';
import { StorySynthesizerModal } from './StorySynthesizerModal';
import { StoryDebriefModal } from './StoryDebriefModal';
import { configManager } from '../config/configManager';
import { StoryNode } from '../types/story';
import './StoryViewer.css';

interface StoryViewerProps {}

export const StoryViewer: React.FC<StoryViewerProps> = () => {
  const { id } = useParams<{ id: string }>();
  const {
    state,
    currentNode,
    allNodes,
    isLoading,
    isGenerating,
    error,
    initializeStory,
    generateStory
  } = useStoryEngine();

  // 检查是否有自定义故事上下文，并立即设置状态
  const [isInitializingCustomStory, setIsInitializingCustomStory] = useState(() => {
    // 在组件初始化时立即检查是否有自定义故事上下文
    return sessionStorage.getItem('customStoryContext') !== null;
  });

  useEffect(() => {
    const customStoryContext = sessionStorage.getItem('customStoryContext');
    const customStoryGroups = localStorage.getItem('storyEditorStories');
    
    // 检查是否是用户自定义故事的请求
    if (id && customStoryGroups) {
      const stories = JSON.parse(customStoryGroups);
      const targetStory = stories.find((story: any) => story.id === id);
      
      if (targetStory && targetStory.nodes && targetStory.nodes.length > 0) {
        // 这是一个用户创建的故事，初始化为用户的故事
        initializeStory(id, targetStory.nodes);
        return;
      }
    }
    
    if (customStoryContext) {
      // 如果有自定义故事上下文，开始初始化
      initializeStory('default-story').finally(() => {
        // 无论成功还是失败，都结束初始化状态
        setIsInitializingCustomStory(false);
      });
    } else {
      // 没有自定义上下文，按正常流程处理
      if (id) {
        initializeStory(id);
      } else {
        // Initialize with default story ID
        initializeStory('default-story');
      }
    }
  }, [id, initializeStory]);

  // 根据故事历史生成时间线数据 - 确保时间线顺序正确
  const plotPoints = state?.storyHistory && state.storyHistory.length > 0 
    ? state.storyHistory.map((entry, index) => ({
        id: entry.nodeId,
        title: `第${index + 1}幕`,
        description: entry.nodeContent.substring(0, 50) + '...',
        timestamp: entry.timestamp,
        isCurrent: index === state.storyHistory.length - 1
      })) // 不需要反转，保持正确的顺序
    : [
        {
          id: 'start',
          title: '开始',
          description: currentNode?.content ? currentNode.content.substring(0, 50) + '...' : '故事开始了',
          timestamp: new Date(),
          isCurrent: true
        }
      ];

  // Use real metrics from the engine
  const lastMetrics = state?.storyHistory?.length > 0 ? 
    state.storyHistory[state.storyHistory.length - 1].storyState?.metrics : null;
  
  const metrics = currentNode?.id ? {
    generationTime: lastMetrics?.processingTime || 0,
    location: lastMetrics?.location || '未指定',
    cacheStatus: lastMetrics?.cacheStatus || 'miss',
    modelUsed: lastMetrics?.modelUsed || configManager.getCurrentModel(),
    tokenCount: lastMetrics?.totalTokens || lastMetrics?.data?.usage?.total_tokens || lastMetrics?.tokenCount || 0
  } : {
    generationTime: 0,
    location: '未指定',
    cacheStatus: 'miss',
    modelUsed: configManager.getCurrentModel(),
    tokenCount: 0
  };

  const [showConfig, setShowConfig] = React.useState(!configManager.isApiKeyConfigured());
  const [showSynthesizerModal, setShowSynthesizerModal] = useState(false);
  const [showDebriefModal, setShowDebriefModal] = useState(false);

  const handleApiKeySet = () => {
    setShowConfig(false);
  };

  const handleSynthesizeClick = () => {
    setShowSynthesizerModal(true);
  };

  const handleSynthesisComplete = () => {
    setShowSynthesizerModal(false);
  };

  const handleDebriefClick = () => {
    setShowDebriefModal(true);
  };

  const handleChoice = async (choiceId: string) => {
    try {
      await generateStory(choiceId);
    } catch (err) {
      console.error('Failed to generate story:', err);
    }
  };

  // 检查是否有自定义故事上下文（用于渲染逻辑）
  const hasCustomContext = sessionStorage.getItem('customStoryContext') !== null;

  // 首先检查是否正在初始化自定义故事
  if (isInitializingCustomStory) {
    return <div className="loading">正在生成故事...</div>;
  }

  // 当有自定义上下文并且还在加载时，显示特殊加载提示
  if (isLoading && hasCustomContext && !currentNode) {
    return <div className="loading">正在根据您的设定生成故事...</div>;
  }

  if (isLoading && !currentNode) {
    return <div className="loading">正在加载故事...</div>;
  }
  
  // 当正在生成新故事节点时，显示生成提示（占据整个页面）
  if (isGenerating) {
    return <div className="loading">正在生成故事...</div>;
  }

  if (error) {
    return <div className="error">错误: {error}</div>;
  }

  if (!currentNode) {
    return <div className="no-content">没有可用的故事</div>;
  }

  return (
    <div className="story-viewer">
      <div className="story-header">
        <div className="header-content">
          <Link to="/" className="btn-secondary back-to-home">返回主页</Link>
          <h2 className="story-title">{currentNode.title}</h2>
          <div className="story-actions">
            <button className="debrief-story-btn" onClick={handleDebriefClick}>
              故事复盘
            </button>
            <button className="synthesize-story-btn" onClick={handleSynthesizeClick}>
              合成完整故事
            </button>
          </div>
        </div>
      </div>
      
      {showConfig && (
        <div className="api-config-section">
          <ApiKeyConfig onApiKeySet={handleApiKeySet} />
        </div>
      )}
      
      <div className="story-content">
        {currentNode.content && (
          <NarrativeDisplay 
            text={currentNode.content} 
            typingSpeed={20}
            optimized={true}
          />
        )}
      </div>
      
      <div className="choices">
        <ChoiceInteraction
          choices={currentNode.choices?.length ? currentNode.choices : [
            { id: 'choice-1', text: '继续探索', nextNodeId: 'path-1' },
            { id: 'choice-2', text: '仔细观察', nextNodeId: 'path-2' }
          ]}
          onChoice={handleChoice}
          disabled={isLoading}
        />
      </div>
      
      <div className="timeline-section">
        <TimelineVisualizer plotPoints={plotPoints} />
      </div>
      
      <div className="dashboard-section">
        <StatusDashboard 
          metrics={metrics}
          playerState={state || undefined}
        />
      </div>
      
      <StorySynthesizerModal
        playerState={state}
        allNodes={allNodes}
        isOpen={showSynthesizerModal}
        onClose={() => setShowSynthesizerModal(false)}
        onSynthesisComplete={handleSynthesisComplete}
      />
      
      <StoryDebriefModal
        playerState={state}
        allNodes={allNodes}
        isOpen={showDebriefModal}
        onClose={() => setShowDebriefModal(false)}
      />
    </div>
  );
};