import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import User from '@/models/user.model';
import { decrypt } from '@/lib/encryption';
import { setWebhook, generateWebhookSecret } from '@/lib/telegram';

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findById((session.user as { id?: string }).id);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user.encryptedTelegramBotToken) {
    return Response.json(
      { error: 'No Telegram bot token configured. Save your bot token first.' },
      { status: 400 }
    );
  }

  const botToken = decrypt(user.encryptedTelegramBotToken);
  const webhookSecret = generateWebhookSecret();
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    return Response.json({ error: 'APP_URL not configured' }, { status: 500 });
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  const result = await setWebhook(botToken, webhookUrl, webhookSecret);

  if (!result.ok) {
    return Response.json(
      { error: `Telegram API error: ${result.description || 'Unknown error'}` },
      { status: 502 }
    );
  }

  // Save the webhook secret on success
  user.telegramWebhookSecret = webhookSecret;
  await user.save();

  return Response.json({ ok: true, webhookUrl });
}
