'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function QuickAdd() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    const toastId = toast.loading('Classifying expense...');
    
    try {
      // 1. Classify via AI
      const classifyRes = await fetch('/api/expenses/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      const classifyData = await classifyRes.json();
      
      if (!classifyRes.ok) {
        throw new Error(classifyData.error || 'Failed to classify expense');
      }

      toast.loading('Saving expense...', { id: toastId });

      // 2. Save the output to db
      const expenseData = {
        amount: classifyData.amount,
        category: classifyData.category,
        note: classifyData.description,
        date: new Date().toISOString(),
      };

      const saveRes = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveData.error || 'Failed to save expense');
      }

      // 3. Success
      toast.success(
        `Added: ${expenseData.amount.toLocaleString('vi-VN')}₫ for ${expenseData.note}`,
        { id: toastId }
      );
      setText('');
      router.refresh();

    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'An error occurred. Check settings for API keys.', {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 sm:p-5 border border-purple-100 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h2 className="text-sm font-medium text-purple-900">AI Quick Add</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. ăn phở 50k, bia hơi 150k, tiền điện 2tr..."
          className="flex-1 rounded-md border border-purple-200 px-4 py-2.5 text-sm shadow-sm outline-none placeholder:text-purple-300 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 bg-white min-w-0 transition-colors"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !text.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 shadow-sm whitespace-nowrap"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
