import { parseExpenseAI } from '@/lib/ai-parser';
import { parseExpenseFallback } from '@/lib/fallback-parser';
import { getCache, setCache } from '@/lib/cache';

/**
 * Classifies a free-text expense message into structured data.
 * Uses AI (OpenRouter) with a single retry, falling back to regex parser on failure.
 * Results are cached by normalized text to reduce API cost.
 *
 * @param text - The raw user message (e.g. "ca phe 25k")
 * @param categories - User's category names (currently unused by AI prompt but kept for contract compatibility)
 * @param apiKey - Decrypted OpenRouter API key
 * @returns Parsed expense with amount (integer VND), category, and description
 */
export async function classifyExpense(
  text: string,
  categories: string[],
  apiKey: string
): Promise<{ amount: number; category: string; description: string }> {
  // 1. Check cache first (same normalization as /api/expenses/classify)
  const normalizedKey = text.toLowerCase().trim().replace(/\s+/g, ' ');
  const cached = getCache(normalizedKey);
  if (cached) return cached;

  // 2. Try AI classification with one retry
  let result: { amount: number; category: string; description: string };
  try {
    result = await parseExpenseAI(text, apiKey);
  } catch (firstError) {
    console.warn('ai-classify: AI parsing failed, retrying once...', firstError);
    try {
      result = await parseExpenseAI(text, apiKey);
    } catch (retryError) {
      console.error('ai-classify: AI parsing failed after retry, using fallback.', retryError);
      result = parseExpenseFallback(text);
    }
  }

  // 3. Cache and return
  setCache(normalizedKey, result);
  return result;
}
