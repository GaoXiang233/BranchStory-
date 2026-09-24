// src/components/NarrativeDisplay.tsx
import React, { useState, useEffect, useRef } from 'react';

interface NarrativeDisplayProps {
  text: string;
  typingSpeed?: number; // 毫秒/字符
  onComplete?: () => void;
  edgeOptimized?: boolean;
  className?: string;
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({
  text,
  typingSpeed = 30,
  onComplete,
  edgeOptimized = false,
  className = ''
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理富文本内容
  const parseRichText = (text: string): JSX.Element => {
    // 简单的富文本解析：支持粗体、斜体和特殊标记
    const parts = text.split(/(\*\*.*?\*\*|\/\/.*?\/\/|==.*?==)/g);
    
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            // 粗体
            return <strong key={index}>{part.slice(2, -2)}</strong>;
          } else if (part.startsWith('//') && part.endsWith('//')) {
            // 斜体
            return <em key={index}>{part.slice(2, -2)}</em>;
          } else if (part.startsWith('==') && part.endsWith('==')) {
            // 高亮
            return <mark key={index}>{part.slice(2, -2)}</mark>;
          } else {
            return <span key={index}>{part}</span>;
          }
        })}
      </>
    );
  };

  useEffect(() => {
    if (text && typingSpeed > 0) {
      setIsAnimating(true);
      setIsComplete(false);
      setCurrentIndex(0);
      setDisplayedText('');
    } else {
      setDisplayedText(text);
      setIsComplete(true);
      onComplete?.();
    }
  }, [text, typingSpeed]);

  useEffect(() => {
    if (isAnimating && currentIndex < text.length) {
      timerRef.current = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, typingSpeed);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    } else if (currentIndex >= text.length && isAnimating) {
      setIsAnimating(false);
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, isAnimating, text, typingSpeed, onComplete]);

  // 重置动画
  /* const restartAnimation = () => {
    setIsAnimating(true);
    setIsComplete(false);
    setCurrentIndex(0);
    setDisplayedText('');
  }; */

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const getDisplayText = () => {
    if (typingSpeed <= 0) {
      return parseRichText(text);
    }
    
    return parseRichText(displayedText);
  };

  return (
    <div 
      ref={containerRef}
      className={`narrative-display ${edgeOptimized ? 'edge-optimized' : ''} ${className}`}
      onClick={() => {
        if (!isComplete) {
          // 如果点击，立即完成动画
          setDisplayedText(text);
          setIsAnimating(false);
          setIsComplete(true);
          setCurrentIndex(text.length);
          onComplete?.();
        }
      }}
    >
      <div className="narrative-content">
        {getDisplayText()}
      </div>
      
      {!isComplete && (
        <span className="typing-indicator">|</span>
      )}
      
      
    </div>
  );
};

export default NarrativeDisplay;