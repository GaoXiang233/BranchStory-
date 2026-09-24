// src/components/TimelineVisualizer.tsx
import React, { useState, useEffect } from 'react';
import { formatChineseDateTime, formatChineseTime } from '../utils/dateFormatter';

interface PlotPoint {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  branchFrom?: string; // Which node this branches from
  choices?: string[]; // Choices that lead to this point
  isCurrent?: boolean;
}

interface TimelineVisualizerProps {
  plotPoints: PlotPoint[];
  className?: string;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  plotPoints = [],
  className = ''
}) => {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [animatedPoints, setAnimatedPoints] = useState<boolean[]>([]);

  useEffect(() => {
    // Set up animation for timeline points
    if (plotPoints.length > 0) {
      const initialAnimationState = new Array(plotPoints.length).fill(false);
      setAnimatedPoints(initialAnimationState);
      
      // Animate points gradually
      plotPoints.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedPoints(prev => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        }, index * 300);
      });
    }
  }, [plotPoints]);

  const handlePointClick = (id: string) => {
    setSelectedPoint(selectedPoint === id ? null : id);
  };

  if (plotPoints.length === 0) {
    return null;
  }

  return (
    <div className={`timeline-visualizer ${className}`}>
      <h3 className="timeline-title">故事时间线</h3>
      <div className="timeline-container">
        <div className="timeline-line"></div>
        {plotPoints.map((point, index) => (
          <div 
            key={point.id} 
            className={`timeline-point-container ${animatedPoints[index] ? 'animated' : ''}`}
          >
            <div 
              className={`timeline-point ${selectedPoint === point.id ? 'selected' : ''} ${point.isCurrent ? 'current' : ''}`}
              onClick={() => handlePointClick(point.id)}
            >
              <div className="point-indicator">
                {point.title}
              </div>
              {selectedPoint === point.id && (
                <div className="point-details">
                  <p>{point.description}</p>
                  <div className="point-timestamp">
                    {formatChineseDateTime(point.timestamp)}
                  </div>
                </div>
              )}
            </div>
            <div className="point-label">
              <div className="point-time">{formatChineseTime(point.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineVisualizer;