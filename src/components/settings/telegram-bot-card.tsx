'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpandableCard } from './expandable-card';
import { Loader2 } from 'lucide-react';

export function TelegramBotCard() {
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setHasToken(data.hasTelegramBotToken);
      }
    } catch {
      // silent fail on load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!token.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramBotToken: token }),
      });

      if (res.ok) {
        setHasToken(true);
        setToken('');
        setMessage({ type: 'success', text: 'Bot token saved.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save bot token.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-[80px] w-full rounded-xl" />;
  }

  return (
    <ExpandableCard
      title="Telegram Bot"
      description="Connect your Telegram bot for expense logging"
      collapsed={
        <span className="text-sm text-zinc-400">
          Bot Token: {hasToken ? (
            <span className="text-green-500">Configured</span>
          ) : (
            <span className="text-zinc-500">Not configured</span>
          )}
        </span>
      }
    >
      <div className="space-y-3">
        <Input
          type="password"
          placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="bg-zinc-800 border-zinc-700"
        />
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || !token.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save token'
          )}
        </Button>
      </div>
    </ExpandableCard>
  );
}
