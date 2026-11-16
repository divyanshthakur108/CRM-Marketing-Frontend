import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageCircle, Zap, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MobileTabBarProps {
  onOpenMore: () => void;
  isMoreOpen?: boolean;
}

interface PrimaryTabItem {
  name: string;
  href: string;
  icon: React.ElementType;
  isActive: (pathname: string) => boolean;
}

const primaryTabs: PrimaryTabItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    isActive: (p) => p === '/dashboard' || p === '/app',
  },
  {
    name: 'CRM',
    href: '/leads',
    icon: Users,
    isActive: (p) => p.startsWith('/leads') || p.startsWith('/crm'),
  },
  {
    name: 'WhatsApp',
    href: '/whatsapp',
    icon: MessageCircle,
    isActive: (p) => p.startsWith('/whatsapp') || p.startsWith('/conversations'),
  },
  {
    name: 'Ads',
    href: '/campaigns',
    icon: Zap,
    isActive: (p) => p.startsWith('/campaigns') || p.startsWith('/ads'),
  },
];

export function MobileTabBar({ onOpenMore, isMoreOpen = false }: MobileTabBarProps) {
  const location = useLocation();

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-app-surface/95 backdrop-blur-md border-t border-app-border lg:hidden px-2 pt-1 pb-[max(8px,env(safe-area-inset-bottom))] shadow-card select-none"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {primaryTabs.map((tab) => {
          const active = tab.isActive(location.pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              to={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-control transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950',
                active ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform duration-150',
                  active ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'
                )}
              />
              <span className={cn('text-[11px] mt-1', active ? 'font-semibold' : 'font-medium')}>
                {tab.name}
              </span>
            </Link>
          );
        })}

        {/* 5th Action: "More" Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMore}
          aria-expanded={isMoreOpen}
          aria-label="More navigation options"
          className={cn(
            'flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-control transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 cursor-pointer',
            isMoreOpen ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'
          )}
        >
          <Menu className={cn('w-5 h-5', isMoreOpen ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]')} />
          <span className={cn('text-[11px] mt-1', isMoreOpen ? 'font-semibold' : 'font-medium')}>
            More
          </span>
        </button>
      </div>
    </nav>
  );
}

