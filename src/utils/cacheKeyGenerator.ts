// src/utils/cacheKeyGenerator.ts
import { nanoid } from 'nanoid';

interface CacheKeyParams {
  playerId?: string;
  storyId?: string;
  nodeId?: string;
  choiceId?: string;
  operation?: string;
  edgeLocation?: string;
  timestamp?: number;
}

export const generateCacheKey = (params: CacheKeyParams): string => {
  const { playerId, storyId, nodeId, choiceId, operation, edgeLocation, timestamp } = params;
  
  const parts = [];
  if (operation) parts.push(operation);
  if (playerId) parts.push(`player:${playerId}`);
  if (storyId) parts.push(`story:${storyId}`);
  if (nodeId) parts.push(`node:${nodeId}`);
  if (choiceId) parts.push(`choice:${choiceId}`);
  if (edgeLocation) parts.push(`edge:${edgeLocation}`);
  if (timestamp) parts.push(`time:${timestamp}`);
  
  return parts.join(':');
};

export const generateSemanticCacheKey = async (content: string): Promise<string> => {
  // 简化版语义缓存键生成，实际实现可能需要更复杂的算法
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `semantic:${hashHex.substring(0, 16)}`;
};

export const generateOperationId = (): string => {
  return `op_${Date.now()}_${nanoid(8)}`;
};