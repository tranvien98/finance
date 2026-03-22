export interface ParsedExpense {
  amount: number;
  category: string;
  description: string;
}

const SYSTEM_PROMPT = `You are a strict JSON API for personal finance in Vietnam. 
Extract the expense details from the user's free-text input.
Respond ONLY with a valid JSON object matching this schema:
{
  "amount": number (integer in VND),
  "category": string (e.g. "Food", "Transportation", "Entertainment", "Bills", "Shopping", "Health", "Other"),
  "description": string (clear, concise description)
}

Rules:
1. "k" means thousand (50k = 50000). "tr" or "trieu" means million.
2. If no amount is found, amount is 0.
3. If category is unclear or missing, use "Other".
4. Do NOT include markdown formatting blocks in your response, just the raw JSON.

Examples:
User: "ăn phở 50k"
{"amount": 50000, "category": "Food", "description": "Ăn phở"}

User: "đổ xăng 150k"
{"amount": 150000, "category": "Transportation", "description": "Đổ xăng"}

User: "tiền điện 2.5tr"
{"amount": 2500000, "category": "Bills", "description": "Tiền điện"}

User: "xem phim 120"
{"amount": 120000, "category": "Entertainment", "description": "Xem phim"}

User: "mua sắm tiki 500k"
{"amount": 500000, "category": "Shopping", "description": "Tiki"}
`;

export async function parseExpenseAI(text: string, apiKey: string): Promise<ParsedExpense> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Finance App",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content) as ParsedExpense;
  } catch (e) {
    throw new Error("Failed to parse AI response as JSON");
  }
}
