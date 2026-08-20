// src/index.ts
import { Elysia } from 'elysia';
import { config } from './config';
import { webhookRoutes } from './routes/webhook_route';
import { messageRoutes } from './routes/messages_route';

const app = new Elysia()
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(webhookRoutes)
  .use(messageRoutes)
  .listen(config.port);

console.log(`🚀 Server running at http://${app.server?.hostname}:${app.server?.port}`);