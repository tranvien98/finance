import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock next/server after() to execute callback immediately (synchronous for testing)
vi.mock('next/server', () => ({
  after: (cb: () => Promise<void>) => {
    cb().catch(console.error);
  },
}));

// Mock the AI classify module -- vi.mock intercepts at the module resolution level
// so this works for `await import('@/lib/ai-classify')` calls inside after().
// src/lib/ai-classify.ts exists as a stub (Phase 4 will replace it with real AI logic).
vi.mock('@/lib/ai-classify', () => ({
  classifyExpense: vi.fn().mockResolvedValue({
    amount: 25000,
    category: 'Food',
    description: 'ca phe',
  }),
}));

// Mock telegram sendMessage
vi.mock('@/lib/telegram', () => ({
  sendMessage: vi.fn().mockResolvedValue({ ok: true }),
}));

// Mock dbConnect() to no-op -- tests manage the MongoDB connection directly
// via MongoMemoryServer. Must be at top level so vi.mock hoisting applies.
vi.mock('@/lib/db', () => ({
  dbConnect: vi.fn(() => Promise.resolve(mongoose)),
}));

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.ENCRYPTION_SECRET = 'test-secret-key-for-encryption-32b';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Helper to create test user with webhook secret
async function createTestUser(webhookSecret: string) {
  const User = (await import('@/models/user.model')).default;
  const { encrypt } = await import('@/lib/encryption');
  return User.create({
    email: `test-${webhookSecret}@example.com`,
    hashedPassword: 'hashed',
    encryptedTelegramBotToken: encrypt('123456:ABC-DEF'),
    encryptedOpenrouterKey: encrypt('sk-test-key'),
    telegramWebhookSecret: webhookSecret,
  });
}

// Helper to build Telegram update request
function buildWebhookRequest(
  secretToken: string | null,
  messageText: string,
  messageId = 12345
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secretToken) {
    headers['x-telegram-bot-api-secret-token'] = secretToken;
  }
  return new Request('http://localhost:3000/api/telegram/webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      update_id: 1,
      message: {
        message_id: messageId,
        from: { id: 999, first_name: 'Test' },
        chat: { id: 999 },
        text: messageText,
        date: Math.floor(Date.now() / 1000),
      },
    }),
  });
}

describe('POST /api/telegram/webhook', () => {
  it('returns 401 when secret token header is missing', async () => {
    const { POST } = await import('@/app/api/telegram/webhook/route');
    const req = buildWebhookRequest(null, 'ca phe 25k');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when secret token does not match any user', async () => {
    await createTestUser('valid-secret');
    const { POST } = await import('@/app/api/telegram/webhook/route');
    const req = buildWebhookRequest('wrong-secret', 'ca phe 25k');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates expense from valid Telegram message', async () => {
    const user = await createTestUser('valid-secret-2');
    // Seed a category for the user
    const Category = (await import('@/models/category.model')).default;
    await Category.create({ userId: user._id, name: 'Food', isDefault: true });

    const { POST } = await import('@/app/api/telegram/webhook/route');
    const req = buildWebhookRequest('valid-secret-2', 'ca phe 25k', 11111);
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Wait briefly for after() mock to complete
    await new Promise((r) => setTimeout(r, 100));

    const Expense = (await import('@/models/expense.model')).default;
    const expense = await Expense.findOne({ userId: user._id, telegramMessageId: 11111 });
    expect(expense).not.toBeNull();
    expect(expense!.amount).toBe(25000);
    expect(expense!.category).toBe('Food');
  });

  it('does not create duplicate expense for same message_id', async () => {
    const user = await createTestUser('valid-secret-3');
    const Category = (await import('@/models/category.model')).default;
    await Category.create({ userId: user._id, name: 'Food', isDefault: true });

    // Create existing expense with this telegramMessageId
    const Expense = (await import('@/models/expense.model')).default;
    await Expense.create({
      userId: user._id,
      amount: 25000,
      category: 'Food',
      note: 'ca phe',
      date: new Date(),
      telegramMessageId: 22222,
    });

    const { POST } = await import('@/app/api/telegram/webhook/route');
    const req = buildWebhookRequest('valid-secret-3', 'ca phe 25k', 22222);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.duplicate).toBe(true);

    // Verify only one expense exists
    const count = await Expense.countDocuments({ userId: user._id, telegramMessageId: 22222 });
    expect(count).toBe(1);
  });

  it('returns 200 for non-text updates (e.g., photo)', async () => {
    await createTestUser('valid-secret-4');
    const headers = {
      'Content-Type': 'application/json',
      'x-telegram-bot-api-secret-token': 'valid-secret-4',
    };
    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        update_id: 2,
        message: {
          message_id: 33333,
          from: { id: 999 },
          chat: { id: 999 },
          date: Math.floor(Date.now() / 1000),
          // no text field
        },
      }),
    });

    const { POST } = await import('@/app/api/telegram/webhook/route');
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
