// src/services/whatsapp.service.ts
import { WhatsAppAPI } from 'whatsapp-api-js';
import { Template, Text } from 'whatsapp-api-js/messages';
import { config } from '../config';

export const whatsapp = new WhatsAppAPI({
  token: config.waToken,
  appSecret: config.waAppSecret,
  webhookVerifyToken: config.waVerifyToken,
  v: 'v21.0', // Pin version to suppress the API version warning
});

// Event listener: Inbound messages
whatsapp.on.message = async ({ phoneID, from, message, name }) => {
  console.log(`[INBOUND MESSAGE] From: ${name} (${from}) | Type: ${message.type}`);

  if (message.type === 'text') {
    // Basic echo reply for testing
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

// Helper: Send free-form text message (Active 24h window)
export async function sendTextMessage(recipientPhone: string, text: string) {
  return await whatsapp.sendMessage(
    config.phoneNumberId,
    recipientPhone,
    new Text(text)
  );
}

// Helper: Send template message (Closed 24h window or initial outbound)
export async function sendTemplateMessage(
  recipientPhone: string,
  templateName: string,
  languageCode = 'en_US'
) {
  return await whatsapp.sendMessage(
    config.phoneNumberId,
    recipientPhone,
    new Template(templateName, languageCode)
  );
}