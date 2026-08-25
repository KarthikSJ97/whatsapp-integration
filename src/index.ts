// src/index.ts
import { Elysia } from 'elysia';
import { config } from './config';
import { messageRoutes } from './routes/messages_route';
import { templateRoutes } from './routes/template_route';
import { webhookRoutes } from './routes/webhook_route';

const app = new Elysia()
    .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
    .use(webhookRoutes)
    .use(messageRoutes)
    .use(templateRoutes)
    .listen(config.port);

console.log(`🚀 Server running at http://${app.server?.hostname}:${app.server?.port}`);