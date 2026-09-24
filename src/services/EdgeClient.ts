// src/services/EdgeClient.ts
import { EdgeFunctionResponse, EdgeRequestOptions, EdgeClientConfig } from '../types/edge';
import { QwenAIClient } from './QwenAIClient';
import { StoryNode } from '../types/story';

export class EdgeClient {
  private config: EdgeClientConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private static instance: EdgeClient;
  private qwenClient: QwenAIClient | null = null;

  constructor(config?: Partial<EdgeClientConfig>) {
    this.config = {
      apiEndpoint: config?.apiEndpoint || '/api',
      cacheEnabled: config?.cacheEnabled ?? true,
      defaultTimeout: config?.defaultTimeout || 10000,
      fallbackEnabled: config?.fallbackEnabled ?? true,
    };
  }

  // Initialize Qwen client with API key
  initializeQwenClient(apiKey: string, model?: string): void {
    this.qwenClient = new QwenAIClient({
      apiKey: apiKey,
      model: model || 'qwen-plus'
    });
  }

  // Singleton pattern
  public static getInstance(config?: Partial<EdgeClientConfig>): EdgeClient {
    if (!EdgeClient.instance) {
      EdgeClient.instance = new EdgeClient(config);
    }
    return EdgeClient.instance;
  }

  async request(
    endpoint: string, 
    data?: any, 
    options?: EdgeRequestOptions
  ): Promise<EdgeFunctionResponse> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(endpoint, data);
    
