// src/config.ts
export const config = {
    port: Number(process.env.PORT) || 3000,
    waToken: process.env.WA_TOKEN || '',
    waAppSecret: process.env.WA_APP_SECRET || '',
    waVerifyToken: process.env.WA_VERIFY_TOKEN || '',
    phoneNumberId: process.env.PHONE_NUMBER_ID || '',
  };