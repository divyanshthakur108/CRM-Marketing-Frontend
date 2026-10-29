import { useState, useRef, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  LayoutGrid,
  Sparkles,
  Zap,
  Users,
  MessageCircle,
  Grid,
  User,
  LogOut,
  LogIn,
  Settings,
  Shield,
  Bell,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  isActive: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    isActive: (p) => p === '/dashboard' || p === '/',
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    isActive: (p) => p.startsWith('/calendar') || p.startsWith('/planner'),
  },
  {
    name: 'Catalog',
    href: '/projects',
    icon: LayoutGrid,
    isActive: (p) =>
      p.startsWith('/projects') ||
      p.startsWith('/catalog') ||
      p.startsWith('/properties'),
  },
  {
    name: 'Creation',
    href: '/studio',
    icon: Sparkles,
    isActive: (p) =>
      p.startsWith('/studio') ||
      p.startsWith('/creative-studio') ||
      p.startsWith('/captions'),
  },
  {
    name: 'Ads',
    href: '/campaigns',
    icon: Zap,
    isActive: (p) =>
      p.startsWith('/campaigns') ||
      p.startsWith('/connections') ||
      p.startsWith('/ads'),
  },
  {
    name: 'CRM',
    href: '/leads',
    icon: Users,
    isActive: (p) =>
      p.startsWith('/leads') ||
      p.startsWith('/appointments') ||
      p.startsWith('/crm'),
  },
  {
    name: 'WhatsApp',
    href: '/whatsapp',
    icon: MessageCircle,
    isActive: (p) =>
      p.startsWith('/conversations') ||
      p.startsWith('/whatsapp'),
  },
  {
    name: 'Assets',
    href: '/assets',
    icon: Grid,
    isActive: (p) =>
      p.startsWith('/assets') ||
      p.startsWith('/media'),
  },
  {
    name: 'Profile',
    href: '/settings',
    icon: User,
    isActive: (p) =>
      p.startsWith('/settings') ||
      p.startsWith('/team') ||
      p.startsWith('/branding') ||
      p.startsWith('/audience') ||
      p.startsWith('/budget') ||
      p.startsWith('/admin') ||
      p.startsWith('/profile'),
  },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Unread notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; data: Array<{ id: string; read?: boolean }> }>('/notifications');
        return res.data.data || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 15000,
  });

  const unreadCount = useMemo(() => {
    if (!notificationsData) return 0;
    return notificationsData.filter((n) => !n.read).length;
  }, [notificationsData]);

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-[#0A0A0A] flex relative selection:bg-neutral-200 selection:text-black">
      {/* 1. Desktop Left Sidebar Navigation (>=1024px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-[#E5E5E5] z-30 justify-between select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[8px] bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-sm tracking-wider shrink-0 shadow-xs">
              RC
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[14px] font-semibold text-[#0A0A0A] truncate">
                RealCRM
              </h2>
              <p className="text-[12px] text-[#737373] truncate">
                {user?.organizationName || 'Workspace'}
              </p>
            </div>
          </div>

          {/* Desktop Notification Bell */}
          <Link
            to="/notifications"
            className="relative p-1.5 text-[#525252] hover:text-[#0A0A0A] rounded-[8px] hover:bg-[#F5F5F5] transition-colors shrink-0"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B91C1C] text-white text-[11px] font-semibold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav aria-label="Desktop Sidebar" className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.isActive(location.pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3.5 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]',
                  active
                    ? 'bg-[#0A0A0A] text-white shadow-xs font-semibold'
                    : 'text-[#525252] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-white' : 'text-[#737373]')} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: User Profile & Logout */}
        <div className="p-3 border-t border-[#E5E5E5] space-y-2">
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-[#F5F5F5] text-[#0A0A0A] border border-[#E5E5E5] flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[13px] font-semibold text-[#0A0A0A] truncate leading-tight">
                {user?.name || 'Authorized Member'}
              </p>
              <p className="text-[12px] text-[#737373] truncate">
                {user?.email || 'user@realcrm.in'}
              </p>
            </div>
          </div>

          <div className="pt-1">
            {isAuthenticated || user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-[12px] font-medium text-[#B91C1C] hover:bg-[#FEF2F2] hover:text-[#B91C1C] rounded-[8px] transition-colors cursor-pointer border border-[#FECACA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-[12px] font-medium text-[#0A0A0A] bg-[#F5F5F5] hover:bg-neutral-200 rounded-[8px] transition-colors border border-[#E5E5E5]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <div className="flex-1 w-full min-w-0 lg:pl-60 flex flex-col">
        {/* Mobile Top Header (<1024px) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E5E5E5] sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0">
              RC
            </div>
            <span className="text-[14px] font-semibold text-[#0A0A0A]">
              RealCRM
            </span>
          </div>

          <Link
            to="/notifications"
            className="relative p-1.5 text-[#525252] hover:text-[#0A0A0A] rounded-[8px] transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B91C1C] text-white text-[11px] font-semibold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </header>

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* 3. Mobile Profile Popover Menu (ONLY <1024px) */}
      {isProfileMenuOpen && (
        <div
          ref={profileMenuRef}
          className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-72 bg-white border border-[#E5E5E5] rounded-[10px] shadow-dialog p-4 animate-in fade-in zoom-in-95 duration-150 lg:hidden"
        >
          {/* User Details */}
          <div className="flex items-center space-x-3 pb-3 border-b border-[#E5E5E5]">
            <div className="w-9 h-9 rounded-full bg-[#F5F5F5] text-[#0A0A0A] flex items-center justify-center font-semibold text-xs shrink-0 border border-[#E5E5E5]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[14px] font-semibold text-[#0A0A0A] truncate">
                {user?.name || 'Authorized Member'}
              </h4>
              <p className="text-[12px] text-[#737373] truncate">
                {user?.email || 'user@realcrm.in'}
              </p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[11px] font-medium text-[#525252] bg-[#F5F5F5] px-2 py-0.5 rounded-[4px] capitalize">
                  {user?.role || 'Member'}
                </span>
                <span className="text-[12px] text-[#737373] truncate">
                  • {user?.organizationName || 'GDPL'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="py-2 space-y-1">
            <Link
              to="/settings"
              onClick={() => setIsProfileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-black rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4 text-neutral-400" />
              <span>Workspace Settings</span>
            </Link>

            <Link
              to="/team"
              onClick={() => setIsProfileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-black rounded-xl transition-colors"
            >
              <Users className="w-4 h-4 text-neutral-400" />
              <span>Team &amp; Roles</span>
            </Link>

            {(user?.isPlatformAdmin || user?.role === 'platform_admin') && (
              <Link
                to="/admin/organizations"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-black rounded-xl transition-colors"
              >
                <Shield className="w-4 h-4 text-neutral-400" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          {/* Logout Action */}
          <div className="pt-2 border-t border-neutral-100">
            {isAuthenticated || user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors cursor-pointer border border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsProfileMenuOpen(false)}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-black bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 4. Bottom Tab Bar (ONLY below 1024px: lg:hidden) */}
      <nav
        aria-label="Mobile Bottom Navigation Dock"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-[#E5E5E5] rounded-full px-2 sm:px-4 py-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] flex items-center space-x-0.5 sm:space-x-1 max-w-[96vw] overflow-x-auto scrollbar-none lg:hidden"
      >
        {navItems.map((item) => {
          const active = item.isActive(location.pathname);
          const Icon = item.icon;
          const isProfile = item.name === 'Profile';

          if (isProfile) {
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                title="Profile, Settings & Sign Out"
                className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[58px] py-0.5 select-none transition-transform active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] rounded-xl cursor-pointer"
              >
                <div
                  className={cn(
                    'flex items-center justify-center transition-all duration-150',
                    active || isProfileMenuOpen
                      ? 'bg-[#0A0A0A] text-white px-3 py-1 rounded-[8px] shadow-xs'
                      : 'px-3 py-1 text-[#737373] group-hover:text-[#0A0A0A]'
                  )}
                >
                  <Icon className={cn('w-4 h-4 stroke-[1.8]', (active || isProfileMenuOpen) && 'stroke-[2.2]')} />
                </div>
                <span
                  className={cn(
                    'text-[12px] transition-colors mt-0.5',
                    active || isProfileMenuOpen ? 'font-semibold text-[#0A0A0A]' : 'font-medium text-[#737373] group-hover:text-[#0A0A0A]'
                  )}
                >
                  {item.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsProfileMenuOpen(false)}
              className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[58px] py-0.5 select-none transition-transform active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] rounded-xl"
            >
              <div
                className={cn(
                  'flex items-center justify-center transition-all duration-150',
                  active
                    ? 'bg-[#0A0A0A] text-white px-3 py-1 rounded-[8px] shadow-xs'
                    : 'px-3 py-1 text-[#737373] group-hover:text-[#0A0A0A]'
                )}
              >
                <Icon className={cn('w-4 h-4 stroke-[1.8]', active && 'stroke-[2.2]')} />
              </div>
              <span
                className={cn(
                  'text-[12px] transition-colors mt-0.5',
                  active ? 'font-semibold text-[#0A0A0A]' : 'font-medium text-[#737373] group-hover:text-[#0A0A0A]'
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
