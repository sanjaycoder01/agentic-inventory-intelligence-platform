import { Router } from "express";
import { aiAgentService } from "./agent/ai-agent.service.js";

export const aiRouter = Router();

aiRouter.post("/ask", async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;
    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }
    const response = await aiAgentService.ask({
      conversationId: conversationId || "default-session",
      message,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});
