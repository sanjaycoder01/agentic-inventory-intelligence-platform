import Anthropic from "@anthropic-ai/sdk";
import { AI_ENV } from "../config/ai.environment.js";
import type { ClaudeMessage, ClaudeResponse } from "./claude.types.js";

function hasRealApiKey(apiKey: string): boolean {
  return Boolean(apiKey) && apiKey !== "mock-key" && !apiKey.startsWith("mock");
}

export class ClaudeClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly client: Anthropic | null;

  constructor() {
    this.apiKey = AI_ENV.anthropicApiKey;
    this.model = AI_ENV.claudeModel;
    this.maxTokens = AI_ENV.maxTokens;
    this.client = hasRealApiKey(this.apiKey)
      ? new Anthropic({ apiKey: this.apiKey })
      : null;
  }

  get isLive(): boolean {
    return this.client !== null && process.env.NODE_ENV !== "test";
  }

  async generateResponse(
    messages: ClaudeMessage[],
    systemPrompt?: string,
  ): Promise<ClaudeResponse> {
    if (!this.isLive || !this.client) {
      return this.mockResponse(messages, systemPrompt);
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n")
      .trim();

    return { content: text };
  }

  async generateStructuredResponse<T>(
    messages: ClaudeMessage[],
    _schema: unknown,
    systemPrompt?: string,
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
    tools: Anthropic.Tool[],
    systemPrompt?: string,
  ): Promise<ClaudeResponse & { stopReason?: string; rawContent?: Anthropic.ContentBlock[] }> {
    if (!this.isLive || !this.client) {
      const mock = await this.mockResponse(messages, systemPrompt);
      return { ...mock, stopReason: "end_turn", rawContent: [] };
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      tools,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n")
      .trim();

    const toolCalls = response.content
      .filter((block) => block.type === "tool_use")
      .map((block) => {
        const toolBlock = block as Anthropic.ToolUseBlock;
        return {
          id: toolBlock.id,
          name: toolBlock.name,
          arguments: toolBlock.input,
        };
      });

    return {
      content: text,
      toolCalls,
      stopReason: response.stop_reason ?? undefined,
      rawContent: response.content,
    };
  }

  private mockResponse(
    messages: ClaudeMessage[],
    systemPrompt?: string,
  ): ClaudeResponse {
    const lastMsg = messages[messages.length - 1]?.content || "";
    if (systemPrompt?.includes("inventory recommendation") || lastMsg.includes("REORDER")) {
      return {
        content:
          "Based on the provided scores and inventory levels, replenishment is recommended because demand and conversion remain healthy while store stock is low.",
      };
    }
    if (lastMsg.toLowerCase().includes("amul milk") || lastMsg.toLowerCase().includes("milk")) {
      return {
        content:
          "Amul Milk has high demand due to recent cart activity and strong ratings, so replenishment is recommended while stock is low.",
      };
    }
    return {
      content:
        "Based on current inventory signals and recommendations, here is a concise operational summary for your dark store.",
    };
  }
}

export const claudeClient = new ClaudeClient();
