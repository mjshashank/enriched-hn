import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Variables } from './types.js';
import { stories } from './routes/stories.js';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS middleware - allow all origins (for browser extension + web app)
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400, // 24 hours
  })
);

// Security headers middleware
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stories endpoint
app.route('/stories', stories);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Enriched HN API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Health check',
      'GET /stories?ids=123,456': 'Batch fetch enriched stories',
    },
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
