// src/utils/edgeUtils.ts
import { EdgeLocation } from '../types/edge';

export const detectEdgeLocation = async (): Promise<EdgeLocation> => {
  // In a real implementation, this would detect the actual edge location
  // For now, we'll simulate based on client information
  try {
    // This is a simplified approach - real edge detection would use headers
    // or a geolocation service
    const response = await fetch('https://httpbin.org/ip');
    await response.json(); // We don't actually use the data, just validate we can make the request
    
    // Simulate edge location based on IP (in real implementation, use actual edge headers)
    return {
      id: 'local-dev',
      name: 'Local Development',
      region: 'DEV',
      countryCode: 'XX',
      latitude: 0,
      longitude: 0
    };
  } catch (error) {
    console.warn('Could not detect edge location:', error);
    return {
      id: 'unknown',
      name: 'Unknown Location',
      region: 'UNKNOWN',
      countryCode: 'XX',
      latitude: 0,
      longitude: 0
    };
  }
};

export const calculateOptimalTypingSpeed = (generationTime: number): number => {
  // Calculate typing speed based on how long generation took
  // If generation was fast, we can animate faster; if slow, animate slower
  if (generationTime < 500) return 20; // Fast typing for quick generation
  if (generationTime < 1000) return 30; // Medium typing
  if (generationTime < 2000) return 50; // Slower typing for longer generation
  return 80; // Slowest typing for slow generation
};

export const estimateTokenCount = (text: string): number => {
  // Rough estimation of token count (1 token ~ 4 characters for English)
  return Math.ceil(text.length / 4);
};

export const showEdgeOptimizationToast = (message: string): void => {
  // In a real implementation, this would show an actual toast notification
  console.info(`Edge Optimization: ${message}`);
  // Could integrate with a toast library like react-toastify
};

export const calculateNarrativeComplexity = (narrative: any): number => {
  // Calculate complexity based on narrative structure
  if (!narrative) return 0;
  
  let complexity = 0;
  
  // Add complexity for content length
  if (narrative.content && typeof narrative.content === 'string') {
    complexity += Math.min(narrative.content.length / 1000, 0.3); // Max 0.3 for content
  }
  
  // Add complexity for number of choices
  if (narrative.choices && Array.isArray(narrative.choices)) {
    complexity += Math.min(narrative.choices.length * 0.1, 0.2); // Max 0.2 for choices
  }
  
  // Add complexity for narrative structure depth
  if (narrative.branches && Array.isArray(narrative.branches)) {
    complexity += Math.min(narrative.branches.length * 0.15, 0.5); // Max 0.5 for branches
  }
  
  return Math.min(complexity, 1); // Cap at 1.0
};

export const calculateChoiceUniqueness = (choices: any[]): number => {
  if (!choices || choices.length === 0) return 0;
  
  // For now, we'll calculate based on choice variety
  // In a real implementation, we might use semantic analysis
  return Math.min(choices.length * 0.2, 1); // More choices = higher uniqueness, capped at 1
};