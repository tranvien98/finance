'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpandableCard } from './expandable-card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function ApiKeyCard() {
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealTimer, setRevealTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setHasKey(data.hasOpenrouterKey);
        setMaskedKey(data.maskedOpenrouterKey);
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

  useEffect(() => {
    return () => {
      if (revealTimer) clearTimeout(revealTimer);
    };
  }, [revealTimer]);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      // Step 1: Validate
      const validateRes = await fetch('/api/settings/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const validateData = await validateRes.json();

      if (!validateData.valid) {
        setMessage({
          type: 'error',
          text: validateData.error || 'Invalid API key — check your OpenRouter credentials.',
        });
        setSaving(false);
        return;
      }

      // Step 2: Save
      const saveRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openrouterKey: apiKey }),
      });
      const saveData = await saveRes.json();

      if (saveRes.ok) {
        setHasKey(true);
        setMaskedKey(saveData.maskedOpenrouterKey);
        setApiKey('');
        setMessage({ type: 'success', text: 'API key validated and saved.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save API key.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach OpenRouter. Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleReveal = () => {
    if (revealTimer) clearTimeout(revealTimer);

    if (!revealed) {
      setRevealed(true);
      const timer = setTimeout(() => setRevealed(false), 30000);
      setRevealTimer(timer);
    } else {
      setRevealed(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-[80px] w-full rounded-xl" />;
  }

  return (
    <ExpandableCard
      title="API Keys"
      description="Manage your OpenRouter API key"
      collapsed={
        hasKey && maskedKey ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">OpenRouter API Key</span>
            <Badge variant="secondary">{maskedKey}</Badge>
          </div>
        ) : (
          <Badge variant="secondary" className="text-zinc-500">No API key saved</Badge>
        )
      }
    >
      <div className="space-y-4">
        {hasKey && maskedKey && (
          <div className="flex items-center gap-2">
            <Input
              value={revealed ? maskedKey : '••••••••••••••••'}
              readOnly
              className="flex-1 bg-zinc-800 border-zinc-700"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleReveal}
              className="shrink-0"
            >
              {revealed ? (
                <EyeOff className="h-4 w-4 text-purple-400" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="ml-1.5 text-sm">{revealed ? 'Hide' : 'Reveal'}</span>
            </Button>
          </div>
        )}
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="sk-or-v1-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-zinc-800 border-zinc-700"
          />
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {message.text}
            </p>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Save API key'
            )}
          </Button>
        </div>
      </div>
    </ExpandableCard>
  );
}
