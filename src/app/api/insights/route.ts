import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { resolveDateRange } from '@/lib/date-range';
import { getDashboardStats } from '@/lib/dashboard-aggregations';
import { getCache, setCache } from '@/lib/cache';
import User from '@/models/user.model';
import { decrypt } from '@/lib/encryption';

const SYSTEM_PROMPT = `You are a helpful Vietnamese financial advisor. 
You will be provided with the user's spending and investment totals for the current month.
Write a 2-sentence encouraging and helpful insight in Vietnamese. Format as plain text without any markdown or conversational filler. Keep it concise.`;

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try cache first (Cache key tied to user and current day)
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `insights_${session.user.id}_${today}`;
    const cachedInsight = getCache(cacheKey);
    
    if (cachedInsight) {
      return NextResponse.json({ insight: cachedInsight });
    }

    await dbConnect();

    // Fetch user for OpenRouter key
    const user = await User.findById(session.user.id).lean();
    let apiKey = process.env.OPENROUTER_API_KEY;
    if (user?.encryptedOpenrouterKey) {
      apiKey = decrypt(user.encryptedOpenrouterKey);
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key missing. Configure it in settings to see AI insights.' }, { status: 400 });
    }

    // Get stats for current month
    const { from, to } = resolveDateRange({});
    const stats = await getDashboardStats(session.user.id, from, to);

    // Format stats for the LLM
    const promptData = `
Total Expenses: ${stats.totalExpenses} VND
Total Investments: ${stats.totalInvestments} VND
Top Categories: ${stats.categoryBreakdown.slice(0, 3).map(c => `${c.category} (${c.total} VND)`).join(', ')}
`;

    // Fetch from OpenRouter
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Finance App",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: promptData }
        ]
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('OpenRouter error:', err);
      return NextResponse.json({ error: 'Failed to generate insight' }, { status: 502 });
    }

    const data = await aiRes.json();
    let insight = data.choices[0].message.content.trim();
    
    // Strip surrounding quotes if the LLM adds them
    if (insight.startsWith('"') && insight.endsWith('"')) {
      insight = insight.slice(1, -1);
    }

    // Cache the result
    setCache(cacheKey, insight);

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('Insights API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
