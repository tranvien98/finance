import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import User from '@/models/user.model';
import { encrypt, decrypt, maskApiKey } from '@/lib/encryption';
import { z } from 'zod';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findById((session.user as { id?: string }).id).lean();

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json({
    email: user.email,
    hasOpenrouterKey: !!user.encryptedOpenrouterKey,
    maskedOpenrouterKey: user.encryptedOpenrouterKey
      ? maskApiKey(decrypt(user.encryptedOpenrouterKey))
      : null,
    hasTelegramBotToken: !!user.encryptedTelegramBotToken,
  });
}

const updateSettingsSchema = z.object({
  openrouterKey: z.string().min(1).optional(),
  telegramBotToken: z.string().min(1).optional(),
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  await dbConnect();

  const update: Record<string, string | null> = {};

  if (parsed.data.openrouterKey) {
    update.encryptedOpenrouterKey = encrypt(parsed.data.openrouterKey);
  }

  if (parsed.data.telegramBotToken) {
    update.encryptedTelegramBotToken = encrypt(parsed.data.telegramBotToken);
  }

  const user = await User.findByIdAndUpdate(
    (session.user as { id?: string }).id,
    { $set: update },
    { new: true }
  ).lean();

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json({
    hasOpenrouterKey: !!user.encryptedOpenrouterKey,
    maskedOpenrouterKey: user.encryptedOpenrouterKey
      ? maskApiKey(decrypt(user.encryptedOpenrouterKey))
      : null,
    hasTelegramBotToken: !!user.encryptedTelegramBotToken,
  });
}
