import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import User from '@/models/user.model';
import { decrypt } from '@/lib/encryption';
import { getCache, setCache } from '@/lib/cache';
import { parseExpenseAI } from '@/lib/ai-parser';
import { parseExpenseFallback } from '@/lib/fallback-parser';
import { z } from 'zod';

const classifySchema = z.object({
  text: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;

  try {
    const body = await req.json();
    const parsed = classifySchema.safeParse(body);
    
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input text' }, { status: 400 });
    }

    const text = parsed.data.text;
    const normalizedKey = text.toLowerCase().trim().replace(/\s+/g, ' ');

    // 1. Check cache first
    const cachedResult = getCache(normalizedKey);
    if (cachedResult) {
      return Response.json(cachedResult);
    }

    // 2. Fetch User API Key
    await dbConnect();
    const user = await User.findById(userId).lean();
    
    let apiKey = process.env.OPENROUTER_API_KEY; // system fallback
    
    if (user?.encryptedOpenrouterKey) {
      apiKey = decrypt(user.encryptedOpenrouterKey);
    }

    if (!apiKey) {
      return Response.json({ 
        error: 'OpenRouter API key is required. Please set it in Settings.' 
      }, { status: 400 });
    }

    // 3. AI classification with simple retry logic
    let result;
    try {
      result = await parseExpenseAI(text, apiKey);
    } catch (e) {
      console.warn('AI parsing failed, retrying once...', e);
      // Retry once on failure
      try {
        result = await parseExpenseAI(text, apiKey);
      } catch (retryError) {
        console.error('AI parsing failed after retry, using fallback.', retryError);
        // Fallback to regex if still failing
        result = parseExpenseFallback(text);
      }
    }

    // 4. Cache the successful result (whether AI or fallback) and return
    setCache(normalizedKey, result);
    return Response.json(result);
    
  } catch (error) {
    console.error('Classification error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
