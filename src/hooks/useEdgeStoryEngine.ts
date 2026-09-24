// src/hooks/useEdgeStoryEngine.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PlayerState, StoryNode } from '../types/story';
import { EdgeClient } from '../services/EdgeClient';
import { PerformanceTracker, measureAsync } from '../utils/performanceMetrics';
import { generateId } from '../utils/idGenerator';
import { appConfig } from '../config/appConfig';
import { QwenAIClient } from '../services/QwenAIClient';

export interface EdgeStoryEngine {
  state: PlayerState | null;
  currentNode: StoryNode | null;
  allNodes: StoryNode[];
  isLoading: boolean;
  isGenerating: boolean;  // 专门用于追踪故事生成状态
  error: string | null;
  generateStory: (choiceId: string) => Promise<any>;
  updateState: (updates: Partial<PlayerState>) => Promise<void>;
  initializeStory: (storyId: string, customNodes?: StoryNode[]) => Promise<void>;
}

export const useEdgeStoryEngine = (): EdgeStoryEngine => {
  const [state, setState] = useState<PlayerState | null>(null);
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null);
  const [allNodes, setAllNodes] = useState<StoryNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);  // 专门追踪故事生成状态
  const [error, setError] = useState<string | null>(null);
  
  const edgeClient = useMemo(() => {
    const client = EdgeClient.getInstance();
    // 从配置文件获取API密钥
    client.initializeQwenClient(appConfig.qwen.apiKey, appConfig.qwen.model);
    return client;
  }, []);

  const initializeStory = useCallback(async (storyId: string, customNodes?: StoryNode[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tracker = new PerformanceTracker();
      tracker.startStep('initialize-story');
      
      // Check if custom nodes are provided (for user-created stories)
      if (customNodes && customNodes.length > 0) {
        // This is a user-created story with predefined nodes
        const initialState: PlayerState = {
          id: generateId(),
          currentStoryId: storyId,
          currentNodeId: customNodes[0].id, // Start with the first node
          storyHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Set the first node as the current node
        setCurrentNode(customNodes[0]);
        setAllNodes(customNodes);
        setState(initialState);
      } else {
        // Get custom story context from session storage if available
        const customStoryContext = sessionStorage.getItem('customStoryContext');
        
        // In a real implementation, this would fetch initial story state from edge
        const initialState: PlayerState = {
          id: generateId(),
          currentStoryId: storyId,
          currentNodeId: 'start-node',
          storyHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        let startNode: StoryNode;
        
        // Clear any existing custom context in sessionStorage to avoid confusion
        if (customStoryContext) {
          // This is definitely a custom story request
          sessionStorage.removeItem('customStoryContext');
          
          // Use AI to generate a custom starting node based on user context
          // Create a request to the AI to generate a custom start based on user context
          const aiClient = new QwenAIClient({
            apiKey: appConfig.qwen.apiKey,
            model: appConfig.qwen.model
          });
          
          // Create a custom prompt for the AI
          const customPrompt = `根据以下用户设定创建一个引人入胜的故事开始：

          ${customStoryContext}

          请生成一个吸引人的故事开始场景，包含2-3个有意义的选项来推动情节发展。严格按照以下格式返回，不要包含任何格式标签: 故事内容::选项1::选项2::选项3`;
          
          // Try to generate custom story content, fallback to default if it fails
          try {
            const response = await aiClient.generateStory({
              model: appConfig.qwen.model,
              messages: [
                {
                  role: 'system',
                  content: `你是一位专业的互动分支叙事故事讲述者。你根据用户的设定创作引人入胜、连贯的故事片段来开启叙事。`
                },
                {
                  role: 'user',
                  content: customPrompt
                }
              ],
              temperature: 0.7,
              max_tokens: 1000
            });
            
            if (response.success && response.data.choices?.[0]?.message?.content) {
              // Parse the AI response
              const content = response.data.choices[0].message.content;
              const parts = content.split('::');
              
              // 检查是否是按照"故事内容::选项1::选项2::选项3"格式返回的
              let narrative, choices;
              if (parts.length >= 4 && parts[0].trim() === '故事内容') {
                // 如果第一部分是"故事内容"，则实际内容是第二部分
                narrative = parts[1] || `基于您的设定开始故事：${customStoryContext.substring(0, 100)}...`;
                choices = parts.slice(2).filter((choice: string) => choice.trim() !== '').map((choice: string, idx: number) => ({
                  id: `choice_${Date.now()}_${idx}`,
                  text: choice.trim(),
                  nextNodeId: `node_${Date.now()}_${idx}`
                }));
              } else {
                // 正常格式："实际内容::选项1::选项2::选项3"
                narrative = parts[0] || `基于您的设定开始故事：${customStoryContext.substring(0, 100)}...`;
                choices = parts.slice(1).filter((choice: string) => choice.trim() !== '').map((choice: string, idx: number) => ({
                  id: `choice_${Date.now()}_${idx}`,
                  text: choice.trim(),
                  nextNodeId: `node_${Date.now()}_${idx}`
                }));
              }
              
              // If no choices were generated, provide default choices
              if (choices.length === 0) {
                choices = [
                  { id: `choice_${Date.now()}_0`, text: '探索这个新世界', nextNodeId: `node_${Date.now()}_0` },
                  { id: `choice_${Date.now()}_1`, text: '寻找线索', nextNodeId: `node_${Date.now()}_1` }
                ];
              }
              
              startNode = {
                id: 'start-node',
                title: '自定义开始',
                content: narrative,
                choices: choices,
                createdAt: new Date(),
                updatedAt: new Date()
              };
            } else {
              // Fallback to default story if AI generation fails
              startNode = {
                id: 'start-node',
                title: '神秘的开始',
                content: '你穿越到了一个未知的世界。阳光透过云层洒在古老的石板路上，远处有山峦起伏，近处有小径蜿蜒。空气中弥漫着神秘的气息，仿佛在召唤着你去探索。',
                choices: [
                  { id: 'choice-1', text: '走向远处的山脉', nextNodeId: 'path-1' },
                  { id: 'choice-2', text: '沿着小径前行', nextNodeId: 'path-2' }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
              };
            }
          } catch (aiError) {
            console.error('Failed to generate custom story:', aiError);
            // Fallback to default story if AI generation fails
            startNode = {
              id: 'start-node',
              title: '神秘的开始',
              content: '你穿越到了一个未知的世界。阳光透过云层洒在古老的石板路上，远处有山峦起伏，近处有小径蜿蜒。空气中弥漫着神秘的气息，仿佛在召唤着你去探索。',
              choices: [
                { id: 'choice-1', text: '走向远处的山脉', nextNodeId: 'path-1' },
                { id: 'choice-2', text: '沿着小径前行', nextNodeId: 'path-2' }
              ],
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
        } else {
          // This is a default story request - completely separate logic
          startNode = {
            id: 'start-node',
            title: '神秘的开始',
            content: '你穿越到了一个未知的世界。阳光透过云层洒在古老的石板路上，远处有山峦起伏，近处有小径蜿蜒。空气中弥漫着神秘的气息，仿佛在召唤着你去探索。',
            choices: [
              { id: 'choice-1', text: '走向远处的山脉', nextNodeId: 'path-1' },
              { id: 'choice-2', text: '沿着小径前行', nextNodeId: 'path-2' }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        tracker.endStep('initialize-story');
        const metrics = tracker.complete();
        console.log('Story initialization metrics:', metrics);
        
        // 设置状态和节点
        setState(initialState);
        setCurrentNode(startNode);
        setAllNodes([startNode]);
      }
    } catch (err) {
      console.error('Failed to initialize story:', err);
      setError('Failed to initialize story');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateStory = useCallback(async (choiceId: string) => {
    if (!state) {
      throw new Error('No player state available');
    }
    
    setIsLoading(true);
    setIsGenerating(true);  // 设置生成状态
    setError(null);
    
    try {
      // Get the selected choice
      const selectedChoice = currentNode?.choices.find(c => c.id === choiceId);
      if (!selectedChoice) {
        throw new Error(`Choice with id ${choiceId} not found`);
      }

      // Check if the choice has a predefined target node
      if (selectedChoice.nextNodeId) {
        // If choice has a target node, look for it in allNodes
        const targetNode = allNodes.find(node => node.id === selectedChoice.nextNodeId);
        
        if (targetNode) {
          // Found the target node, switch to it directly without AI generation
          setCurrentNode(targetNode);
          
          // Update player state
          const updatedState: PlayerState = {
            ...state,
            currentNodeId: targetNode.id,
            storyHistory: [
              ...state.storyHistory,
              {
                nodeId: currentNode?.id || state.currentNodeId,
                choiceId,
                nodeContent: currentNode?.content || '',
                choiceText: selectedChoice?.text || '',
                timestamp: new Date(),
                storyState: {
                  ...state
                }
              }
            ],
            updatedAt: new Date()
          };
          
          setState(updatedState);
          
          setIsLoading(false);
          setIsGenerating(false);
          return { data: targetNode, success: true };
        }
      }

      // If no predefined target node or target node not found, use AI generation
      const tracker = new PerformanceTracker();
      tracker.startStep('generate-story-request');

      // Edge request to generate next story node
      const response = await measureAsync(
        () => edgeClient.request('/story/generate', {
          playerId: state.id,
          choice: selectedChoice,
          currentState: {
            currentNarrative: currentNode?.content || '你站在一个神秘地方的入口。空气中弥漫着期待，你能感受到从这一刻开始，你的选择将塑造你的命运。',
            choices: currentNode?.choices || []
          }
        }),
        'edge-request'
      );
      
      tracker.endStep('generate-story-request');
      tracker.startStep('process-response');
      
      // Extract the next node from response
      const nextNode: StoryNode = response.result.data;
      setCurrentNode(nextNode);
      
      // Add the new node to allNodes if it's not already there
      setAllNodes(prevNodes => {
        const nodeExists = prevNodes.some(node => node.id === nextNode.id);
        if (!nodeExists) {
          return [...prevNodes, nextNode];
        }
        return prevNodes;
      });
      
      // Update player state with new node
      const updatedState: PlayerState = {
        ...state,
        currentNodeId: nextNode.id,
        storyHistory: [
          ...state.storyHistory,
          {
            nodeId: currentNode?.id || state.currentNodeId,
            choiceId,
            nodeContent: currentNode?.content || '', // 使用当前节点的内容，这应该是正确的
            choiceText: selectedChoice?.text || '',  // 使用之前定义的selectedChoice
            timestamp: new Date(),
            storyState: {
              ...state,
              metrics: response.result.edgeMetadata // Store the edge metadata
            }
          }
        ],
        updatedAt: new Date()
      };
      
      setState(updatedState);
      
      tracker.endStep('process-response');
      const metrics = tracker.complete({
        edgeLocation: response.result.edgeMetadata.edgeLocation,
        cacheStatus: response.result.edgeMetadata.cacheStatus
      });
      
      console.log('Story generation metrics:', metrics);
      
      return response.result;
    } catch (err) {
      console.error('Failed to generate story:', err);
      setError('Failed to generate story');
      throw err;
    } finally {
      setIsLoading(false);
      setIsGenerating(false);  // 重置生成状态
    }
  }, [state, currentNode, allNodes, edgeClient]);

  const updateState = useCallback(async (updates: Partial<PlayerState>) => {
    if (!state) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tracker = new PerformanceTracker();
      tracker.startStep('update-state-request');
      
      const updatedState: PlayerState = {
        ...state,
        ...updates,
        updatedAt: new Date()
      };
      
      // In a real implementation, this would sync to edge storage
      const response = await measureAsync(
        () => edgeClient.request('/state/update', updatedState),
        'edge-request'
      );
      
      tracker.endStep('update-state-request');
      const metrics = tracker.complete({
        edgeLocation: response.result.edgeMetadata.edgeLocation,
        cacheStatus: response.result.edgeMetadata.cacheStatus
      });
      
      console.log('State update metrics:', metrics);
      
      setState(updatedState);
    } catch (err) {
      console.error('Failed to update state:', err);
      setError('Failed to update state');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [state, edgeClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Any cleanup code if needed
    };
  }, []);

  return {
    state,
    currentNode,
    allNodes,
    isLoading,
    isGenerating,
    error,
    generateStory,
    updateState,
    initializeStory
  };
};