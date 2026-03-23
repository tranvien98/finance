'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AiInsightsCard() {
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsight() {
      try {
        const res = await fetch('/api/insights');
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load insight');
        }
        
        setInsight(data.insight);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    loadInsight();
  }, []);

  if (error && error.includes('OpenRouter API key missing')) {
    return null; // Don't show if they haven't set up AI features
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100 dark:from-purple-950/20 dark:to-indigo-950/20 dark:border-purple-900/50 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles size={64} className="text-purple-600 dark:text-purple-400" />
      </div>
      
      <CardContent className="pt-6 relative z-10 flex gap-4 items-start">
        <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full shrink-0">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-sm text-purple-900 dark:text-purple-300 mb-1">AI Financial Insight</h3>
          
          {loading ? (
            <div className="space-y-2 mt-2">
              <Skeleton className="h-4 w-full bg-purple-200/50 dark:bg-purple-800/30" />
              <Skeleton className="h-4 w-4/5 bg-purple-200/50 dark:bg-purple-800/30" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600/80 mt-1">Unable to generate insight right now.</p>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {insight}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
