import { Router } from "express";
import { z } from "zod";
import { assistantTools, executeTool } from "./assistant.tools.js";

export const assistantRouter = Router();

const chatSchema = z.object({
  message: z.string(),
  productId: z.string().optional(),
});

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

    // TODO: wire Claude + tool-use loop
    res.json({
      message: body.message,
      reply: "Assistant is not yet connected to Claude. Tools are registered and ready.",
      availableTools: assistantTools.map((t) => t.name),
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
