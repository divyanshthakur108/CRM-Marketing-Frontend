import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useProjects } from '../hooks/useProjects';
import { useLeads } from '../hooks/useLeads';
import { useApprovals } from '../hooks/useApprovals';
import { usePlanItems } from '../hooks/usePlans';
import { useBudget } from '../hooks/useBudget';
import { useAnalyticsOverview } from '../hooks/useAnalytics';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency, formatDisplayDate, formatDisplayTime } from '../lib/formatters';
import {
  Building2,
  Calendar,
  CheckCircle,
  Users,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Share2,
  Layers,
  ArrowRight,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuthStore();

  // TanStack Query Hooks
  const {
    data: projects = [],
    isLoading: loadingProjects,
    refetch: refetchProjects,
  } = useProjects();

  const {
    data: leadsData,
    isLoading: loadingLeads,
    refetch: refetchLeads,
  } = useLeads();

  const {
    data: approvals = [],
    isLoading: loadingApprovals,
    refetch: refetchApprovals,
  } = useApprovals();

  const {
    data: planItems = [],
    isLoading: loadingPlans,
    refetch: refetchPlans,
  } = usePlanItems();

  const currentMonthParam = new Date().toISOString().slice(0, 7);
  const {
    data: budgetData,
    isLoading: loadingBudget,
    refetch: refetchBudget,
  } = useBudget(currentMonthParam);

  const {
    data: analyticsOverview,
    isLoading: loadingAnalytics,
    refetch: refetchAnalytics,
  } = useAnalyticsOverview('30D');

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProjects(),
      refetchLeads(),
      refetchApprovals(),
      refetchPlans(),
      refetchBudget(),
      refetchAnalytics(),
    ]);
    setIsRefreshing(false);
  };

  const isInitialLoading =
    loadingProjects || loadingLeads || loadingApprovals || loadingPlans;

  // Real Calculated Metrics
  const realProjectsCount = projects.length;
  const realScheduledPostsCount = planItems.length;
  const realPendingApprovalsCount = approvals.filter(
    (a) => a.status === 'In Review' || a.status === 'Needs Action'
  ).length;
  const realNewLeadsCount = leadsData?.pagination?.total || leadsData?.leads?.length || 0;

  // Budget calculations
  const totalBudgetCap = budgetData?.overallCap || 0;
  const totalSpent = analyticsOverview?.kpis?.totalSpend || 0;
  const remainingBudget = Math.max(0, totalBudgetCap - totalSpent);
  const pacingPercentage =
    totalBudgetCap > 0
      ? Math.min(100, Math.round((totalSpent / totalBudgetCap) * 100))
      : 0;

  // Real Upcoming Schedule Items
  const realUpcomingItems = planItems.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    property: item.projectName || 'Active Development',
    date: item.date,
    time: item.time,
    status: item.status,
    channel: item.format,
  }));

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Agency Dashboard"
        description={`Real-time overview of marketing campaigns, inventory catalog, and inbound leads for ${user?.organizationName || 'your workspace'}.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Link to="/projects/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                New Project
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Core Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Projects */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-meta font-medium uppercase tracking-wide text-text-muted">
              Total Projects
            </span>
            <div className="w-8 h-8 rounded-[6px] bg-neutral-100 flex items-center justify-center text-text-secondary">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isInitialLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-semibold text-text-primary tabular-nums">
                {realProjectsCount}
              </div>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-meta">
              <span className="text-text-muted">Inventory Catalog</span>
              <Link
                to="/projects"
                className="font-medium text-text-secondary hover:text-text-primary inline-flex items-center gap-1 transition-colors"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Metric 2: Scheduled Posts */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-meta font-medium uppercase tracking-wide text-text-muted">
              Scheduled Posts
            </span>
            <div className="w-8 h-8 rounded-[6px] bg-neutral-100 flex items-center justify-center text-text-secondary">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isInitialLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-semibold text-text-primary tabular-nums">
                {realScheduledPostsCount}
              </div>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-meta">
              <span className="text-text-muted">Marketing Calendar</span>
              <Link
                to="/calendar"
                className="font-medium text-text-secondary hover:text-text-primary inline-flex items-center gap-1 transition-colors"
              >
                <span>Calendar</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Metric 3: Pending Approvals */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-meta font-medium uppercase tracking-wide text-text-muted">
              Pending Approvals
            </span>
            <div className="w-8 h-8 rounded-[6px] bg-neutral-100 flex items-center justify-center text-text-secondary">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isInitialLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-semibold text-text-primary tabular-nums">
                {realPendingApprovalsCount}
              </div>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-meta">
              <span className="text-text-muted">Creative Review</span>
              <Link
                to="/approvals"
                className="font-medium text-text-secondary hover:text-text-primary inline-flex items-center gap-1 transition-colors"
              >
                <span>Review</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Metric 4: Inbound Leads */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-meta font-medium uppercase tracking-wide text-text-muted">
              Inbound Leads
            </span>
            <div className="w-8 h-8 rounded-[6px] bg-neutral-100 flex items-center justify-center text-text-secondary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isInitialLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-semibold text-text-primary tabular-nums">
                {realNewLeadsCount}
              </div>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-meta">
              <span className="text-text-muted">Active Pipeline</span>
              <Link
                to="/leads"
                className="font-medium text-text-secondary hover:text-text-primary inline-flex items-center gap-1 transition-colors"
              >
                <span>Pipeline</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Main Content Grid: Upcoming Items + Budget Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Items List (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-section font-semibold text-text-primary flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-secondary" />
                  <span>Upcoming Items &amp; Publishing Schedule</span>
                </h3>
                <p className="text-meta text-text-secondary mt-0.5">
                  Confirmed visits, scheduled flights, and creative review milestones.
                </p>
              </div>

              <Link to="/calendar">
                <Button variant="outline" size="sm">
                  Calendar
                </Button>
              </Link>
            </div>

            <div className="pt-4">
              {loadingPlans ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : realUpcomingItems.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="w-10 h-10 text-text-muted" />}
                  title="No Upcoming Items"
                  description="No posts or events are currently scheduled for this workspace. Use the Marketing Calendar to plan your campaigns."
                  actionLabel="Schedule First Item"
                  onAction={() => window.location.assign('/calendar')}
                />
              ) : (
                <div className="divide-y divide-border">
                  {realUpcomingItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between hover:bg-surface-hover px-2 rounded-[8px] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-[6px] bg-neutral-100 text-text-secondary flex items-center justify-center shrink-0">
                          <Share2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-text-primary">{item.title}</h4>
                          <p className="text-meta text-text-muted mt-0.5 tabular-nums">
                            {item.property} &bull; {formatDisplayDate(item.date)} at {formatDisplayTime(item.time)}
                          </p>
                        </div>
                      </div>

                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Budget Summary & Pacing Card (1 col) */}
        <div>
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-section font-semibold text-text-primary">
                  Budget Pacing
                </h3>
                <p className="text-meta text-text-secondary mt-0.5">
                  Monthly marketing allocation
                </p>
              </div>
              <Link to="/budget" className="text-text-muted hover:text-text-primary">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="pt-4 space-y-5">
              {loadingBudget || loadingAnalytics ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : totalBudgetCap === 0 ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-[8px] bg-neutral-100 text-text-muted flex items-center justify-center mx-auto mb-2">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-medium text-text-primary">No Budget Configured</h4>
                  <p className="text-meta text-text-secondary mt-1">
                    No active marketing budget configured for this month.
                  </p>
                  <Link to="/budget" className="inline-block mt-3">
                    <Button variant="outline" size="sm">
                      Set Up Budget
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-baseline justify-between tabular-nums">
                      <span className="text-xl font-semibold text-text-primary">
                        {formatCurrency(totalSpent)}
                      </span>
                      <span className="text-meta text-text-muted">
                        of {formatCurrency(totalBudgetCap)}
                      </span>
                    </div>

                    {/* Progress Bar (Monochrome) */}
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-border mt-2">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${pacingPercentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-meta text-text-secondary mt-1.5 tabular-nums">
                      <span>{pacingPercentage}% Deployed</span>
                      <span>{formatCurrency(remainingBudget)} Left</span>
                    </div>
                  </div>

                  {/* Project Allocations */}
                  <div className="space-y-2.5 border-t border-border pt-4">
                    <p className="text-meta font-medium uppercase tracking-wide text-text-muted">
                      Project Allocations
                    </p>

                    {budgetData?.allocations && budgetData.allocations.length > 0 ? (
                      budgetData.allocations.map((alloc) => {
                        const pct =
                          totalBudgetCap > 0
                            ? Math.round((alloc.allocatedAmount / totalBudgetCap) * 100)
                            : 0;
                        return (
                          <div key={alloc.projectId} className="space-y-1">
                            <div className="flex items-center justify-between text-meta">
                              <span className="text-text-primary">{alloc.projectName}</span>
                              <span className="font-medium text-text-primary tabular-nums">
                                {formatCurrency(alloc.allocatedAmount)}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-neutral-800 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-meta text-text-muted py-1">
                        No project allocations assigned this month.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
