import { AI_CONFIG } from './ai.config.js';

export const AI_ENV = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'mock-key',
  claudeModel: AI_CONFIG.DEFAULT_MODEL,
  temperature: AI_CONFIG.TEMPERATURE,
  maxTokens: AI_CONFIG.MAX_TOKENS,
};
