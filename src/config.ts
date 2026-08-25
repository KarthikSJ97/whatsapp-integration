// src/config.ts
export const config = {
    port: process.env.PORT || 3000,
    waToken: process.env.WA_TOKEN!,
    waAppSecret: process.env.WA_APP_SECRET!,
    waVerifyToken: process.env.WA_VERIFY_TOKEN!,
    phoneNumberId: process.env.PHONE_NUMBER_ID!,
    wabaId: process.env.WABA_ID!, // Added WABA ID for Template APIs
  };