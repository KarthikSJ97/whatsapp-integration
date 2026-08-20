// src/routes/messages.route.ts
import { Elysia, t } from 'elysia';
import { sendTextMessage, sendTemplateMessage } from '../services/whatsapp_service';

export const messageRoutes = new Elysia({ prefix: '/api' })
  .post(
    '/send-text',
    async ({ body, set }) => {
      try {
        const response = await sendTextMessage(body.recipientPhone, body.text);
        return { success: true, data: response };
      } catch (error: any) {
        set.status = 500;
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        recipientPhone: t.String(),
        text: t.String(),
      }),
    }
  )
  .post(
    '/send-template',
    async ({ body, set }) => {
      try {
        const response = await sendTemplateMessage(
          body.recipientPhone,
          body.templateName,
          body.languageCode
        );
        return { success: true, data: response };
      } catch (error: any) {
        set.status = 500;
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        recipientPhone: t.String(),
        templateName: t.String(),
        languageCode: t.Optional(t.String()),
      }),
    }
  );