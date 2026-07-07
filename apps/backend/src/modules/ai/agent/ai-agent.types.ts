export interface AIRequestDTO {
  conversationId: string;
  message: string;
}

export interface AIResponseDTO {
  reply: string;
  conversationId: string;
  selectedTools: string[];
}

export interface ToolCallDTO {
  name: string;
  arguments: any;
}

export interface PlannerResultDTO {
  selectedTools: string[];
}

export interface ToolExecutionDTO {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface ConversationDTO {
  conversationId: string;
  history: any[];
}
