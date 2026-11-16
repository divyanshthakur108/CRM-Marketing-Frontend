import { useState, useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useProjects } from '../hooks/useProjects';
import { useLeads } from '../hooks/useLeads';
import { useApprovals } from '../hooks/useApprovals';
import { usePlanItems } from '../hooks/usePlans';
import { useBudget } from '../hooks/useBudget';
import {
  useAnalyticsOverview,
  useAnalyticsCampaigns,
  useAnalyticsLeads,
} from '../hooks/useAnalytics';
import { useAppointments } from '../hooks/useAppointments';
import { useConversations } from '../hooks/useConversations';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { MinimalStatCard } from '../components/dashboard/MinimalStatCard';
import { LeadTimeseriesChart } from '../components/dashboard/LeadTimeseriesChart';
import { LeadSourceDonut } from '../components/dashboard/LeadSourceDonut';
import { LeadPipelineFunnel } from '../components/dashboard/LeadPipelineFunnel';
import { NeedsAttentionWidget } from '../components/dashboard/NeedsAttentionWidget';
import { AgendaWidget } from '../components/dashboard/AgendaWidget';
import { BudgetPacingWidget } from '../components/dashboard/BudgetPacingWidget';
import { RecentLeadsWidget } from '../components/dashboard/RecentLeadsWidget';
import { CampaignSummaryWidget } from '../components/dashboard/CampaignSummaryWidget';
import { PropertyCatalogWidget } from '../components/dashboard/PropertyCatalogWidget';
import { formatCurrency } from '../lib/formatters';
import { Users, CalendarCheck, Wallet, CheckSquare, RefreshCw } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuthStore();
  const [selectedRange, setSelectedRange] = useState<'7D' | '30D' | '90D'>('30D');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // TanStack Query Hooks (Real Data Sources)
  const { data: projects = [], isLoading: loadingProjects, refetch: refetchProjects } = useProjects();
  const {
    data: leadsData,
    isLoading: loadingLeads,
    refetch: refetchLeads,
  } = useLeads();
  const {
    data: approvals = [],
    isLoading: loadingApprovals,
    isError: isErrorApprovals,
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
    isError: isErrorBudget,
    refetch: refetchBudget,
  } = useBudget(currentMonthParam);

  const {
    data: analyticsOverview,
    isLoading: loadingAnalytics,
    refetch: refetchAnalytics,
  } = useAnalyticsOverview(selectedRange);

  // Lead Attribution & Conversion Analytics
  const {
    data: analyticsLeads,
    isLoading: loadingAnalyticsLeads,
    refetch: refetchAnalyticsLeads,
  } = useAnalyticsLeads();

  // Current month analytics specifically for monthly budget pacing & cap comparison
  const {
    data: monthlyAnalytics,
    isLoading: loadingMonthlyAnalytics,
    isError: isErrorMonthlyAnalytics,
    refetch: refetchMonthlyAnalytics,
  } = useAnalyticsOverview('30D');

  const {
    data: appointmentsData,
    isLoading: loadingAppointments,
    refetch: refetchAppointments,
  } = useAppointments();

  const {
    data: campaignAnalyticsData = [],
    isLoading: loadingCampaigns,
    isError: isErrorCampaigns,
    refetch: refetchCampaigns,
  } = useAnalyticsCampaigns();

  const {
    data: conversationsData,
    isLoading: loadingConversations,
    refetch: refetchConversations,
  } = useConversations();

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProjects(),
      refetchLeads(),
      refetchApprovals(),
      refetchPlans(),
      refetchBudget(),
      refetchAnalytics(),
      refetchAnalyticsLeads(),
      refetchMonthlyAnalytics(),
      refetchAppointments(),
      refetchCampaigns(),
      refetchConversations(),
    ]);
    setIsRefreshing(false);
  };

  // Real Calculated Metrics
  const totalLeadsCount = leadsData?.pagination?.total ?? leadsData?.leads?.length ?? 0;
  const scheduledVisitsCount =
    appointmentsData?.scheduledCount ??
    (appointmentsData?.appointments?.filter((a) => a.status === 'Scheduled').length || 0);

  const monthlySpent = monthlyAnalytics?.kpis?.totalSpend || 0;
  const totalBudgetCap = budgetData?.overallCap || 0;
  const pendingApprovalsCount = approvals.filter(
    (a) => a.status === 'In Review' || a.status === 'Needs Action'
  ).length;

  const urgentHandoffsCount = conversationsData?.handoffCount || 0;

  // Real Sparkline points derived from analytics timeseries
  const leadsSparkline = useMemo(() => {
    if (!analyticsOverview?.timeseries?.length) return undefined;
    return analyticsOverview.timeseries.map((pt) => pt.leads);
  }, [analyticsOverview]);

  const spendSparkline = useMemo(() => {
    if (!analyticsOverview?.timeseries?.length) return undefined;
    return analyticsOverview.timeseries.map((pt) => pt.spend);
  }, [analyticsOverview]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Utility Bar: Refresh & Live Timestamp */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-[#64748B]">
          <span>Dashboard Overview</span>
          <span className="mx-2 text-slate-300">•</span>
          <span>{new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}</span>
        </div>

        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
          title="Refresh real-time telemetry from all connected sources"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh All'}</span>
        </button>
      </div>

      {/* SECTION 1: Premium Welcome Banner */}
      <WelcomeBanner user={user} />

      {/* SECTION 2: Four Premium KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Inbound Leads */}
        <MinimalStatCard
          label="Total Inbound Leads"
          value={totalLeadsCount}
          tone="emerald"
          icon={<Users className="w-5 h-5 stroke-[2.2]" />}
          helperText={
            analyticsOverview?.kpis
              ? `${selectedRange}: ${analyticsOverview.kpis.totalLeads} in window • ${projects.length} projects`
              : `${projects.length} property catalog projects`
          }
          sparklineData={leadsSparkline}
          isLoading={loadingLeads}
        />

        {/* Metric 2: Confirmed Site Visits */}
        <MinimalStatCard
          label="Confirmed Site Visits"
          value={scheduledVisitsCount}
          tone="amber"
          icon={<CalendarCheck className="w-5 h-5 stroke-[2.2]" />}
          helperText="Scheduled buyer walk-throughs"
          isLoading={loadingAppointments}
        />

        {/* Metric 3: Monthly Ad Spend */}
        <MinimalStatCard
          label="Monthly Ad Spend"
          value={formatCurrency(monthlySpent)}
          tone="purple"
          icon={<Wallet className="w-5 h-5 stroke-[2.2]" />}
          helperText={
            totalBudgetCap > 0
              ? `of ${formatCurrency(totalBudgetCap)} monthly cap`
              : 'Current month • No cap set'
          }
          sparklineData={spendSparkline}
          isLoading={loadingBudget || loadingMonthlyAnalytics}
        />

        {/* Metric 4: Pending Creative Approvals */}
        <MinimalStatCard
          label="Pending Approvals"
          value={pendingApprovalsCount}
          tone="rose"
          icon={<CheckSquare className="w-5 h-5 stroke-[2.2]" />}
          helperText={
            pendingApprovalsCount === 0
              ? 'All marketing assets approved'
              : `${pendingApprovalsCount} creatives awaiting review`
          }
          isLoading={loadingApprovals}
        />
      </div>

      {/* SECTION 3: Property Catalog & Inventory Showcase */}
      <PropertyCatalogWidget
        projects={projects}
        isLoading={loadingProjects}
      />

      {/* SECTION 4: Performance Area Chart (8 cols) + Lead Source Donut (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <LeadTimeseriesChart
            timeseries={analyticsOverview?.timeseries}
            kpis={analyticsOverview?.kpis}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            isLoading={loadingAnalytics}
          />
        </div>

        <div className="lg:col-span-4">
          <LeadSourceDonut
            sourceAttribution={analyticsLeads?.sourceAttribution}
            isLoading={loadingAnalyticsLeads}
          />
        </div>
      </div>

      {/* SECTION 4: Pipeline Funnel (8 cols) + Needs Attention (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <LeadPipelineFunnel
            stageCounts={leadsData?.stageCounts}
            totalLeads={totalLeadsCount}
            isLoading={loadingLeads}
            onRetry={refetchLeads}
          />
        </div>

        <div className="lg:col-span-4">
          <NeedsAttentionWidget
            pendingApprovals={approvals}
            urgentHandoffsCount={urgentHandoffsCount}
            isLoading={loadingApprovals || loadingConversations}
            isError={isErrorApprovals}
          />
        </div>
      </div>

      {/* SECTION 5: Today's Agenda (6 cols) + Budget Pacing (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <AgendaWidget
            appointments={appointmentsData?.appointments}
            planItems={planItems}
            isLoading={loadingAppointments || loadingPlans}
          />
        </div>

        <div className="lg:col-span-6">
          <BudgetPacingWidget
            budgetData={budgetData}
            totalSpent={monthlySpent}
            isLoading={loadingBudget || loadingMonthlyAnalytics || loadingAnalytics}
            isError={isErrorBudget || isErrorMonthlyAnalytics}
          />
        </div>
      </div>

      {/* SECTION 6: Recent Leads (8 cols) + Campaign Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <RecentLeadsWidget
            leads={leadsData?.leads}
            isLoading={loadingLeads}
          />
        </div>

        <div className="lg:col-span-4">
          <CampaignSummaryWidget
            campaigns={campaignAnalyticsData}
            isLoading={loadingCampaigns}
            isError={isErrorCampaigns}
          />
        </div>
      </div>
    </div>
  );
}
