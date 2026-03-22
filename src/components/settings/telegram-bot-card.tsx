'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpandableCard } from './expandable-card';
import { Loader2 } from 'lucide-react';

export function TelegramBotCard() {
  const [hasToken, setHasToken] = useState(false);
  const [hasWebhook, setHasWebhook] = useState(false);
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
        setHasWebhook(data.hasTelegramWebhook ?? false);
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
      // Step 1: Save the encrypted token
      const saveRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramBotToken: token }),
      });

      if (!saveRes.ok) {
        setMessage({ type: 'error', text: 'Failed to save bot token.' });
        return;
      }

      // Step 2: Register webhook with Telegram
      const regRes = await fetch('/api/telegram/register', {
        method: 'POST',
      });

      if (regRes.ok) {
        setHasToken(true);
        setHasWebhook(true);
        setToken('');
        setMessage({ type: 'success', text: 'Bot token saved and webhook registered.' });
      } else {
        const data = await regRes.json();
        setHasToken(true);
        setHasWebhook(false);
        setToken('');
        setMessage({
          type: 'error',
          text: `Token saved but webhook registration failed: ${data.error || 'Unknown error'}. You can retry by saving again.`,
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = () => {
    if (hasToken && hasWebhook) {
      return <span className="text-green-600">Connected</span>;
    }
    if (hasToken) {
      return <span className="text-yellow-600">Token saved</span>;
    }
    return <span className="text-gray-400">Not configured</span>;
  };

  if (loading) {
    return <Skeleton className="h-[80px] w-full rounded-xl" />;
  }

  return (
    <ExpandableCard
      title="Telegram Bot"
      description="Connect your Telegram bot for expense logging"
      collapsed={
        <span className="text-sm text-gray-500">
          Bot Token: {statusBadge()}
        </span>
      }
    >
      <div className="space-y-3">
        <Input
          type="password"
          placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="bg-gray-50 border-gray-200"
        />
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
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
            'Save & Connect'
          )}
        </Button>
      </div>
    </ExpandableCard>
  );
}
