import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom application metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register]
});

// LangGraph specific metrics
export const langGraphRequestsTotal = new Counter({
  name: 'langgraph_requests_total',
  help: 'Total number of LangGraph requests',
  labelNames: ['graph_name', 'status'],
  registers: [register]
});

export const langGraphExecutionDuration = new Histogram({
  name: 'langgraph_execution_duration_seconds',
  help: 'Duration of LangGraph executions in seconds',
  labelNames: ['graph_name', 'status'],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register]
});

// Token usage metrics
export const tokenUsageTotal = new Counter({
  name: 'token_usage_total',
  help: 'Total number of tokens used',
  labelNames: ['model', 'type'], // type: input, output
  registers: [register]
});

export const tokenCostTotal = new Counter({
  name: 'token_cost_total',
  help: 'Total cost of tokens used in USD',
  labelNames: ['model'],
  registers: [register]
});

// Cache metrics
export const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register]
});

export const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register]
});

export const cacheSavingsTotal = new Counter({
  name: 'cache_savings_total',
  help: 'Total cost savings from cache in USD',
  labelNames: ['cache_type'],
  registers: [register]
});

// GitHub webhook metrics
export const githubWebhooksTotal = new Counter({
  name: 'github_webhooks_total',
  help: 'Total number of GitHub webhooks received',
  labelNames: ['event_type', 'status'],
  registers: [register]
});

// Error metrics
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['error_type', 'component'],
  registers: [register]
});

// Circuit breaker metrics
export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['service'],
  registers: [register]
});

export const circuitBreakerFailures = new Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['service'],
  registers: [register]
});

// Export the registry for the metrics endpoint
export { register };

// Helper function to get metrics as string
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

// Helper function to clear all metrics (useful for testing)
export function clearMetrics(): void {
  register.clear();
}