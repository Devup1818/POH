'use client';

import { Menu } from 'lucide-react';
import { ShedSelector } from './shed-selector';
import { UserMenu } from './user-menu';
import { NotificationBell } from './notification-bell';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6',
        className,
      )}
    >
      {/* Left: hamburger (mobile) */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer on desktop */}
      <div className="hidden lg:block" />

      {/* Right: shed selector, notifications, user */}
      <div className="flex items-center gap-3">
        <ShedSelector />

        {/* Notification bell with real-time updates */}
        <NotificationBell />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
