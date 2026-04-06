import React, { useState, useEffect } from 'react';
import { StoryViewer } from './StoryViewer';

// 一个延迟渲染组件，确保自定义故事上下文在渲染StoryViewer之前就已经处理完毕
export const DelayedStoryViewer: React.FC = () => {
  const [shouldRender, setShouldRender] = useState(false);
  const [customContextProcessed, setCustomContextProcessed] = useState(false);

  useEffect(() => {
    const customStoryContext = sessionStorage.getItem('customStoryContext');
    
    if (customStoryContext) {
      // 如果有自定义故事上下文，先不做任何事，让StoryViewer自己处理
      // 但我们会短暂延迟渲染以确保sessionStorage被完全处理
      setTimeout(() => {
        setCustomContextProcessed(true);
        setShouldRender(true);
      }, 100); // 100ms延迟，确保sessionStorage操作完成
    } else {
      // 没有自定义上下文，立即渲染
      setShouldRender(true);
    }
  }, []);

  if (!shouldRender) {
    return (
      <div className="loading">
        {sessionStorage.getItem('customStoryContext') ? 
          '正在准备您的自定义故事...' : 
          '正在加载故事...'}
      </div>
    );
  }

  return <StoryViewer />;
};