// src/routes/messages.route.ts
import { Elysia, t } from 'elysia';
import {
    sendDocumentMessage,
    sendImageMessage,
    sendTemplateMessage,
    sendTextMessage,
    sendTextMessageWithFallback,
    uploadMedia,
} from '../services/whatsapp_service';

export const messageRoutes = new Elysia({ prefix: '/api' })
    // Send Free-Form Text with optional Fallback Template
    .post(
        '/send-text',
        async ({ body, set }) => {
            try {
                let response;

                if (body.fallbackTemplateName) {
                    response = await sendTextMessageWithFallback(
                        body.recipientPhone,
                        body.text,
                        body.fallbackTemplateName,
                        body.fallbackLanguageCode,
                        body.fallbackBodyVariables
                    );
                } else {
                    response = await sendTextMessage(body.recipientPhone, body.text);
                }

                return { success: true, data: response };
            } catch (error: any) {
                set.status = 500;
                return {
                    success: false,
                    error: error.message || error,
                    code: error.code,
                };
            }
        },
        {
            body: t.Object({
                recipientPhone: t.String(),
                text: t.String(),
                fallbackTemplateName: t.Optional(t.String()),
                fallbackLanguageCode: t.Optional(t.String({ default: 'en_US' })),
                fallbackBodyVariables: t.Optional(t.Array(t.String())),
            }),
        }
    )

    // Send Direct Image (inside 24h window)
    .post(
        '/send-image',
        async ({ body, set }) => {
            try {
                const response = await sendImageMessage(
                    body.recipientPhone,
                    body.mediaSource,
                    body.isId ?? true,
                    body.caption
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
                mediaSource: t.String(), // media_id or URL
                isId: t.Optional(t.Boolean({ default: true })),
                caption: t.Optional(t.String()),
            }),
        }
    )

    // Send Direct Document (inside 24h window)
    .post(
        '/send-document',
        async ({ body, set }) => {
            try {
                const response = await sendDocumentMessage(
                    body.recipientPhone,
                    body.mediaSource,
                    body.isId ?? true,
                    body.caption,
                    body.filename
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
                mediaSource: t.String(), // media_id or URL
                isId: t.Optional(t.Boolean({ default: true })),
                caption: t.Optional(t.String()),
                filename: t.Optional(t.String()),
            }),
        }
    )

    // Send Template Message (supports variables & header media)
    .post(
        '/send-template',
        async ({ body, set }) => {
            try {
                const response = await sendTemplateMessage(
                    body.recipientPhone,
                    body.templateName,
                    body.languageCode,
                    body.bodyVariables,
                    body.headerMedia
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
                languageCode: t.Optional(t.String({ default: 'en_US' })),
                bodyVariables: t.Optional(t.Array(t.String())),
                headerMedia: t.Optional(
                    t.Object({
                        type: t.Union([
                            t.Literal('image'),
                            t.Literal('document'),
                            t.Literal('video'),
                        ]),
                        mediaId: t.Optional(t.String()),
                        link: t.Optional(t.String()),
                    })
                ),
            }),
        }
    )

    .post(
        '/upload-media',
        async ({ body, set }) => {
            try {
                const response = await uploadMedia(body.file);
                return { success: true, data: response };
            } catch (error: any) {
                set.status = 500;
                return {
                    success: false,
                    error: error.message || error,
                };
            }
        },
        {
            body: t.Object({
                file: t.File(),
            }),
        }
    );