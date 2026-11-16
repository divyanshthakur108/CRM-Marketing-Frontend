import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { UserPlus, Plus, CalendarPlus, RefreshCw } from 'lucide-react';
import { AuthUser } from '../../store/useAuthStore';

export interface DashboardHeaderProps {
  user: AuthUser | null;
  selectedRange: '7D' | '30D' | '90D';
  onRangeChange: (range: '7D' | '30D' | '90D') => void;
  isRefreshing: boolean;
  onRefreshAll: () => Promise<void>;
}

export function DashboardHeader({
  user,
  selectedRange,
  onRangeChange,
  isRefreshing,
  onRefreshAll,
}: DashboardHeaderProps) {
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="w-full bg-app-surface border border-app-border rounded-card p-5 sm:p-6 shadow-card transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Greeting and Date */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-title-page font-semibold text-ink tracking-tight">
              {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Partner'}
            </h1>
          </div>
          <p className="text-small-text text-ink-muted">
            {todayFormatted} &bull; {user?.organizationName || 'Workspace'} Overview
          </p>
        </div>

        {/* Right: Date Range Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Real Analytics Date-Range Selector */}
          <div
            role="group"
            aria-label="Analytics date range selector"
            className="inline-flex rounded-control border border-app-border-control bg-app-surface p-0.5 text-caption-text"
          >
            {(['7D', '30D', '90D'] as const).map((range) => {
              const isSelected = selectedRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => onRangeChange(range)}
                  aria-pressed={isSelected}
                  className={`px-2.5 py-1 font-medium rounded-[6px] transition-colors ${
                    isSelected
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-ink-muted hover:text-ink hover:bg-app-surface-muted'
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>

          {/* Sync Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshAll}
            disabled={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh dashboard metrics"
          >
            Refresh
          </Button>

          {/* Quick Action: New Lead */}
          <Link to="/leads">
            <Button variant="secondary" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
              Add Lead
            </Button>
          </Link>

          {/* Quick Action: Schedule Visit */}
          <Link to="/appointments">
            <Button variant="secondary" size="sm" leftIcon={<CalendarPlus className="w-3.5 h-3.5" />}>
              Schedule Visit
            </Button>
          </Link>

          {/* Quick Action: New Campaign */}
          <Link to="/campaigns">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              New Campaign
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

