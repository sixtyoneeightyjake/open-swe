import { Hono } from 'hono';
import { getMetrics } from '../metrics/prometheus.js';

const metrics = new Hono();

/**
 * GET /metrics
 * Prometheus metrics endpoint
 * Returns metrics in Prometheus format
 */
metrics.get('/', async (c) => {
  try {
    const metricsData = await getMetrics();
    
    return c.text(metricsData, 200, {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
    });
  } catch (_error) {
    // Error handling for metrics endpoint
    return c.text('Error retrieving metrics', 500);
  }
});

export default metrics;