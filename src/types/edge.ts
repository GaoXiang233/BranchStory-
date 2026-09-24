// src/types/edge.ts
export interface EdgeLocation {
  id: string;
  name: string;
  region: string;
  countryCode: string;
  latitude: number;
  longitude: number;
}

export interface EdgeFunctionResponse {
  data: any;
  edgeMetadata: EdgeMetadata;
  success: boolean;
  message?: string;
}

export interface EdgeMetadata {
  generatedAt: string;
  edgeLocation: string;
  modelUsed: string;
  processingTime: number;
  cacheStatus: 'hit' | 'miss';
  cacheKey: string;
  estimatedValidity: number;
}

export interface EdgeRequestOptions {
  timeout?: number;
  retryStrategy?: 'none' | 'linear-backoff' | 'exponential-backoff';
  maxRetries?: number;
  edgeLocation?: string;
}

export interface EdgeClientConfig {
  apiEndpoint: string;
  cacheEnabled: boolean;
  defaultTimeout: number;
  fallbackEnabled: boolean;
}