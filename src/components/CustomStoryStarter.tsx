import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomStoryStarter.css';

interface CustomStoryStarterProps {
  onStoryStart: (storyContext: string) => void;
}

export const CustomStoryStarter: React.FC<CustomStoryStarterProps> = ({ onStoryStart }) => {
  const [storyType, setStoryType] = useState('fantasy');
  const [storyContext, setStoryContext] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let fullContext = '';
      if (customTitle) {
        fullContext += `标题: ${customTitle}\n\n`;
      }
      fullContext += `类型: ${storyType}\n\n`;
      if (storyContext) {
        fullContext += `背景: ${storyContext}`;
      }
      
      // 直接调用，不使用延时
      onStoryStart(fullContext);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="custom-story-starter">
      <div className="starter-container">
        <h2>自定义您的故事开始</h2>
        <p>创建一个完全按照您想法展开的独特故事体验</p>
        
        <form onSubmit={handleStartStory} className="starter-form">
          <div className="form-group">
            <label htmlFor="storyType">故事类型:</label>
            <select 
              id="storyType"
              value={storyType}
              onChange={(e) => setStoryType(e.target.value)}
              className="form-control"
            >
              <option value="fantasy">奇幻冒险</option>
              <option value="sci-fi">科幻未来</option>
              <option value="mystery">悬疑推理</option>
              <option value="historical">历史传奇</option>
              <option value="contemporary">现代生活</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="customTitle">故事标题 (可选):</label>
            <input
              type="text"
              id="customTitle"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="form-control"
              placeholder="为您的故事起个名字..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="storyContext">故事背景 (可选):</label>
            <textarea
              id="storyContext"
              value={storyContext}
              onChange={(e) => setStoryContext(e.target.value)}
              className="form-control"
              placeholder="描述您想要的故事背景、情境或设定..."
              rows={4}
            />
          </div>
          
          <div className="button-group">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? '生成中...' : '开始我的故事'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};