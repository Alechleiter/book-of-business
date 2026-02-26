'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Briefcase,
  Star,
  TrendingUp,
} from 'lucide-react';

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/zip-codes', label: 'Zip Codes', icon: MapPin },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/management', label: 'Management', icon: Briefcase },
  { href: '/favorites', label: 'Saved', icon: Star },
  { href: '/pipeline', label: 'Pipeline', icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 border-r bg-card flex-col flex-shrink-0">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            BB
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight truncate">Book of Business</h1>
            <p className="text-[10px] text-muted-foreground">CA Multi-Family Intel</p>
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
