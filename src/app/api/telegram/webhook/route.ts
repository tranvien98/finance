import { after } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/user.model';
import Expense from '@/models/expense.model';
import Category from '@/models/category.model';
import { decrypt } from '@/lib/encryption';
import { sendMessage } from '@/lib/telegram';
import { parseExpenseFallback } from '@/lib/fallback-parser';
// NOTE: Do NOT import classifyExpense at the top level.
// Phase 4 (ai-classify module) may not be delivered yet.
// The import is done dynamically inside after() with a .catch() fallback.

interface TelegramMessage {
  message_id: number;
  from: { id: number; first_name?: string };
  chat: { id: number };
  text?: string;
  date: number;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export async function POST(req: Request) {
  // Step 1: Validate X-Telegram-Bot-Api-Secret-Token header
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (!secretToken) {
    return Response.json({ error: 'Missing secret token' }, { status: 401 });
  }

  // Step 2: Parse the Telegram update payload
  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only process text messages
  const message = update.message;
  if (!message?.text) {
    return Response.json({ ok: true }); // Ignore non-text updates
  }

  // Step 3: Look up user by webhook secret
  await dbConnect();
  const user = await User.findOne({ telegramWebhookSecret: secretToken }).lean();
  if (!user) {
    return Response.json({ error: 'Invalid secret token' }, { status: 401 });
  }

  // Step 4: Idempotency check -- has this message already been processed?
  const existingExpense = await Expense.findOne({
    userId: user._id,
    telegramMessageId: message.message_id,
  }).lean();

  if (existingExpense) {
    // Already processed, return 200 to stop Telegram retries
    return Response.json({ ok: true, duplicate: true });
  }

  // Step 5: Return 200 IMMEDIATELY, process in background via after()
  // Capture all needed values before after() closure
  const userId = user._id;
  const encryptedApiKey = user.encryptedOpenrouterKey;
  const encryptedBotToken = user.encryptedTelegramBotToken;
  const messageText = message.text;
  const messageId = message.message_id;
  const messageDate = message.date;
  const chatId = message.chat.id;

  after(async () => {
    try {
      await dbConnect();

      // Decrypt bot token for reply
      if (!encryptedBotToken) return;
      const botToken = decrypt(encryptedBotToken);

      // Get user's categories for AI classification
      const categories = await Category.find({ userId }).lean();
      const categoryNames = categories.map((c) => c.name);

      let parsed: { amount: number; category: string; description: string };

      // Attempt AI classification via dynamic import.
      // Phase 4 delivers src/lib/ai-classify.ts. If Phase 4 is not yet complete,
      // the dynamic import fails and classifyExpense will be null -- we fall
      // through to the regex fallback. This keeps the route loadable regardless
      // of Phase 4 status.
      const { classifyExpense } = await import('@/lib/ai-classify').catch(
        () => ({ classifyExpense: null as null })
      );

      if (encryptedApiKey && classifyExpense) {
        const apiKey = decrypt(encryptedApiKey);
        parsed = await classifyExpense(messageText, categoryNames, apiKey);
      } else {
        // No API key OR ai-classify module not available -- use Phase 4 fallback parser
        // Handles k, tr, trieu, ngan suffixes and bare numbers (not just "Nk" pattern)
        parsed = parseExpenseFallback(messageText);
      }

      if (parsed.amount <= 0) {
        await sendMessage(
          botToken,
          chatId,
          'Could not parse expense amount from your message. Please try again with a format like "ca phe 25k".'
        );
        return;
      }

      // Create the expense with telegramMessageId for idempotency
      // Use try/catch for duplicate key error (race condition with Telegram retries)
      try {
        await Expense.create({
          userId,
          amount: parsed.amount,
          category: parsed.category,
          note: parsed.description,
          date: new Date(messageDate * 1000),
          telegramMessageId: messageId,
        });
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: number }).code === 11000
        ) {
          // Duplicate key -- another request already created this expense
          return;
        }
        throw err;
      }

      // Reply with confirmation
      const formattedAmount = new Intl.NumberFormat('vi-VN').format(parsed.amount);
      const replyText = `Expense recorded:\n<b>${formattedAmount} VND</b> - ${parsed.category}\n${parsed.description}`;
      await sendMessage(botToken, chatId, replyText);
    } catch (err) {
      console.error('Telegram webhook processing error:', err);
      // Best effort -- don't crash, Telegram already got 200
    }
  });

  return Response.json({ ok: true });
}
