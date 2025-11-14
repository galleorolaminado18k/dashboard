// Cliente Baileys WhatsApp API
// lib/whatsapp/baileys.ts

const base = process.env.BAILEYS_BASE_URL || process.env.NEXT_PUBLIC_BAILEYS_BASE_URL || '';
const key = process.env.BAILEYS_API_KEY || '';

const headers = {
  'x-api-key': key,
  'Content-Type': 'application/json'
};

export const startSession = async () => {
  const res = await fetch(`${base}/start`, {
    method: 'POST',
    headers
  });
  return res.json();
};

export const getQR = async () => {
  const res = await fetch(`${base}/qr`);
  return res.json();
};

export const sendText = async (to: string, text: string) => {
  const res = await fetch(`${base}/sendText`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ to, text })
  });
  return res.json();
};

export const health = async () => {
  const res = await fetch(`${base}/health`);
  return res.json();
};

