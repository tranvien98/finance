import crypto from 'crypto';

const TELEGRAM_API = 'https://api.telegram.org';

export async function setWebhook(
  botToken: string,
  webhookUrl: string,
  secretToken: string
): Promise<{ ok: boolean; description?: string }> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secretToken,
      allowed_updates: ['message'],
    }),
  });
  return res.json();
}

export async function sendMessage(
  botToken: string,
  chatId: number,
  text: string
): Promise<{ ok: boolean }> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
  return res.json();
}

export async function deleteWebhook(
  botToken: string
): Promise<{ ok: boolean }> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/deleteWebhook`, {
    method: 'POST',
  });
  return res.json();
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
