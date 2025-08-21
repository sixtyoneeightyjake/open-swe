import { Context, Next } from 'hono';
import { httpRequestsTotal, httpRequestDuration, activeConnections } from './prometheus.js';

/**
 * Prometheus metrics middleware for Hono
 * Tracks HTTP request metrics including count, duration, and active connections
 */
export function metricsMiddleware() {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    const method = c.req.method;
    const route = c.req.routePath || c.req.path;
    
    // Increment active connections
    activeConnections.inc();
    
    try {
      await next();
      
      const duration = (Date.now() - start) / 1000;
      const statusCode = c.res.status.toString();
      
      // Record metrics
      httpRequestsTotal.inc({ method, route, status_code: statusCode });
      httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
      
    } catch (error) {
      const duration = (Date.now() - start) / 1000;
      const statusCode = '500';
      
      // Record metrics for failed requests
      httpRequestsTotal.inc({ method, route, status_code: statusCode });
      httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
      
      throw error;
    } finally {
      // Decrement active connections
      activeConnections.dec();
    }
  };
}

/**
 * Helper function to track custom metrics
 */
export function trackCustomMetric(metricName: string, value: number, labels?: Record<string, string>) {
  // This can be extended to handle custom metrics tracking
  // Custom metric tracking logic would go here
}