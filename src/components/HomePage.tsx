// src/components/HomePage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomStoryStarter } from './CustomStoryStarter';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const [showCustomStarter, setShowCustomStarter] = useState(false);
  const navigate = useNavigate();

  const handleStartCustomStory = (storyContext: string) => {
    // 将故事上下文存储在sessionStorage中，以便在StoryViewer中使用
    sessionStorage.setItem('customStoryContext', storyContext);
    navigate('/story/new');
  };

  return (
    <div className="home-page">
      <section className="hero">
        <h2>欢迎来到分支故事</h2>
        <p>体验由边缘计算驱动的互动叙事未来</p>
      </section>
      
      <section className="features">
        <div className="feature-card">
          <h3>边缘加速</h3>
          <p>享受最低延迟，内容从您附近的边缘节点提供</p>
        </div>
        <div className="feature-card">
          <h3>AI生成</h3>
          <p>根据您的选择由AI动态生成故事内容</p>
        </div>
        <div className="feature-card">
          <h3>分支剧情</h3>
          <p>您的选择以有意义的方式塑造故事情节</p>
        </div>
      </section>
      
      <section className="cta">
        {!showCustomStarter ? (
          <div className="start-options">
            <Link to="/story/new" className="btn-primary">开始默认故事</Link>
            <button 
              className="btn-secondary" 
              onClick={() => setShowCustomStarter(true)}
            >
              自定义故事开始
            </button>
          </div>
        ) : (
          <div className="custom-starter-container">
            <CustomStoryStarter onStoryStart={handleStartCustomStory} />
            <button 
              className="btn-tertiary" 
              onClick={() => setShowCustomStarter(false)}
            >
              返回
            </button>
          </div>
        )}
        <Link to="/editor" className="btn-secondary" style={{ marginTop: '15px' }}>创作自己的故事</Link>
      </section>
    </div>
  );
};