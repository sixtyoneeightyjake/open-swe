import {
  langGraphRequestsTotal,
  langGraphExecutionDuration,
  tokenUsageTotal,
  tokenCostTotal,
  cacheHitsTotal,
  cacheMissesTotal,
  cacheSavingsTotal,
  githubWebhooksTotal,
  errorsTotal,
  circuitBreakerState,
  circuitBreakerFailures
} from './prometheus.js';

/**
 * Track LangGraph execution metrics
 */
export function trackLangGraphExecution(
  graphName: string,
  status: 'success' | 'error' | 'timeout',
  durationSeconds: number
) {
  langGraphRequestsTotal.inc({ graph_name: graphName, status });
  langGraphExecutionDuration.observe({ graph_name: graphName, status }, durationSeconds);
}

/**
 * Track token usage and costs
 */
export function trackTokenUsage(
  model: string,
  inputTokens: number,
  outputTokens: number,
  totalCost: number
) {
  tokenUsageTotal.inc({ model, type: 'input' }, inputTokens);
  tokenUsageTotal.inc({ model, type: 'output' }, outputTokens);
  tokenCostTotal.inc({ model }, totalCost);
}

/**
 * Track cache performance
 */
export function trackCacheHit(cacheType: string, savingsAmount?: number) {
  cacheHitsTotal.inc({ cache_type: cacheType });
  if (savingsAmount !== undefined) {
    cacheSavingsTotal.inc({ cache_type: cacheType }, savingsAmount);
  }
}

export function trackCacheMiss(cacheType: string) {
  cacheMissesTotal.inc({ cache_type: cacheType });
}

/**
 * Track GitHub webhook events
 */
export function trackGitHubWebhook(
  eventType: string,
  status: 'success' | 'error' | 'ignored'
) {
  githubWebhooksTotal.inc({ event_type: eventType, status });
}

/**
 * Track application errors
 */
export function trackError(
  errorType: string,
  component: string
) {
  errorsTotal.inc({ error_type: errorType, component });
}

/**
 * Track circuit breaker state
 */
export function updateCircuitBreakerState(
  service: string,
  state: 'closed' | 'open' | 'half-open'
) {
  const stateValue = state === 'closed' ? 0 : state === 'open' ? 1 : 2;
  circuitBreakerState.set({ service }, stateValue);
}

export function trackCircuitBreakerFailure(service: string) {
  circuitBreakerFailures.inc({ service });
}

/**
 * Helper function to wrap async functions with metrics tracking
 */
export function withMetrics<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  metricName: string,
  component: string
) {
  return async (...args: T): Promise<R> => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = (Date.now() - start) / 1000;
      
      // Track successful execution
      langGraphExecutionDuration.observe(
        { graph_name: metricName, status: 'success' },
        duration
      );
      langGraphRequestsTotal.inc({ graph_name: metricName, status: 'success' });
      
      return result;
    } catch (error) {
      const duration = (Date.now() - start) / 1000;
      
      // Track failed execution
      langGraphExecutionDuration.observe(
        { graph_name: metricName, status: 'error' },
        duration
      );
      langGraphRequestsTotal.inc({ graph_name: metricName, status: 'error' });
      trackError(error instanceof Error ? error.name : 'UnknownError', component);
      
      throw error;
    }
  };
}