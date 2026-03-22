// Stub: Phase 4 will implement AI-based expense classification via OpenRouter.
// This stub allows the Telegram webhook route to load and fall through to the
// regex fallback when no real AI implementation is present.
// Replace this file entirely when implementing Phase 4.

export async function classifyExpense(
  _text: string,
  _categories: string[],
  _apiKey: string
): Promise<{ amount: number; category: string; description: string }> {
  throw new Error('classifyExpense is not implemented yet (Phase 4 stub)');
}
