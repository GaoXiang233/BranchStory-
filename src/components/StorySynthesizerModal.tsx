import React, { useState } from 'react';
import { PlayerState, StoryNode } from '../../types/story';
import { StorySynthesizer, StorySynthesisResult } from '../services/QwenAIClient';

interface StorySynthesizerModalProps {
  playerState: PlayerState | null;
  allNodes: StoryNode[]; // 所有节点的列表，用于构建完整故事
  isOpen: boolean;
  onClose: () => void;
  onSynthesisComplete: (result: StorySynthesisResult) => void;
}

export const StorySynthesizerModal: React.FC<StorySynthesizerModalProps> = ({
  playerState,
  allNodes = [],
  isOpen,
  onClose,
  onSynthesisComplete
}) => {
  const [title, setTitle] = useState(`我的故事-${new Date().toLocaleDateString()}`);
  const [userNotes, setUserNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [exportFormat, setExportFormat] = useState<'md' | 'txt'>('md');
  const [synthesizer] = useState(new StorySynthesizer());

  const handleGenerate = async () => {
    if (!playerState) return;
    
    setIsGenerating(true);
    setProgress('正在准备故事数据...');
    
    try {
      // 导出用户故事历程
      const storyData = synthesizer.exportUserStory(playerState, allNodes);
      setProgress('正在合成完整故事...');
      
      // 调用AI生成完整小说
      const result = await synthesizer.synthesizeFullStory({
        title: title || `我的故事-${new Date().toLocaleDateString()}`,
        storyHistory: playerState.storyHistory.map((entry, idx) => {
          return {
            nodeId: entry.nodeId,
            choiceId: entry.choiceId,
            content: entry.nodeContent,      // 使用保存的nodeContent
            choiceText: entry.choiceText,    // 使用保存的choiceText
            timestamp: entry.timestamp
          };
        }),
        userNotes
      });
      
      onSynthesisComplete(result);
      
      if (result.success && result.content) {
        // 可以选择下载生成的故事
        triggerStoryDownload(title, result.content);
      }
    } catch (error) {
      console.error('故事合成失败:', error);
      onSynthesisComplete({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        processingTime: 0
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerStoryDownload = (title: string, content: string) => {
    let fileContent = '';
    let mimeType = '';
    let fileExtension = '';
    
    if (exportFormat === 'md') {
      fileContent = `# ${title}\n\n${content}`;
      mimeType = 'text/markdown';
      fileExtension = 'md';
    } else {
      // 纯文本格式
      fileContent = `${title}\n\n${content}`;
      mimeType = 'text/plain';
      fileExtension = 'txt';
    }
    
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = title.replace(/\s+/g, '_');
    a.download = `${cleanTitle}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="story-synthesizer-modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h3>故事合成器</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="story-title">故事标题:</label>
            <input
              id="story-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="为您的故事添加标题"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="user-notes">附加说明 (可选):</label>
            <textarea
              id="user-notes"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="您可以添加一些关于期望写作风格或特定要求的说明..."
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <label>导出格式:</label>
            <div className="format-options">
              <label>
                <input
                  type="radio"
                  value="md"
                  checked={exportFormat === 'md'}
                  onChange={() => setExportFormat('md')}
                /> Markdown (.md)
              </label>
              <label>
                <input
                  type="radio"
                  value="txt"
                  checked={exportFormat === 'txt'}
                  onChange={() => setExportFormat('txt')}
                /> 纯文本 (.txt)
              </label>
            </div>
          </div>
          
          <div className="story-preview">
            <h4>故事历程预览:</h4>
            <p>您将合成包含 {playerState?.storyHistory.length || 0} 个节点的故事</p>
            <div className="story-history-list">
              {playerState?.storyHistory.map((entry, index) => (
                <div key={entry.nodeId} className="story-history-item">
                  <h5>第{index + 1}幕:</h5>
                  <p><strong>场景:</strong> {entry.nodeContent}</p>
                  <p><strong>选择:</strong> {entry.choiceText}</p>
                  <p><strong>时间:</strong> {entry.timestamp.toLocaleString()}</p>
                  <hr />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          {isGenerating && (
            <div className="generating-indicator">
              <p>{progress}</p>
              <div className="loading-spinner" />
            </div>
          )}
          
          <div className="button-group">
            <button 
              className="btn-secondary" 
              onClick={onClose}
              disabled={isGenerating}
            >
              取消
            </button>
            <button 
              className="btn-primary" 
              onClick={handleGenerate}
              disabled={isGenerating || !playerState}
            >
              {isGenerating ? '生成中...' : '生成完整故事'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};