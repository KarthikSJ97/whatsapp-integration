// src/services/whatsapp.service.ts
import { WhatsAppAPI } from 'whatsapp-api-js';
import { BodyComponent, BodyParameter, Document, HeaderComponent, HeaderParameter, Image, Template, Text, Video, } from 'whatsapp-api-js/messages';
import { NodeNext } from 'whatsapp-api-js/setup/node';
import { config } from '../config';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

export const whatsapp = new WhatsAppAPI(
    NodeNext({
        token: config.waToken,
        appSecret: config.waAppSecret,
        webhookVerifyToken: config.waVerifyToken,
        v: 'v21.0',
        secure: true,
    })
);

// Event listener: Inbound messages
whatsapp.on.message = async ({ phoneID, from, message, name }) => {
    console.log(`[INBOUND MESSAGE] From: ${name} (${from}) | Type: ${message.type}`);

    if (message.type === 'text') {
        await whatsapp.sendMessage(
            phoneID,
            from,
            new Text(`Hello ${name}, received: "${message.text.body}"`)
        );
    }
};

// Event listener: Status updates (sent, delivered, read)
whatsapp.on.status = ({ phone, status, id }) => {
    console.log(`[STATUS UPDATE] Msg ID: ${id} | Recipient: ${phone} | Status: ${status}`);
};

// Types for Template Component Support
export interface TemplateMediaHeader {
    type: 'image' | 'document' | 'video';
    mediaId?: string;
    link?: string;
}

// Helper: Send free-form text message (Active 24h window)
export async function sendTextMessage(recipientPhone: string, text: string) {
    return await whatsapp.sendMessage(
        config.phoneNumberId,
        recipientPhone,
        new Text(text)
    );
}

// Helper: Send free-form image message (Active 24h window)
export async function sendImageMessage(
    recipientPhone: string,
    mediaSource: string, // media_id OR URL
    isId = true,
    caption?: string
) {
    return await whatsapp.sendMessage(
        config.phoneNumberId,
        recipientPhone,
        new Image(mediaSource, isId, caption)
    );
}

// Helper: Send free-form document message (Active 24h window)
export async function sendDocumentMessage(
    recipientPhone: string,
    mediaSource: string,
    isId = true,
    caption?: string,
    filename?: string
) {
    return await whatsapp.sendMessage(
        config.phoneNumberId,
        recipientPhone,
        new Document(mediaSource, isId, caption, filename)
    );
}

// Interface definition for media headers
export interface TemplateMediaHeader {
    type: 'image' | 'document' | 'video';
    mediaId?: string;
    link?: string;
}

// Helper: Send template message (supports variables & header media)
export async function sendTemplateMessage(
    recipientPhone: string,
    templateName: string,
    languageCode = 'en_US',
    bodyVariables: string[] = [],
    headerMedia?: TemplateMediaHeader
) {
    const components: (HeaderComponent | BodyComponent)[] = [];

    // 1. Build Header Component if media is provided
    if (headerMedia) {
        const source = headerMedia.mediaId || headerMedia.link;
        if (!source) {
            throw new Error('Either mediaId or link must be provided for headerMedia');
        }
        const isId = !!headerMedia.mediaId;

        let mediaObj: Image | Document | Video;
        if (headerMedia.type === 'image') {
            mediaObj = new Image(source, isId);
        } else if (headerMedia.type === 'document') {
            mediaObj = new Document(source, isId);
        } else if (headerMedia.type === 'video') {
            mediaObj = new Video(source, isId);
        } else {
            throw new Error(`Unsupported header media type: ${headerMedia.type}`);
        }

        components.push(new HeaderComponent(new HeaderParameter(mediaObj)));
    }

    // 2. Build Body Component with text parameters
    if (bodyVariables.length > 0) {
        const textParameters = bodyVariables.map((val) => new BodyParameter(val));
        components.push(new BodyComponent(...(textParameters as [BodyParameter, ...BodyParameter[]])));
    }

    // Send template message
    return await whatsapp.sendMessage(
        config.phoneNumberId,
        recipientPhone,
        new Template(templateName, languageCode, ...components)
    );
}

// Helper Service: Template CRUD Operations (via Meta Graph API)
export const templateService = {
    async createTemplate(payload: {
        name: string;
        category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
        language: string;
        components: any[];
    }) {
        const res = await fetch(`${GRAPH_URL}/${config.wabaId}/message_templates`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.waToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        return await res.json();
    },

    async listTemplates(limit = 25) {
        const res = await fetch(
            `${GRAPH_URL}/${config.wabaId}/message_templates?limit=${limit}`,
            {
                headers: { Authorization: `Bearer ${config.waToken}` },
            }
        );
        return await res.json();
    },

    async getTemplateByName(name: string) {
        const res = await fetch(
            `${GRAPH_URL}/${config.wabaId}/message_templates?name=${name}`,
            {
                headers: { Authorization: `Bearer ${config.waToken}` },
            }
        );
        return await res.json();
    },

    async updateTemplate(templateId: string, components: any[]) {
        const res = await fetch(`${GRAPH_URL}/${templateId}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.waToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ components }),
        });
        return await res.json();
    },

    async deleteTemplate(name: string) {
        const res = await fetch(
            `${GRAPH_URL}/${config.wabaId}/message_templates?name=${name}`,
            {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${config.waToken}` },
            }
        );
        return await res.json();
    },
};

// Helper: Send free-form text with automatic template fallback if 24h window is closed
export async function sendTextMessageWithFallback(
    recipientPhone: string,
    text: string,
    fallbackTemplateName?: string,
    fallbackLanguageCode = 'en_US',
    fallbackBodyVariables: string[] = []
) {
    try {
        // Attempt standard free-form text
        return await sendTextMessage(recipientPhone, text);
    } catch (error: any) {
        // Check if error is Meta Code 131047 (Re-engagement message required / Window closed)
        const isWindowClosedError =
            error?.code === 131047 ||
            error?.error_data?.details?.includes('131047') ||
            error?.message?.includes('131047');

        if (isWindowClosedError && fallbackTemplateName) {
            console.warn(
                `[24H WINDOW CLOSED] User ${recipientPhone} window expired. Retrying with fallback template: ${fallbackTemplateName}`
            );

            // Fallback to sending template
            return await sendTemplateMessage(
                recipientPhone,
                fallbackTemplateName,
                fallbackLanguageCode,
                fallbackBodyVariables
            );
        }

        // Re-throw if it's a different error or no fallback template was supplied
        throw error;
    }
}

// Helper: Upload media directly to Meta Graph API
export async function uploadMedia(file: File) {
    // 1. Create a standard FormData container
    const formData = new FormData();

    // 2. Set the "file" field expected by whatsapp-api-js
    formData.append('file', file);

    // 3. Pass the FormData instance to uploadMedia
    const response = await whatsapp.uploadMedia(config.phoneNumberId, formData);
    return response; // Returns { id: "MEDIA_ID" }
}