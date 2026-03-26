import type { Metadata } from 'next';
import { ApiKeyCard } from '@/components/settings/api-key-card';
import { TelegramBotCard } from '@/components/settings/telegram-bot-card';
import { AccountCard } from '@/components/settings/account-card';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 pt-16">
      <div className="flex flex-col gap-8">
        <ApiKeyCard />
        <TelegramBotCard />
        <AccountCard />
      </div>
    </div>
  );
}
