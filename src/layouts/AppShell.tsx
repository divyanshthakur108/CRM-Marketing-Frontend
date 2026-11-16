import { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { MobileDrawer } from '../components/layout/MobileDrawer';
import { MobileTabBar } from '../components/layout/MobileTabBar';
import { ShieldAlert } from 'lucide-react';

const SIDEBAR_STORAGE_KEY = 'realcrm_sidebar_collapsed';

export function AppShell() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  // Desktop sidebar collapsed state (persisted to localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage quota errors
      }
      return next;
    });
  };

  // Mobile drawer state (<1024px)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Impersonation detection (sessionStorage or auth state)
  const [impersonatingUser, setImpersonatingUser] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('realcrm_impersonating_user');
    } catch {
      return null;
    }
  });

  const handleStopImpersonation = () => {
    try {
      sessionStorage.removeItem('realcrm_impersonating_user');
    } catch {
      // Ignore
    }
    setImpersonatingUser(null);
    window.location.reload();
  };

  // Unread notifications polling (every 15s)
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
    setIsMobileDrawerOpen(false);
    await logout();
    navigate('/login');
  };

  // Close mobile drawer when resizing up to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setIsMobileDrawerOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen w-full bg-app-bg text-ink flex flex-col relative selection:bg-brand-primary-soft selection:text-brand-primary font-sans antialiased">
      {/* Accessibility: Skip to main content landmark */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-control focus:shadow-modal focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary text-small-text font-semibold"
      >
        Skip to main content
      </a>

      {/* Impersonation Warning Banner (if active) */}
      {impersonatingUser && (
        <aside
          role="alert"
          aria-label="Account Impersonation Warning"
          className="bg-feedback-warning-soft border-b border-feedback-warning/30 text-feedback-warning-text px-4 py-2 text-caption-text font-medium flex items-center justify-between sticky top-0 z-50 shadow-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 shrink-0 text-feedback-warning-icon" />
            <span className="truncate">
              <strong>Admin Mode:</strong> You are currently viewing workspace as{' '}
              <span className="font-semibold">{impersonatingUser}</span>.
            </span>
          </div>
          <button
            type="button"
            onClick={handleStopImpersonation}
            className="ml-3 px-2 py-1 bg-app-surface border border-feedback-warning/40 hover:bg-app-surface-muted text-ink rounded-control text-caption-text font-semibold shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            Exit impersonation
          </button>
        </aside>
      )}

      <div className="flex-1 flex w-full relative">
        {/* 1. Desktop Left Sidebar (>=1024px) */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          unreadCount={unreadCount}
          onLogout={handleLogout}
        />

        {/* 2. Main Content Canvas */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-150 ease-in-out">
          {/* Topbar Navigation (Desktop & Mobile) */}
          <Topbar
            unreadCount={unreadCount}
            onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebarCollapse={toggleSidebarCollapse}
          />

          {/* Main App Page Content */}
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 w-full max-w-[1600px] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 pb-24 lg:pb-8 overflow-x-hidden focus:outline-none"
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* 3. Mobile Slide-Over Drawer (<1024px) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        unreadCount={unreadCount}
        onLogout={handleLogout}
      />

      {/* 4. Mobile Bottom Tab Bar (<1024px) */}
      <MobileTabBar
        onOpenMore={() => setIsMobileDrawerOpen(true)}
        isMoreOpen={isMobileDrawerOpen}
      />
    </div>
  );
}
