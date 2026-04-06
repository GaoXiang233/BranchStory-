// src/components/StoryEditor.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StoryNode } from '../types/story';
import { generateId } from '../utils/idGenerator';
import './StoryEditor.css';

interface StoryGroup {
  id: string;
  name: string;
  nodes: StoryNode[];
  createdAt: string;
}

export const StoryEditor: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [choices, setChoices] = useState<{id: string, text: string, nextNodeId?: string}[]>([
    { id: generateId(), text: '', nextNodeId: '' }
  ]);
  const [stories, setStories] = useState<StoryGroup[]>(() => {
    try {
      // 从localStorage恢复数据
      const savedStories = localStorage.getItem('storyEditorStories');
      if (savedStories) {
        return JSON.parse(savedStories);
      }
      // 如果旧数据存在，迁移过来
      const savedNodes = localStorage.getItem('storyEditorNodes');
      if (savedNodes && savedNodes !== '[]' && savedNodes !== 'undefined' && savedNodes !== 'null') {
        return [{
          id: generateId(),
          name: '未命名故事',
          nodes: JSON.parse(savedNodes),
          createdAt: new Date().toISOString()
        }];
      }
      return [];
    } catch (error) {
      console.error('Error parsing stories from localStorage:', error);
      return [];
    }
  });
  
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [newStoryName, setNewStoryName] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  
  // 当前故事的节点
  const currentStory = stories.find(story => story.id === currentStoryId);
  const nodes = currentStory ? currentStory.nodes : [];

  // 获取当前故事的节点
  const getCurrentNodes = () => {
    return currentStory ? currentStory.nodes : [];
  };

  const addChoice = () => {
    setChoices([...choices, { id: generateId(), text: '', nextNodeId: '' }]);
  };

  const updateChoice = (index: number, field: 'text' | 'nextNodeId', value: string) => {
    const updatedChoices = [...choices];
    updatedChoices[index] = { ...updatedChoices[index], [field]: value };
    setChoices(updatedChoices);
  };

  const removeChoice = (index: number) => {
    const updatedChoices = [...choices];
    updatedChoices.splice(index, 1);
    setChoices(updatedChoices);
  };

  // 添加新故事
  const addNewStory = () => {
    if (!newStoryName.trim()) {
      alert('请输入故事名称');
      return;
    }
    
    const newStory: StoryGroup = {
      id: generateId(),
      name: newStoryName,
      nodes: [],
      createdAt: new Date().toISOString()
    };
    
    const updatedStories = [...stories, newStory];
    setStories(updatedStories);
    localStorage.setItem('storyEditorStories', JSON.stringify(updatedStories));
    setNewStoryName('');
    
    // 切换到新故事
    setCurrentStoryId(newStory.id);
  };

  // 切换到指定故事
  const switchToStory = (storyId: string) => {
    // 只當storyId有效時才設置
    if (storyId && stories.some(story => story.id === storyId)) {
      setCurrentStoryId(storyId);
      // 重置表单
      resetForm();
    } else {
      // 如果選擇"選擇一個故事..."選項(value="")
      setCurrentStoryId(null);
      resetForm();
    }
  };

  // 重置表单
  const resetForm = () => {
    setTitle('');
    setContent('');
    setChoices([{ id: generateId(), text: '', nextNodeId: '' }]);
    setCurrentNodeId(null);
  };

  // 保存节点
  const saveNode = () => {
    if (!title || !content) {
      alert('标题和内容不能为空！');
      return;
    }

    // 检查是否已选择故事
    if (!currentStoryId) {
      alert('请先选择一个故事或创建一个新故事！');
      return;
    }

    const newNode: StoryNode = {
      id: currentNodeId || generateId(),
      title,
      content,
      choices: choices
        .filter(choice => choice.text) // 只需要有文本内容就保留选项
        .map(choice => ({
          id: choice.id,
          text: choice.text,
          nextNodeId: choice.nextNodeId || '', // 如果没有选择目标节点，则设为空字符串
        })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let updatedStories = [...stories];
    const storyIndex = updatedStories.findIndex(story => story.id === currentStoryId);
    
    if (storyIndex !== -1) {
      let updatedNodes;
      if (currentNodeId) {
        // 更新现有节点
        updatedNodes = updatedStories[storyIndex].nodes.map(node => 
          node.id === currentNodeId ? newNode : node
        );
      } else {
        // 添加新节点
        updatedNodes = [...updatedStories[storyIndex].nodes, newNode];
      }
      
      updatedStories[storyIndex] = {
        ...updatedStories[storyIndex],
        nodes: updatedNodes
      };
    } else {
      // 如果找不到当前故事，提示用户
      alert('当前故事不存在，请重新选择一个故事或创建新故事！');
      return;
    }
    
    setStories(updatedStories);
    localStorage.setItem('storyEditorStories', JSON.stringify(updatedStories));

    // 重置表单
    resetForm();
  };

  // 删除节点
  const deleteNode = (nodeId: string) => {
    const updatedStories = stories.map(story => {
      if (story.id === currentStoryId) {
        return {
          ...story,
          nodes: story.nodes.filter(n => n.id !== nodeId)
        };
      }
      return story;
    });
    
    setStories(updatedStories);
    localStorage.setItem('storyEditorStories', JSON.stringify(updatedStories));
  };

  // 加载节点进行编辑
  const loadNodeForEdit = (node: StoryNode) => {
    setTitle(node.title);
    setContent(node.content);
    setChoices(node.choices.map(choice => ({ 
      id: choice.id,
      text: choice.text, 
      nextNodeId: choice.nextNodeId 
    })));
    setCurrentNodeId(node.id);
  };

  // 重命名当前故事
  const renameCurrentStory = () => {
    if (!currentStoryId) {
      alert('请先选择一个故事');
      return;
    }
    
    const newName = prompt('请输入新的故事名称:', currentStory?.name || '');
    if (newName && newName.trim()) {
      const updatedStories = stories.map(story => {
        if (story.id === currentStoryId) {
          return { ...story, name: newName.trim() };
        }
        return story;
      });
      
      setStories(updatedStories);
      localStorage.setItem('storyEditorStories', JSON.stringify(updatedStories));
      alert('故事名称已更新！');
    }
  };

  // 删除当前故事
  const deleteCurrentStory = () => {
    if (!currentStoryId) {
      alert('请先选择一个故事');
      return;
    }
    
    const storyToDelete = stories.find(story => story.id === currentStoryId);
    if (!storyToDelete) return;
    
    const confirmDelete = window.confirm(`确定要删除故事 "${storyToDelete.name}" 吗？此操作不可撤销，且会删除该故事下的所有 ${storyToDelete.nodes.length} 个节点。`);    
    if (confirmDelete) {
      const updatedStories = stories.filter(story => story.id !== currentStoryId);
      setStories(updatedStories);
      localStorage.setItem('storyEditorStories', JSON.stringify(updatedStories));
      
      // 如果删除的是当前选中故事，重置当前故事ID
      if (currentStoryId === currentStory?.id) {
        setCurrentStoryId(null);
      }
      
      alert('故事已删除！');
    }
  };

  // 手動保存当前故事数据
  const manualSave = () => {
    localStorage.setItem('storyEditorStories', JSON.stringify(stories));
    alert('故事数据已保存！');
  };

  return (
    <div className="story-editor">
      <div className="editor-header">
        <Link to="/" className="btn-secondary back-to-home">返回主页</Link>
        <h2>{currentNodeId ? '编辑故事节点' : '创建新故事节点'}</h2>
      </div>
      
      {/* 故事选择和管理 */}
      <div className="story-controls">
        <div className="story-selector">
          <label>当前故事:</label>
          <select 
            value={currentStoryId || ''} 
            onChange={(e) => switchToStory(e.target.value)}
          >
            <option value="">选择一个故事...</option>
            {stories.map(story => (
              <option key={story.id} value={story.id}>
                {story.name || '未命名故事'} ({story.nodes.length} 个节点)
              </option>
            ))}
          </select>
          {currentStoryId && (
            <div className="story-actions">
              <button onClick={renameCurrentStory} className="action-btn">重命名故事</button>
              <button onClick={deleteCurrentStory} className="action-btn delete-btn">删除故事</button>
              <button onClick={manualSave} className="action-btn">手动保存</button>
            </div>
          )}
        </div>
        
        <div className="new-story-form">
          <input
            type="text"
            value={newStoryName}
            onChange={(e) => setNewStoryName(e.target.value)}
            placeholder="新故事名称"
          />
          <button onClick={addNewStory}>创建新故事</button>
        </div>
      </div>
      
      {currentNodeId && (
        <div className="edit-actions">
          <button 
            className="return-home-btn" 
            onClick={() => setCurrentNodeId(null)}
          >
            返回节点列表
          </button>
        </div>
      )}
      
      {currentStoryId && (
        <>
          <div className="editor-form">
            <div className="form-group">
              <label htmlFor="node-id">节点ID:</label>
              <input
                type="text"
                id="node-id"
                value={currentNodeId || '未设置（保存后自动生成）'}
                readOnly
                className="readonly-input"
                title="将此ID用于其他节点的“下一个节点ID”字段以连接它们"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="title">标题:</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入故事节点标题"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">内容:</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入故事内容"
                rows={6}
              />
            </div>
            
            <div className="choices-section">
              <h3>选项:</h3>
              {choices.map((choice, index) => (
                <div key={choice.id} className="choice-inputs">
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) => updateChoice(index, 'text', e.target.value)}
                    placeholder="选项文本"
                  />
                  <select
                    value={choice.nextNodeId}
                    onChange={(e) => updateChoice(index, 'nextNodeId', e.target.value)}
                  >
                    <option value="">选择目标节点...</option>
                    {nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.title} ({node.id})
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => removeChoice(index)}
                    className="remove-choice-btn"
                  >
                    删除
                  </button>
                </div>
              ))}
              <button type="button" onClick={addChoice}>添加选项</button>
            </div>
            
            <button onClick={saveNode}>
              {currentNodeId ? '更新节点' : '保存节点'}
            </button>
          </div>
          
          <div className="preview-section">
            <button 
              className="btn-primary preview-btn" 
              onClick={() => {
                if (currentStoryId) {
                  // 保存当前数据后打开预览
                  localStorage.setItem('storyEditorStories', JSON.stringify(stories));
                  window.open(`/story/${currentStoryId}`, '_blank');
                } else {
                  alert('请先选择一个故事以进行预览！');
                }
              }}
            >
              预览故事
            </button>
          </div>
          
          <div className="story-nodes">
            <h3>故事节点:</h3>
            <ul>
              {nodes.map(node => (
                <li key={node.id} className="node-item">
                  <span>{node.title}</span>
                  <div>
                    <button onClick={() => loadNodeForEdit(node)}>编辑</button>
                    <button onClick={() => deleteNode(node.id)}>删除</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      
      {!currentStoryId && (
        <div className="no-story-message">
          <p>请选择一个故事或创建一个新故事</p>
        </div>
      )}
    </div>
  );
};