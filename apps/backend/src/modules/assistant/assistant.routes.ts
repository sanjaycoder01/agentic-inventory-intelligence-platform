import { Router } from "express";
import { z } from "zod";
import { claudeClient } from "../ai/llm/claude.client.js";
import { assistantTools, executeTool } from "./assistant.tools.js";

export const assistantRouter = Router();

const chatSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

const ASSISTANT_SYSTEM_PROMPT = `You are a read-only dark store inventory assistant.
You may use tools to look up recommendations, inventory, stock ledger, and purchase orders.
Never create, approve, reject, or modify any records.
Answer clearly for a store admin. If data is missing, say so.`;

assistantRouter.get("/tools", (_req, res) => {
  res.json(
    assistantTools.map(({ name, description, input_schema }) => ({
      name,
      description,
      input_schema,
    })),
  );
});

assistantRouter.post("/chat", async (req, res, next) => {
  try {
    const body = chatSchema.parse(req.body);
    const anthropicTools = assistantTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      { role: "user", content: body.message },
    ];

    let response = await claudeClient.generateToolResponse(
      messages,
      anthropicTools as never,
      ASSISTANT_SYSTEM_PROMPT,
    );

    const toolResults: Array<{ tool: string; result: unknown }> = [];

    if (response.toolCalls?.length) {
      for (const call of response.toolCalls) {
        const result = await executeTool(
          call.name,
          (call.arguments ?? {}) as Record<string, unknown>,
        );
        toolResults.push({ tool: call.name, result });
      }

      const followUp = await claudeClient.generateResponse(
        [
          {
            role: "user",
            content: `Admin question: ${body.message}

Tool results (JSON):
${JSON.stringify(toolResults, null, 2)}

Answer the admin using only these tool results. Be concise.`,
          },
        ],
        ASSISTANT_SYSTEM_PROMPT,
      );

      response = followUp;
    }

    res.json({
      conversationId: body.conversationId ?? "default-session",
      reply: response.content,
      toolsUsed: toolResults.map((item) => item.tool),
    });
  } catch (err) {
    next(err);
  }
});

assistantRouter.post("/tools/:name", async (req, res, next) => {
  try {
    const result = await executeTool(req.params.name, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
