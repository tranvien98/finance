export function parseExpenseFallback(text: string) {
  let amount = 0;
  
  // Normalize text for easier matching
  const normalizedText = text.toLowerCase().replace(/,/g, '');
  
  // Regex to find a number optionally followed by k, tr, trieu, ngan
  const match = normalizedText.match(/(\d+(?:\.\d+)?)\s*(k|tr|triệu|trieu|ngàn|ngan)?/);
  
  if (match) {
    const rawNum = parseFloat(match[1]);
    const suffix = match[2];
    
    if (suffix === 'k' || suffix === 'ngàn' || suffix === 'ngan') {
      amount = Math.round(rawNum * 1000);
    } else if (suffix === 'tr' || suffix === 'triệu' || suffix === 'trieu') {
      amount = Math.round(rawNum * 1000000);
    } else {
      // If no suffix, assume it's the exact amount. 
      // If the number is < 1000, they likely shorthand for thousands (e.g. "50" -> 50k)
      if (rawNum < 1000) {
        amount = Math.round(rawNum * 1000);
      } else {
        amount = Math.round(rawNum);
      }
    }
  }

  return {
    amount: amount || 0,
    category: "Other", // Per D-05, always assign "Other" for fallback
    description: text.trim()
  };
}
