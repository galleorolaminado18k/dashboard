// Cliente WAHA WhatsApp API
// lib/whatsapp/baileys.ts

const base = process.env.WAHA_BASE_URL || process.env.NEXT_PUBLIC_WAHA_BASE_URL || '';
const key = process.env.WAHA_API_KEY || '';

const headers = {
  'X-Api-Key': key,
  'Content-Type': 'application/json'
};

const SESSION_NAME = 'default';

export const startSession = async () => {
  const res = await fetch(`${base}/api/sessions/${SESSION_NAME}/start`, {
    method: 'POST',
    headers
  });
  return res.json();
};

export const getQR = async () => {
  const res = await fetch(`${base}/api/${SESSION_NAME}/auth/qr`, {
    headers
  });
  return res.json();
};

export const sendText = async (to: string, text: string) => {
  const res = await fetch(`${base}/api/sendText`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      session: SESSION_NAME,
      chatId: to,
      text
    })
  });
  return res.json();
};

export const health = async () => {
  const res = await fetch(`${base}/health`);
  return res.json();
};

