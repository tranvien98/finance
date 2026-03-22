import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { vi } from 'vitest';

let mongod: MongoMemoryServer;

// Default mock session — override per test with mockSession()
let currentSession: { user: { id: string; email: string } } | null = null;

export function mockSession(session: { user: { id: string; email: string } } | null) {
  currentSession = session;
}

export async function setupTestDB() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // Mock auth() to return currentSession
  vi.mock('@/lib/auth', () => ({
    auth: vi.fn(() => Promise.resolve(currentSession)),
  }));

  // Mock dbConnect() to no-op (already connected via MongoMemoryServer)
  vi.mock('@/lib/db', () => ({
    dbConnect: vi.fn(() => Promise.resolve(mongoose)),
  }));
}

export async function teardownTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod.stop();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
