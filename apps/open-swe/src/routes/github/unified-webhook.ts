import { Context } from "hono";
import { BlankEnv, BlankInput } from "hono/types";
import { createLogger, LogLevel } from "../../utils/logger.js";
import { Webhooks } from "@octokit/webhooks";
import { handleIssueLabeled } from "./issue-labeled.js";
import { handlePullRequestComment } from "./pull-request-comment.js";
import { handlePullRequestReview } from "./pull-request-review.js";
import { handlePullRequestReviewComment } from "./pull-request-review-comment.js";
import { trackGitHubWebhook, trackError } from "../../metrics/index.js";

const logger = createLogger(LogLevel.INFO, "GitHubUnifiedWebhook");

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const WEBHOOK_TIMEOUT = parseInt(process.env.WEBHOOK_TIMEOUT || '30000');

// Validate required environment variables
if (!GITHUB_WEBHOOK_SECRET) {
  logger.error('GITHUB_WEBHOOK_SECRET environment variable is required');
  throw new Error('Missing required GitHub webhook configuration');
}

const webhooks = new Webhooks({
  secret: GITHUB_WEBHOOK_SECRET,
});

const getPayload = (body: string): Record<string, any> | null => {
  try {
    const payload = JSON.parse(body);
    return payload;
  } catch {
    return null;
  }
};

const getHeaders = (
  c: Context,
): {
  id: string;
  name: string;
  installationId: string;
  targetType: string;
} | null => {
  const headers = c.req.header();
  const webhookId = headers["x-github-delivery"] || "";
  const webhookEvent = headers["x-github-event"] || "";
  const installationId = headers["x-github-hook-installation-target-id"] || "";
  const targetType = headers["x-github-hook-installation-target-type"] || "";
  if (!webhookId || !webhookEvent || !installationId || !targetType) {
    return null;
  }
  return { id: webhookId, name: webhookEvent, installationId, targetType };
};

// Issue labeling events
webhooks.on("issues.labeled", async ({ payload }) => {
  await handleIssueLabeled(payload);
});

// PR general comment events (discussion area)
webhooks.on("issue_comment.created", async ({ payload }) => {
  await handlePullRequestComment(payload);
});

// PR review events (approve/request changes/comment)
webhooks.on("pull_request_review.submitted", async ({ payload }) => {
  await handlePullRequestReview(payload);
});

// PR review comment events (inline code comments)
webhooks.on("pull_request_review_comment.created", async ({ payload }) => {
  await handlePullRequestReviewComment(payload);
});

// Rate limiting map for webhook requests
const webhookRateLimit = new Map<string, { count: number; resetTime: number }>();

const isRateLimited = (installationId: string): boolean => {
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
  
  const current = webhookRateLimit.get(installationId);
  
  if (!current || now > current.resetTime) {
    webhookRateLimit.set(installationId, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (current.count >= maxRequests) {
    return true;
  }
  
  current.count++;
  return false;
};

const validateWebhookSignature = async (body: string, signature: string): Promise<boolean> => {
  try {
    return await webhooks.verify(body, signature);
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    return false;
  }
};

export async function unifiedWebhookHandler(
  c: Context<BlankEnv, "/webhooks/github", BlankInput>,
) {
  const startTime = Date.now();
  
  try {
    // Get raw body for signature verification
    const rawBody = await c.req.text();
    const signature = c.req.header('x-hub-signature-256');
    
    // Validate webhook signature
    if (!signature || !(await validateWebhookSignature(rawBody, signature))) {
      logger.warn('Invalid webhook signature', {
        hasSignature: !!signature,
        userAgent: c.req.header('User-Agent')
      });
      return c.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const payload = getPayload(rawBody);
    if (!payload) {
      logger.error("Invalid JSON payload");
      return c.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventHeaders = getHeaders(c);
    if (!eventHeaders) {
      logger.error("Missing required webhook headers");
      return c.json({ error: "Missing required webhook headers" }, { status: 400 });
    }
    
    // Rate limiting check
    if (isRateLimited(eventHeaders.installationId)) {
      logger.warn('Rate limit exceeded', {
        installationId: eventHeaders.installationId,
        event: eventHeaders.name
      });
      return c.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Log webhook received
    logger.info('Webhook received', {
      event: eventHeaders.name,
      installationId: eventHeaders.installationId,
      deliveryId: eventHeaders.id,
      targetType: eventHeaders.targetType
    });
    
    // Track webhook received
    trackGitHubWebhook(eventHeaders.name, 'success');

    // Process webhook with timeout
    const processPromise = webhooks.receive({
      id: eventHeaders.id,
      name: eventHeaders.name as any,
      payload,
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Webhook processing timeout')), WEBHOOK_TIMEOUT);
    });
    
    await Promise.race([processPromise, timeoutPromise]);
    
    const processingTime = Date.now() - startTime;
    logger.info('Webhook processed successfully', {
      event: eventHeaders.name,
      installationId: eventHeaders.installationId,
      processingTime: `${processingTime}ms`
    });
    
    // Track successful webhook processing
    trackGitHubWebhook(eventHeaders.name, 'success');

    return c.json({ 
      received: true, 
      event: eventHeaders.name,
      processingTime: `${processingTime}ms`
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Webhook processing failed', {
      error: errorMessage,
      processingTime: `${processingTime}ms`,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Track webhook processing error
    trackError('webhook_processing_error', 'github_webhook');
    trackGitHubWebhook('unknown', 'error');
    
    // Return appropriate error status
    if (errorMessage.includes('timeout')) {
      return c.json({ error: 'Request timeout' }, { status: 408 });
    }
    
    return c.json({ 
      error: 'Webhook processing failed',
      processingTime: `${processingTime}ms`
    }, { status: 500 });
  }
}
