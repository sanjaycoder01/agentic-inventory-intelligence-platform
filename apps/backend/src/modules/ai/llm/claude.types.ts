export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: any;
  }>;
}
