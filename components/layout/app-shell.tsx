'use client';

import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/zip-codes': 'Zip Codes',
  '/properties': 'Properties',
  '/management': 'Management',
  '/favorites': 'Saved Properties',
  '/pipeline': 'Pipeline',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'Book of Business';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <MobileNav />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
