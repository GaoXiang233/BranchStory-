// src/utils/idGenerator.ts
import { nanoid } from 'nanoid';

export const generateId = (): string => {
  return nanoid();
};

export const generateNodeId = (): string => {
  return `node_${nanoid(10)}`;
};

export const generateChoiceId = (): string => {
  return `choice_${nanoid(10)}`;
};

export const generateStoryId = (): string => {
  return `story_${nanoid(10)}`;
};

export const generatePlayerId = (): string => {
  return `player_${nanoid(12)}`;
};