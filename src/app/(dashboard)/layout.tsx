'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Receipt,
  LayoutDashboard,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/investments', label: 'Investments', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ pathname, email }: { pathname: string; email?: string }) {
  return (
    <>
      <div className="p-6">
        <h2 className="text-xl font-semibold tracking-tight">Finance</h2>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4 space-y-3">
        {email && (
          <p className="text-xs text-zinc-500 truncate px-1">{email}</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30"
          onClick={() => signOut({ callbackUrl: '/auth' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[240px] flex-col border-r border-zinc-800 bg-zinc-900/50">
        <SidebarContent pathname={pathname} email={session?.user?.email ?? undefined} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[240px] h-full flex flex-col bg-zinc-900 border-r border-zinc-800">
            <button
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent pathname={pathname} email={session?.user?.email ?? undefined} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
          <button onClick={() => setMobileOpen(true)} className="text-zinc-400 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">Finance</h2>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
