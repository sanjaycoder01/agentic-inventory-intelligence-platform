import { agentGraph } from '../graph/graph.builder.js';
import { conversationMemory } from '../memory/conversation.memory.js';
import { validationService } from '../safety/validation.service.js';
import { AIRequestDTO, AIResponseDTO } from './ai-agent.types.js';
import '../tools/index.js';

export class AIAgentService {
  async ask(req: AIRequestDTO): Promise<AIResponseDTO> {
    const valResult = validationService.validatePrompt(req.message);
    if (!valResult.valid) {
      throw new Error(valResult.error || 'Validation failed');
    }

    const resultState = await agentGraph.invoke({
      conversationId: req.conversationId,
      userQuestion: req.message,
      selectedTools: [],
      toolResults: [],
      llmResponse: '',
      finalResponse: '',
    });

    await conversationMemory.saveMessage(req.conversationId, {
      question: req.message,
      toolCalls: resultState.selectedTools,
      response: resultState.finalResponse,
    });

    return {
      reply: resultState.finalResponse,
      conversationId: req.conversationId,
      selectedTools: resultState.selectedTools,
    };
  }

  async plan(question: string): Promise<string[]> {
    const resultState = await agentGraph.invoke({
      conversationId: 'temp',
      userQuestion: question,
      selectedTools: [],
      toolResults: [],
      llmResponse: '',
      finalResponse: '',
    });
    return resultState.selectedTools;
  }

  async execute(toolName: string, args: any): Promise<any> {
    const { toolRegistry } = await import('../tools/tool.registry.js');
    return toolRegistry.execute(toolName, args);
  }

  async respond(reply: string, conversationId: string): Promise<AIResponseDTO> {
    return {
      reply,
      conversationId,
      selectedTools: [],
    };
  }
}

export const aiAgentService = new AIAgentService();
