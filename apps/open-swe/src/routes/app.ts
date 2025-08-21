import { Hono } from "hono";
import { cors } from "hono/cors";
import { unifiedWebhookHandler } from "./github/unified-webhook.js";
import health from "./health.js";
import metrics from "./metrics.js";
import { requestLogger } from "../utils/logger.js";
import { metricsMiddleware } from "../metrics/middleware.js";

export const app = new Hono();

// Middleware
app.use("*", cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Request logging middleware
app.use("*", requestLogger());

// Metrics middleware (after logging but before routes)
app.use("*", metricsMiddleware());

// Health check routes
app.route("/", health);

// Metrics endpoint
app.route("/metrics", metrics);

// GitHub webhook routes
app.post("/webhooks/github", unifiedWebhookHandler);
