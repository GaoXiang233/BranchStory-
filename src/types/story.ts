// src/types/story.ts
export interface StoryNode {
  id: string;
  title: string;
  content: string;
  choices: Choice[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Choice {
  id: string;
  text: string;
  nextNodeId?: string; // 使目标节点ID可选，允许为空
  requirements?: ChoiceRequirement[];
}

export interface ChoiceRequirement {
  type: 'attribute' | 'item' | 'previous_choice';
  name: string;
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
}

export interface PlayerState {
  id: string;
  currentStoryId: string;
  currentNodeId: string;
  storyHistory: StoryHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryHistoryEntry {
  nodeId: string;
  choiceId: string;
  nodeContent: string;      // 节点的具体内容
  choiceText: string;       // 用户选择的文本
  timestamp: Date;
  storyState: any;
}

export interface Metadata {
  generatedAt: string;
  location: string;
  modelUsed: string;
  processingTime: number;
  cacheStatus: 'hit' | 'miss';
  cacheKey: string;
  estimatedValidity: number;
}