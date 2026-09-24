// src/services/QwenAIClient.ts
import { EdgeFunctionResponse } from '../types/edge';
import { PlayerState, StoryNode } from '../types/story';
import { appConfig } from '../config/appConfig';

export interface QwenAPIConfig {
  apiKey: string;
  endpoint?: string;
  model?: string;
}

export interface QwenAPIRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface QwenAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class QwenAIClient {
  private config: QwenAPIConfig;
  private static instance: QwenAIClient;

  constructor(config: QwenAPIConfig) {
    this.config = {
      ...config,
      endpoint: config.endpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: config.model || 'qwen-plus' // Using qwen-plus for good balance of cost and performance
    };
  }

  // Singleton pattern
  public static getInstance(config?: QwenAPIConfig): QwenAIClient {
    if (!QwenAIClient.instance && config) {
      QwenAIClient.instance = new QwenAIClient(config);
    }
    return QwenAIClient.instance;
  }

  async generateStory(request: QwenAPIRequest): Promise<EdgeFunctionResponse> {
    const startTime = performance.now();
    
    // 检查API密钥
    if (!this.config.apiKey || this.config.apiKey.trim() === '') {
      console.warn('未配置API密钥，使用模拟响应');
      return this.getSimulationResponse(request, startTime);
    }

    try {
      // Make actual API call to Qwen
      const response = await this.callQwenAPI(request);
      
      return {
        data: response,
        edgeMetadata: {
          generatedAt: new Date().toISOString(),
          edgeLocation: 'Qwen API', // This would be the actual edge location in real deployment
          modelUsed: request.model,
          processingTime: performance.now() - startTime,
          cacheStatus: 'miss', // Would be determined by actual edge cache
          cacheKey: `qwen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          estimatedValidity: 3600 // 1 hour
        },
        success: true
      };
    } catch (error) {
      console.error('Qwen API Error:', error);
      // 如果API调用失败，返回模拟响应
      return this.getSimulationResponse(request, startTime);
    }
  }

  private getSimulationResponse(request: QwenAPIRequest, startTime: number): EdgeFunctionResponse {
    // 为演示目的提供模拟响应
    const mockContent = "你来到了一个新的地点。周围环境充满了未知与神秘。每一个决定都可能影响你的命运。::仔细观察周围环境::勇敢地向未知前进::回忆之前的线索，寻找提示::";
    
    const mockResponse: QwenAPIResponse = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: mockContent
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 20,
        completion_tokens: 30,
        total_tokens: 50
      }
    };

    return {
      data: mockResponse,
      edgeMetadata: {
        generatedAt: new Date().toISOString(),
        edgeLocation: 'simulation',
        modelUsed: request.model,
        processingTime: performance.now() - startTime,
        cacheStatus: 'miss',
        cacheKey: `qwen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        estimatedValidity: 3600
      },
      success: true
    };
  }

  private async callQwenAPI(request: QwenAPIRequest): Promise<QwenAPIResponse> {
    const response = await fetch(this.config.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-DashScope-SSE': 'disable' // Disable SSE for now
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        parameters: {
          temperature: request.temperature,
          max_tokens: request.max_tokens,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Qwen API Error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
    }

    const data: QwenAPIResponse = await response.json();
    return data;
  }

  // Method for building story-specific prompts
  buildStoryPrompt(context: { 
    currentNarrative: string; 
    availableChoices: Array<{ id: string; text: string }> 
  }, selectedChoice: { id: string; text: string }): QwenAPIRequest {
    return {
      model: this.config.model || 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: `你是一位专业的互动分支叙事故事讲述者。你根据用户的选择创作引人入胜、连贯的故事片段来延续叙事。每个故事片段应该是1-2段。在每个片段结尾提供2-3个有意义的选项来推动情节发展。严格按照以下格式返回，不要包含任何格式标签: 故事内容::选项1::选项2::选项3`
        },
        {
          role: 'user',
          content: `当前故事: "${context.currentNarrative}"

用户选择: "${selectedChoice.text}"
        
请生成接下来的故事部分，该部分应逻辑上延续此选择，并为用户提供新的选项。严格按照以下格式返回，不要包含任何格式标签: 故事内容::选项1::选项2::选项3`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    };
  }
}

// Interface and class for story synthesis
export interface StorySynthesisRequest {
  title: string;
  storyHistory: Array<{
    nodeId: string;
    choiceId: string;
    content: string;
    choiceText: string;
    timestamp: Date;
  }>;
  userNotes?: string;
}

export interface StorySynthesisResult {
  success: boolean;
  content?: string;
  error?: string;
  processingTime: number;
}

export class StorySynthesizer {
  private qwenClient: QwenAIClient;

  constructor() {
    this.qwenClient = new QwenAIClient({
      apiKey: appConfig.qwen.apiKey,
      model: appConfig.qwen.model,
      endpoint: appConfig.qwen.endpoint
    });
  }

  async synthesizeFullStory(request: StorySynthesisRequest): Promise<StorySynthesisResult> {
    const startTime = Date.now();
    
    try {
      // Build detailed user story history
      const storyOutline = this.buildStoryOutline(request);
      
      // Build AI prompt
      const prompt = this.buildSynthesisPrompt(request.title, storyOutline, request.userNotes);
      
      // Call AI to generate complete story
      const response = await this.qwenClient.generateStory({
        model: appConfig.qwen.model,
        messages: [
          {
            role: 'system',
            content: `You are a professional creative fiction writer skilled at integrating fragmented story segments into coherent and engaging complete stories.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
      
      if (!response.success || !response.data.choices?.[0]?.message?.content) {
        return {
          success: false,
          error: response.data.error?.message || 'AI generation failed',
          processingTime: Date.now() - startTime
        };
      }
      
      return {
        success: true,
        content: response.data.choices[0].message.content,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  private buildStoryOutline(request: StorySynthesisRequest): string {
    let outline = `故事标题: ${request.title}\n\n`;
    
    // 按时间顺序列出用户经历的每个场景和选择
    outline += `这是用户在互动故事中的完整经历，按时间顺序排列：\n\n`;
    
    request.storyHistory.forEach((entry, index) => {
      outline += `第${index + 1}幕:\n`;
      outline += `场景描述: ${entry.content}\n`;  // entry.content来自StorySynthesisRequest
      outline += `用户的选择: ${entry.choiceText}\n`;  // entry.choiceText来自StorySynthesisRequest
      outline += `发生时间: ${entry.timestamp.toLocaleString()}\n\n`;
    });
    
    outline += `请根据以上用户的真实经历，整合成一个连贯的中短篇小说。确保：\n`;
    outline += `- 保留所有场景描述和用户选择\n`;
    outline += `- 按时间顺序整合内容\n`;
    outline += `- 在场景间建立自然的过渡\n`;
    outline += `- 保持情节的一致性和连贯性\n`;
    outline += `- 创建一个完整的开头、发展和结局\n`;
    
    return outline;
  }

  private buildSynthesisPrompt(title: string, storyOutline: string, userNotes?: string): string {
    let prompt = `请将以下用户在互动故事中的真实经历整合成一篇连贯、完整的中短篇小说，标题为"${title}".`;
    
    if (userNotes) {
      prompt += `用户附加说明: ${userNotes}\n\n`;
    }
    
    prompt += `\n\n${storyOutline}`;
    
    prompt += `\n\n重要要求：\n`;
    prompt += `1. 必须使用用户经历的真实场景描述和选择内容\n`;
    prompt += `2. 严格按照时间顺序整合这些片段\n`;
    prompt += `3. 在各片段之间创建自然、流畅的过渡段落\n`;
    prompt += `4. 保持人物、地点、事件的一致性和连贯性\n`;
    prompt += `5. 保留用户做过的每个选择，体现其对故事走向的影响\n`;
    prompt += `6. 创作一个完整的故事情节，包括开头、发展、高潮和结局\n`;
    prompt += `7. 保持统一的叙事风格和语调\n`;
    prompt += `8. 整合后的作品应是一篇结构完整的中短篇小说\n`;
    prompt += `9. 不能添加用户故事中没有出现的新场景、人物或情节\n`;
    prompt += `10. 每个场景转换必须有合理的因果关系和过渡描述\n`;
    
    return prompt;
  }

  // Export user story history in JSON format
  exportUserStory(playerState: PlayerState, nodes: StoryNode[]): any {
    return {
      title: `My Interactive Story-${new Date().toISOString().split('T')[0]}`,
      generatedAt: new Date(),
      playerState: {
        id: playerState.id,
        currentStoryId: playerState.currentStoryId,
        currentNodeId: playerState.currentNodeId,
        storyHistoryCount: playerState.storyHistory.length
      },
      storyNodes: playerState.storyHistory.map(historyEntry => {
        // 使用保存的详细信息，而不是重新查找
        return {
          nodeId: historyEntry.nodeId,
          choiceId: historyEntry.choiceId,
          nodeContent: historyEntry.nodeContent,
          choiceText: historyEntry.choiceText,
          timestamp: historyEntry.timestamp
        };
      })
    };
  }
}