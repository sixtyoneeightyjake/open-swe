import { Hono } from "hono";

const health = new Hono();

// Health check endpoint
health.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "open-swe-backend",
    version: "0.0.0",
    environment: "production",
    uptime: Math.floor(Date.now() / 1000)
  });
});

// Readiness check endpoint
health.get("/ready", (c) => {
  // Add any readiness checks here (database connections, external services, etc.)
  const isReady = true; // Replace with actual readiness logic
  
  if (isReady) {
    return c.json({
      status: "ready",
      timestamp: new Date().toISOString(),
      checks: {
        // Add specific readiness checks here
        // database: "connected",
        // external_api: "accessible"
      }
    });
  } else {
    return c.json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      checks: {
        // Add failed checks here
      }
    }, 503);
  }
});

// Liveness check endpoint
health.get("/live", (c) => {
  return c.json({
    status: "alive",
    timestamp: new Date().toISOString()
  });
});

export default health;