    // Check cache if enabled
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          data: cached,
          edgeMetadata: {
            generatedAt: new Date().toISOString(),
            edgeLocation: 'local-cache',
            modelUsed: 'cache',
            processingTime: performance.now() - startTime,
            cacheStatus: 'hit',
            cacheKey,
            estimatedValidity: 300 // 5 minutes
          },
          success: true
        };
      }
    }

    try {
      let response: any;
      
      // Handle special case for story generation that uses Qwen
      if (endpoint === '/story/generate' && this.qwenClient) {
        const result = await this.generateStoryWithQwen(data);
        
        // If the result contains both storyNode and apiResponse, extract the storyNode but preserve API data
        if (result.storyNode) {
          // Extract token count from API response
          const tokenCount = result.apiResponse?.usage?.total_tokens || 0;
          
          // Update edgeMetadata with token count
          const tokenAwareEdgeMetadata = {
            generatedAt: new Date().toISOString(),
            edgeLocation: 'local-simulation', // This would be actual edge location in production
            modelUsed: endpoint === '/story/generate' && this.qwenClient ? 'qwen-turbo' : 'simulation',
            processingTime: performance.now() - startTime,
            cacheStatus: 'miss',
            cacheKey,
            estimatedValidity: 300,
            totalTokens: tokenCount // Add token count to metadata
          };
          
          // Cache and return with updated metadata
          if (this.config.cacheEnabled) {
            this.setCache(cacheKey, result.storyNode, 300); // 5 minute TTL
          }
          
          return {
            data: result.storyNode,
            edgeMetadata: tokenAwareEdgeMetadata,
            success: true
          };
        }
        
        response = result;
      } else {
        // In a real implementation, this would make an actual call to the edge function
        // For now, we'll simulate the call
        response = await this.simulateEdgeCall(endpoint, data, options);
      }
      
      // Cache the response if caching is enabled
      if (this.config.cacheEnabled) {
        this.setCache(cacheKey, response, 300); // 5 minute TTL
      }
      
      return {
        data: response,
        edgeMetadata: {
          generatedAt: new Date().toISOString(),
          edgeLocation: 'local-simulation',
          modelUsed: endpoint === '/story/generate' && this.qwenClient ? 'qwen-turbo' : 'simulation',
          processingTime: performance.now() - startTime,
          cacheStatus: 'miss',
          cacheKey,
          estimatedValidity: 300
        },
        success: true
      };
    } catch (error) {
      console.error('Edge request failed:', error);
      
      // Return fallback response if enabled
      if (this.config.fallbackEnabled) {
        return this.getFallbackResponse(endpoint, data);
      }
      
      throw error;
    }
  }

  private async generateStoryWithQwen(data: any): Promise<any> {
    if (!this.qwenClient) {
      throw new Error('Qwen client not initialized');
    }

    // Build a prompt for the story generation
    const prompt = this.qwenClient.buildStoryPrompt({
      currentNarrative: data.currentState?.currentNarrative || '你站在一个神秘地方的入口。空气中弥漫着期待，你能感受到从这一刻开始，你的选择将塑造你的命运。',
      availableChoices: data.currentState?.choices || []
    }, {
      id: data.choice.id,
      text: data.choice.text
    });

    // Call the Qwen API
    const response = await this.qwenClient.generateStory(prompt);
    
    if (!response.success) {
      throw new Error(`Qwen API Error: ${response.message}`);
    }

    // Parse the response and format it as a StoryNode
    const content = response.data.choices[0]?.message?.content || '';
    
    // Clean up the content by removing format labels if they exist
    let cleanedContent = content.replace(/STORY_SEGMENT/g, '').replace(/故事内容/g, '').trim();
    cleanedContent = cleanedContent.replace(/\s+$/, ''); // Remove trailing whitespace
    
    // Simple parsing of the response format (the AI would format as: STORY_SEGMENT::CHOICE_1::CHOICE_2::CHOICE_3)
    const parts = cleanedContent.split('::');
    const narrative = parts[0] || content || '故事继续...';
    let choices = parts.slice(1).filter((choice: string) => choice.trim() !== '').map((choice: string, idx: number) => ({
      id: `choice_${Date.now()}_${idx}`,
      text: choice.trim(),
      nextNodeId: `node_${Date.now()}_${idx}`
    }));
    
    // If choices are empty, try to extract them from the content using a more general approach
    if (choices.length === 0) {
      // Try to find potential choices in the content
      const choiceRegex = /(\d+\.\s[^\n]+|选项\d+:\s[^\n]+|CHOICE_\d+:\s[^\n]+|•\s[^\n]+|-\s[^\n]+)/g;
      const potentialChoices = content.match(choiceRegex);
      
      if (potentialChoices && potentialChoices.length > 0) {
        choices = potentialChoices.slice(0, 3).map((choice: string, idx: number) => ({
          id: `choice_${Date.now()}_${idx}`,
          text: choice.replace(/^\d+\.\s|^选项\d+:\s|^CHOICE_\d+:\s|^•\s|^-\s/, '').trim(),
          nextNodeId: `node_${Date.now()}_${idx}`
        }));
      }
    }
    
    // 如果没有选项，生成默认选项
    if (choices.length === 0) {
      choices.push(
        { id: `choice_${Date.now()}_0`, text: '继续探索', nextNodeId: `node_${Date.now()}_0` },
        { id: `choice_${Date.now()}_1`, text: '仔细观察', nextNodeId: `node_${Date.now()}_1` }
      );
    } else if (choices.length === 1) {
      // 如果只有一个选项，添加一个默认选项
      choices.push(
        { id: `choice_${Date.now()}_1`, text: '环顾四周', nextNodeId: `node_${Date.now()}_1` }
      );
    }

    // 返回包含API响应信息的对象，而不仅仅是StoryNode
    return {
      storyNode: {
        id: `node_${Date.now()}`,
        title: '生成的故事节点',
        content: narrative,
        choices: choices,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      apiResponse: response.data // 保存API响应以提取令牌数等信息
    };
  }

  private generateCacheKey(endpoint: string, data?: any): string {
    const str = `${endpoint}_${JSON.stringify(data || {})}`;
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `${endpoint}_${Math.abs(hash).toString(16)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return cached.data;
    }
    // Remove expired cache
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async simulateEdgeCall(
    endpoint: string, 
    data?: any, 
    _options?: EdgeRequestOptions
  ): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Mock responses based on endpoint
    switch (endpoint) {
      case '/story/generate':
        return {
          id: `node_${Date.now()}`,
          title: 'Generated Story Node',
          content: 'This is a story node generated by the edge function. In a real implementation, this would be AI-generated content based on the user\'s previous choices.',
          choices: [
            { id: 'choice_1', text: 'Choice A', nextNodeId: 'node_2' },
            { id: 'choice_2', text: 'Choice B', nextNodeId: 'node_3' }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
      case '/state/get':
        return {
          id: data?.playerId || 'default-player',
          currentStoryId: data?.storyId || 'default-story',
          currentNodeId: data?.nodeId || 'start-node',
          storyHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
      case '/state/update':
        return {
          success: true,
          message: 'State updated successfully',
          newState: data
        };
        
      default:
        return { message: `Response from ${endpoint}`, data };
    }
  }

  private getFallbackResponse(endpoint: string, data?: any): EdgeFunctionResponse {
    console.warn(`Using fallback response for ${endpoint}`);
    
    return {
      data: {
        id: 'fallback-node',
        title: 'Fallback Content',
        content: 'This is fallback content. The edge function is not available.',
        choices: [
          { id: 'fallback-choice', text: 'Try again', nextNodeId: 'fallback-node' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      edgeMetadata: {
        generatedAt: new Date().toISOString(),
        edgeLocation: 'fallback',
        modelUsed: 'fallback',
        processingTime: 0,
        cacheStatus: 'miss',
        cacheKey: this.generateCacheKey(endpoint, data),
        estimatedValidity: 0
      },
      success: true
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}