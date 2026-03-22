'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpandableCard } from './expandable-card';
import { LogOut } from 'lucide-react';

export function AccountCard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Skeleton className="h-[80px] w-full rounded-xl" />;
  }

  const email = session?.user?.email ?? '';

  return (
    <ExpandableCard
      title="Account"
      description="Your account details"
      collapsed={
        <span className="text-sm text-zinc-400">{email}</span>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Email</label>
          <Input value={email} readOnly className="bg-zinc-800 border-zinc-700" />
        </div>
        <Separator className="bg-zinc-800" />
        <Button
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
          onClick={() => signOut({ callbackUrl: '/auth' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </ExpandableCard>
  );
}
