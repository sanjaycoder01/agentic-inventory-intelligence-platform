import cors from "cors";
import express, { type Express } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
