// src/routes/webhook.route.ts
import { Elysia } from 'elysia';
import { whatsapp } from '../services/whatsapp_service';
import type { GetParams, PostData } from 'whatsapp-api-js/types';

export const webhookRoutes = new Elysia({ prefix: '/webhook' })
  // GET: Webhook Handshake
  .get('/', ({ query, set }) => {
    try {
      const challenge = whatsapp.get(query as unknown as GetParams);
      set.headers['content-type'] = 'text/plain';
      set.status = 200;
      return String(challenge);
    } catch (error) {
      console.error('[WEBHOOK VERIFICATION ERROR]', error);
      set.status = 400;
      return 'Webhook verification failed';
    }
  })
  // POST: Custom body parser to capture exact raw string for HMAC verification
  .post(
    '/',
    async ({ body, headers, set }) => {
      try {
        const signature = headers['x-hub-signature-256'] as string;
        const rawBody = body as string; // Body is now guaranteed to be raw text
        const postData = JSON.parse(rawBody) as PostData;

        // Process event asynchronously
        whatsapp
          .post(postData, rawBody, signature)
          .catch((err) => console.error('[WEBHOOK PROCESS ERROR]', err));

        set.status = 200;
        return 'EVENT_RECEIVED';
      } catch (error) {
        console.error('[WEBHOOK CRASH ERROR]', error);
        set.status = 500;
        return 'Internal Server Error';
      }
    },
    {
      // Override default JSON parser to preserve raw payload string
      parse: async ({ request }) => {
        return await request.text();
      },
    }
  );