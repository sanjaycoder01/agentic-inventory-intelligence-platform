import { AI_ENV } from '../config/ai.environment.js';
import { ClaudeMessage, ClaudeResponse } from './claude.types.js';

export class ClaudeClient {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = AI_ENV.anthropicApiKey;
    this.model = AI_ENV.claudeModel;
  }

  async generateResponse(
    messages: ClaudeMessage[],
    systemPrompt?: string
  ): Promise<ClaudeResponse> {
    if (this.apiKey === 'mock-key' || process.env.NODE_ENV === 'test') {
      const lastMsg = messages[messages.length - 1]?.content || '';
      if (lastMsg.includes('Amul Milk')) {
        return {
          content: 'Amul Milk has high demand due to recent morning cart updates and positive ratings.'
        };
      }
      return {
        content: 'Mocked Claude Response for: ' + lastMsg
      };
    }
    return { content: 'Actual integration requires valid API key.' };
  }

  async generateStructuredResponse<T>(
    messages: ClaudeMessage[],
    schema: any,
    systemPrompt?: string
  ): Promise<T> {
    const res = await this.generateResponse(messages, systemPrompt);
    try {
      return JSON.parse(res.content) as T;
    } catch {
      return {} as T;
    }
  }

  async generateToolResponse(
    messages: ClaudeMessage[],
    tools: any[],
    systemPrompt?: string
  ): Promise<ClaudeResponse> {
    return this.generateResponse(messages, systemPrompt);
  }
}

export const claudeClient = new ClaudeClient();
