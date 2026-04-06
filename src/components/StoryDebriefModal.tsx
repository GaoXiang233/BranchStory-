import React from 'react';
import { PlayerState, StoryHistoryEntry } from '../types/story';

interface StoryDebriefModalProps {
  playerState: PlayerState | null;
  allNodes: any[]; // allNodes from the story engine
  isOpen: boolean;
  onClose: () => void;
}

export const StoryDebriefModal: React.FC<StoryDebriefModalProps> = ({
  playerState,
  allNodes = [],
  isOpen,
  onClose
}) => {
  if (!isOpen || !playerState) return null;

  const { storyHistory } = playerState;

  // Helper function to get all available choices for a given nodeId
  const getAvailableChoices = (nodeId: string) => {
    if (!allNodes || allNodes.length === 0) return [];
    const node = allNodes.find(n => n.id === nodeId);
    return node?.choices || [];
  };

  // 状态管理自定义标题和导出格式
  const [debriefTitle, setDebriefTitle] = React.useState(`故事复盘`);
  const [exportFormat, setExportFormat] = React.useState<'md' | 'txt'>('md');

  // 导出复盘内容，支持多种格式
  const handleExport = () => {
    if (!playerState) return;
    
    const { storyHistory } = playerState;
    
    let content = '';
    let fileType = '';
    let fileExtension = '';
    
    if (exportFormat === 'md') {
      // Markdown格式
      content = `# ${debriefTitle}\n\n`;  // 使用自定义标题
      content += `您共经历了 ${storyHistory.length} 个故事节点\n\n`;
      
      if (storyHistory.length > 0) {
        content += `## 故事路径详情：\n\n`;
        storyHistory.forEach((entry: StoryHistoryEntry, index: number) => {
          const availableChoices = getAvailableChoices(entry.nodeId);
          content += `### 第 ${index + 1} 个节点\n`;
          content += `**时间**：${entry.timestamp.toLocaleString()}\n\n`;
          content += `**场景内容**：\n\n${entry.nodeContent}\n\n`;
          
          if (availableChoices.length > 0) {
            content += `**面临选项**：\n`;
            availableChoices.forEach((choice: any, idx: number) => {
              const isSelected = choice.text === entry.choiceText;
              content += `- ${choice.text}${isSelected ? ' *(您的选择)*' : ''}\n`;
            });
            content += `\n`;
          } else {
            content += `**面临选项**：此节点为AI生成内容，选项信息可能不可用\n\n`;
          }
          
          content += `**您的选择**：${entry.choiceText}\n\n`;
          
          // 添加分隔线（除最后一个节点外）
          if (index < storyHistory.length - 1) {
            content += `---\n\n`;
          }
        });
      }
      fileType = 'text/markdown';
      fileExtension = 'md';
    } else {
      // 纯文本格式
      content = `${debriefTitle}\n\n`;  // 使用自定义标题
      content += `您共经历了 ${storyHistory.length} 个故事节点\n\n`;
      
      if (storyHistory.length > 0) {
        content += `故事路径详情：\n\n`;
        storyHistory.forEach((entry: StoryHistoryEntry, index: number) => {
          const availableChoices = getAvailableChoices(entry.nodeId);
          content += `第 ${index + 1} 个节点\n`;
          content += `时间：${entry.timestamp.toLocaleString()}\n`;
          content += `场景内容：\n${entry.nodeContent}\n\n`;
          
          if (availableChoices.length > 0) {
            content += `面临选项：\n`;
            availableChoices.forEach((choice: any, idx: number) => {
              const isSelected = choice.text === entry.choiceText;
              content += `- ${choice.text}${isSelected ? ' (您的选择)' : ''}\n`;
            });
            content += `\n`;
          } else {
            content += `面临选项：此节点为AI生成内容，选项信息可能不可用\n\n`;
          }
          
          content += `您的选择：${entry.choiceText}\n\n`;
          
          // 添加分隔线（除最后一个节点外）
          if (index < storyHistory.length - 1) {
            content += `----------\n\n`;
          }
        });
      }
      fileType = 'text/plain';
      fileExtension = 'txt';
    }
    
    // 创建并下载文件
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // 使用自定义标题作为文件名的一部分
    // 保留中文字符，只替换特殊符号
    const cleanTitle = debriefTitle.replace(/[<>:"/\\|?*]/g, '_').replace(/[\s]+/g, '_');
    // 使用年月日格式的时间戳
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    a.download = `${cleanTitle}_${date}.${fileExtension}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="story-debrief-modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h3>故事复盘</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="debrief-summary">
            <p>您共经历了 <strong>{storyHistory.length}</strong> 个故事节点</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="debrief-title">复盘标题:</label>
            <input
              id="debrief-title"
              type="text"
              value={debriefTitle}
              onChange={(e) => setDebriefTitle(e.target.value)}
              placeholder="为您的复盘添加标题"
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
          
          <div className="debrief-details">
            <h4>故事路径详情：</h4>
            {storyHistory.length === 0 ? (
              <p>暂无故事历史</p>
            ) : (
              <ol className="debrief-timeline">
                {storyHistory.map((entry: StoryHistoryEntry, index: number) => {
                  // Get the choices available at this node
                  const availableChoices = getAvailableChoices(entry.nodeId);
                  
                  return (
                    <li key={`${entry.nodeId}-${index}`} className="debrief-entry">
                      <div className="entry-header">
                        <h5>第 {index + 1} 个节点</h5>
                        <span className="timestamp">{entry.timestamp.toLocaleString()}</span>
                      </div>
                      <div className="entry-content">
                        <p><strong>场景内容：</strong></p>
                        <p className="scene-content">{entry.nodeContent}</p>
                        
                        <p><strong>面临选项：</strong></p>
                        <div className="available-options">
                          {availableChoices.length > 0 ? (
                            <ul>
                              {availableChoices.map((choice: any, idx: number) => (
                                <li key={idx} className={`option-item ${choice.text === entry.choiceText ? 'selected-option' : ''}`}>
                                  <span className={`choice-text ${choice.text === entry.choiceText ? 'selected' : ''}`}>
                                    {choice.text}
                                  </span>
                                  {choice.text === entry.choiceText && (
                                    <span className="selection-marker">(您的选择)</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>此节点为AI生成内容，选项信息可能不可用</p>
                          )}
                        </div>
                        
                        <p><strong>您的选择：</strong></p>
                        <div className="chosen-option">
                          <span className="choice-tag">{entry.choiceText}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-export"
            onClick={handleExport}
          >
            导出复盘
          </button>
          <button 
            className="btn-secondary" 
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};