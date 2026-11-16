import { useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { formatCurrency } from '../lib/formatters';
import {
  useAnalyticsOverview,
  useAnalyticsCampaigns,
  useAnalyticsContent,
  useAnalyticsLeads,
  useSyncAnalytics,
  AnalyticsTimeseriesPoint,
} from '../hooks/useAnalytics';
import {
  BarChart3,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Wallet,
  Users,
  RotateCw,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  Target,
  Share2,
} from 'lucide-react';

type MetricFocus = 'leads' | 'spend' | 'cpl';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AnalyticsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AnalyticsPage caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center space-y-4 my-8">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-rose-900">Analytics Telemetry Error</h2>
          <p className="text-xs text-rose-700 max-w-lg mx-auto">
            {this.state.error?.message ||
              'A rendering issue occurred while visualizing performance analytics.'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-all cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Reload Analytics Dashboard</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AnalyticsPageInternal() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '90D'>('30D');
  const [metricFocus, setMetricFocus] = useState<MetricFocus>('leads');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // TanStack Query Hooks (Real Data Sources)
  const {
    data: overviewData,
    isLoading: isLoadingOverview,
    isError: isErrorOverview,
    refetch: refetchOverview,
  } = useAnalyticsOverview(dateRange);

  const {
    data: campaignsData,
    isLoading: isLoadingCampaigns,
    refetch: refetchCampaigns,
  } = useAnalyticsCampaigns();

  const {
    data: contentData,
    isLoading: isLoadingContent,
    refetch: refetchContent,
  } = useAnalyticsContent();

  const {
    data: leadsData,
    isLoading: isLoadingLeads,
    refetch: refetchLeads,
  } = useAnalyticsLeads();

  const syncMutation = useSyncAnalytics();

  // Unified Refresh Action (Refetches backend cached queries)
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refetchOverview(),
        refetchCampaigns(),
        refetchContent(),
        refetchLeads(),
      ]);
      toast({
        title: 'Analytics Refreshed',
        message: 'Updated dashboard metrics from the analytics store.',
        type: 'info',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Real Ad Platform Synchronization Action
  const handleSyncInsights = async () => {
    try {
      const days = dateRange === '7D' ? 7 : dateRange === '90D' ? 90 : 30;
      const res = await syncMutation.mutateAsync(days);
      await refetchOverview();
      toast({
        title: 'Insights Synchronized',
        message: `Successfully synchronized ${res?.syncedCount ?? 0} daily performance records.`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Sync Failed',
        message: 'Could not sync insights from connected advertising platforms.',
        type: 'error',
      });
    }
  };

  // Safe KPI extraction with fallback defaults
  const kpis = overviewData?.kpis || {
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalLeads: 0,
    avgCpl: 0,
    ctr: 0,
    visitConversionRate: 0,
  };

  // Harmonize CTR from backend (backend may supply avgCtr or ctr)
  const effectiveCtr =
    kpis.ctr ??
    (kpis as unknown as { avgCtr?: number }).avgCtr ??
    0;

  const timeseries = useMemo(
    () => (Array.isArray(overviewData?.timeseries) ? overviewData.timeseries : []),
    [overviewData?.timeseries]
  );

  const dataQuality = overviewData?.dataQuality;

  // Defensive extraction for data quality record count (backend sends totalDays, schema specifies totalRecords)
  const totalRecordsCount = useMemo(() => {
    if (!dataQuality) return timeseries.length;
    if (typeof dataQuality.totalRecords === 'number') return dataQuality.totalRecords;
    const dqAny = dataQuality as unknown as { totalDays?: number; syncedCount?: number };
    if (typeof dqAny.totalDays === 'number') return dqAny.totalDays;
    return timeseries.length;
  }, [dataQuality, timeseries.length]);

  const lastSyncedDisplay = useMemo(() => {
    if (!dataQuality?.lastSyncedAt) return 'Just now';
    try {
      const d = new Date(dataQuality.lastSyncedAt);
      if (isNaN(d.getTime())) return 'Just now';
      return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return 'Just now';
    }
  }, [dataQuality?.lastSyncedAt]);

  // Formatted chart points for X-axis display
  const formattedTimeseries = useMemo(() => {
    return timeseries.map((pt) => {
      let displayDate = pt.date || '';
      try {
        if (pt.date) {
          const d = new Date(pt.date);
          if (!isNaN(d.getTime())) {
            displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        }
      } catch {
        displayDate = pt.date || '';
      }
      return {
        ...pt,
        displayDate,
      };
    });
  }, [timeseries]);

  // Mini sparklines for KPI cards
  const spendSparkline = useMemo(() => timeseries.map((t) => t.spend ?? 0), [timeseries]);
  const leadsSparkline = useMemo(() => timeseries.map((t) => t.leads ?? 0), [timeseries]);
  const cplSparkline = useMemo(() => timeseries.map((t) => t.cpl ?? 0), [timeseries]);

  // Safe SVG Sparkline renderer
  const renderSparkline = (data: number[], strokeColor: string) => {
    if (!Array.isArray(data) || data.length < 2) return null;
    const validData = data.filter((v) => typeof v === 'number' && !isNaN(v));
    if (validData.length < 2) return null;

    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min || 1;
    const width = 64;
    const height = 24;

    const points = validData
      .map((val, idx) => {
        const x = (idx / (validData.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg className="w-16 h-6 overflow-visible shrink-0" aria-hidden="true">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <Link to="/dashboard" className="hover:text-[#10B981] transition-colors">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#1F2937]">Analytics &amp; BI</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Analytics &amp; Business Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20">
              Full-Funnel Attribution
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Track real-time ad spend, CPL, click-through rates, and inbound lead conversion velocity across marketing channels.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Range Control */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
            {(['7D', '30D', '90D'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dateRange === r
                    ? 'bg-white text-[#1F2937] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefreshing || isLoadingOverview}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Refresh analytics data from local store"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#10B981] ${
                isRefreshing || isLoadingOverview ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </button>

          {/* Sync Insights Action */}
          <button
            type="button"
            onClick={handleSyncInsights}
            disabled={syncMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            title="Synchronize real-time marketing insights from ad platforms"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`}
            />
            <span>{syncMutation.isPending ? 'Syncing...' : 'Sync Insights'}</span>
          </button>
        </div>
      </div>

      {/* 2. Ingestion Status & Data Quality Alert */}
      {dataQuality && (
        <div className="rounded-2xl border border-[#EDF0F2] bg-white p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                (dataQuality.delayedCount ?? 0) > 0
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-[#E8F7F1] text-[#10B981]'
              }`}
            >
              {(dataQuality.delayedCount ?? 0) > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <span className="font-semibold text-[#1F2937]">Ingestion Health: </span>
              <span className="text-[#64748B]">
                <strong className="text-[#1F2937] font-semibold">
                  {totalRecordsCount.toLocaleString('en-IN')} records
                </strong>{' '}
                in current {dateRange} window
                {(dataQuality.delayedCount ?? 0) > 0 && (
                  <span className="text-amber-600 font-medium ml-1">
                    ({dataQuality.delayedCount} delayed/provisional)
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="text-slate-400 text-xs flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span>Last synced: {lastSyncedDisplay}</span>
          </div>
        </div>
      )}

      {/* 3. Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Ad Spend */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
                Total Ad Spend
              </p>
              <div className="text-[26px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none mt-1.5">
                {isLoadingOverview ? (
                  <div className="h-7 w-28 bg-slate-100 rounded-md animate-pulse" />
                ) : (
                  formatCurrency(kpis.totalSpend ?? 0)
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#EDE9FE] text-[#8B5CF6] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#EDF0F2] flex items-center justify-between">
            <p className="text-xs text-[#64748B] tabular-nums">
              {(kpis.totalImpressions ?? 0).toLocaleString('en-IN')} impressions
            </p>
            {renderSparkline(spendSparkline, '#8B5CF6')}
          </div>
        </div>

        {/* KPI 2: Inbound Leads */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
                Verified Inbound Leads
              </p>
              <div className="text-[26px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none mt-1.5">
                {isLoadingOverview ? (
                  <div className="h-7 w-24 bg-slate-100 rounded-md animate-pulse" />
                ) : (
                  `${(kpis.totalLeads ?? 0).toLocaleString('en-IN')} Leads`
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#EDF0F2] flex items-center justify-between">
            <p className="text-xs text-[#64748B] tabular-nums">
              {(kpis.totalClicks ?? 0).toLocaleString('en-IN')} clicks ({effectiveCtr}% CTR)
            </p>
            {renderSparkline(leadsSparkline, '#10B981')}
          </div>
        </div>

        {/* KPI 3: Average CPL */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
                Average Cost Per Lead (CPL)
              </p>
              <div className="text-[26px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none mt-1.5">
                {isLoadingOverview ? (
                  <div className="h-7 w-24 bg-slate-100 rounded-md animate-pulse" />
                ) : (
                  formatCurrency(kpis.avgCpl ?? 0)
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#EDF0F2] flex items-center justify-between">
            <p className="text-xs text-[#64748B]">Target benchmark: ₹3,500</p>
            {renderSparkline(cplSparkline, '#3B82F6')}
          </div>
        </div>

        {/* KPI 4: Visit Conversion */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
                Site Visit Conversion
              </p>
              <div className="text-[26px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none mt-1.5">
                {isLoadingOverview ? (
                  <div className="h-7 w-20 bg-slate-100 rounded-md animate-pulse" />
                ) : (
                  `${kpis.visitConversionRate ?? 0}%`
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#EDF0F2] flex items-center justify-between">
            <p className="text-xs text-[#64748B]">Physical site visits completed</p>
            <span className="text-[11px] font-semibold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-md">
              High Intent
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tabbed Analytics Suites */}
      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="inline-flex h-11 items-center justify-start border-b border-[#EDF0F2] bg-transparent w-full text-ink gap-6">
          <TabsTrigger
            value="overview"
            className="text-xs font-semibold pb-3 border-b-2 border-transparent data-[state=active]:border-[#10B981] data-[state=active]:text-[#10B981] text-[#64748B] hover:text-[#1F2937]"
          >
            Performance Overview
          </TabsTrigger>
          <TabsTrigger
            value="campaigns"
            className="text-xs font-semibold pb-3 border-b-2 border-transparent data-[state=active]:border-[#10B981] data-[state=active]:text-[#10B981] text-[#64748B] hover:text-[#1F2937] flex items-center gap-1.5"
          >
            <span>Campaign Breakdown</span>
            {Array.isArray(campaignsData) && campaignsData.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-[#64748B]">
                {campaignsData.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="content"
            className="text-xs font-semibold pb-3 border-b-2 border-transparent data-[state=active]:border-[#10B981] data-[state=active]:text-[#10B981] text-[#64748B] hover:text-[#1F2937] flex items-center gap-1.5"
          >
            <span>Creative Format ROI</span>
            {Array.isArray(contentData) && contentData.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-[#64748B]">
                {contentData.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="leads"
            className="text-xs font-semibold pb-3 border-b-2 border-transparent data-[state=active]:border-[#10B981] data-[state=active]:text-[#10B981] text-[#64748B] hover:text-[#1F2937]"
          >
            Lead Attribution &amp; Funnel
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: PERFORMANCE OVERVIEW (CHARTS)                                      */}
        {/* ========================================================================= */}
        <TabsContent value="overview" className="space-y-6 pt-1">
          {isLoadingOverview ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-xs h-80 flex flex-col justify-between animate-pulse">
                <div className="h-6 w-48 bg-slate-100 rounded-md" />
                <div className="h-56 w-full bg-slate-50 rounded-xl" />
              </div>
              <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-xs h-64 flex flex-col justify-between animate-pulse">
                <div className="h-6 w-40 bg-slate-100 rounded-md" />
                <div className="h-44 w-full bg-slate-50 rounded-xl" />
              </div>
            </div>
          ) : isErrorOverview ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-rose-900">
                Failed to load analytics timeseries
              </h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                Unable to retrieve stored performance records for the selected date range.
              </p>
              <button
                type="button"
                onClick={handleSyncInsights}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry Synchronization</span>
              </button>
            </div>
          ) : timeseries.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-10 h-10 text-[#64748B]" />}
              title="No performance records in this range"
              description="No marketing records found for the selected time window. Synchronize real-time data from Meta Ads Manager."
              action={
                <button
                  type="button"
                  onClick={handleSyncInsights}
                  disabled={syncMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] transition-all cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Synchronize Initial Data</span>
                </button>
              }
            />
          ) : (
            <>
              {/* Main Area Chart: Focused Metric Mode */}
              <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDF0F2]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#1F2937]">
                        Performance Trajectory
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                        <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                        <span>Daily Telemetry</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {metricFocus === 'leads' && 'Daily verified inbound lead volume.'}
                      {metricFocus === 'spend' && 'Daily advertising spend across marketing campaigns.'}
                      {metricFocus === 'cpl' && 'Cost per lead efficiency over time.'}
                    </p>
                  </div>

                  {/* Chart Metric Mode Selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                      {[
                        { id: 'leads', label: 'Inbound Leads' },
                        { id: 'spend', label: 'Ad Spend (₹)' },
                        { id: 'cpl', label: 'CPL (₹)' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setMetricFocus(mode.id as MetricFocus)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            metricFocus === mode.id
                              ? 'bg-white text-[#1F2937] shadow-xs'
                              : 'text-[#64748B] hover:text-[#1F2937]'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recharts Area Chart Container with Stable Single Y-Axis */}
                <div className="h-80 w-full pt-4 min-h-[320px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                    <AreaChart
                      data={formattedTimeseries}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="cplGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF0F2" />

                      <XAxis
                        dataKey="displayDate"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#EDF0F2' }}
                        dy={6}
                      />

                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => {
                          if (metricFocus === 'leads') return `${val}`;
                          if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                          if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                          return `₹${val}`;
                        }}
                        allowDecimals={false}
                      />

                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length || !payload[0]?.payload) return null;
                          const rawPt = payload[0].payload as Partial<AnalyticsTimeseriesPoint & { displayDate: string }>;
                          const pt = {
                            date: rawPt.date || rawPt.displayDate || '',
                            status: rawPt.status || 'SYNCED',
                            leads: Number(rawPt.leads || 0),
                            spend: Number(rawPt.spend || 0),
                            cpl: Number(rawPt.cpl || 0),
                            impressions: Number(rawPt.impressions || 0),
                            ctr: Number(rawPt.ctr || 0),
                          };
                          return (
                            <div className="rounded-xl bg-white border border-[#EDF0F2] p-3.5 shadow-[0_12px_24px_-4px_rgba(145,158,171,0.16)] text-xs space-y-2 min-w-[170px]">
                              <div className="flex items-center justify-between border-b border-[#EDF0F2] pb-1.5">
                                <span className="font-bold text-[#1F2937]">{pt.date}</span>
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                    pt.status === 'SYNCED'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {pt.status}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3 text-[#64748B]">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                                    Inbound Leads:
                                  </span>
                                  <span className="font-bold text-[#1F2937] tabular-nums">
                                    {pt.leads}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-[#64748B]">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                                    Ad Spend:
                                  </span>
                                  <span className="font-bold text-[#1F2937] tabular-nums">
                                    {formatCurrency(pt.spend)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-[#64748B]">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                                    Daily CPL:
                                  </span>
                                  <span className="font-bold text-[#1F2937] tabular-nums">
                                    {formatCurrency(pt.cpl)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-[#64748B] pt-1 border-t border-slate-100 text-[11px]">
                                  <span>Impressions / CTR:</span>
                                  <span className="tabular-nums">
                                    {pt.impressions.toLocaleString('en-IN')} ({pt.ctr}%)
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />

                      {metricFocus === 'leads' && (
                        <Area
                          type="monotone"
                          dataKey="leads"
                          name="Inbound Leads"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          fill="url(#leadsGradient)"
                        />
                      )}

                      {metricFocus === 'spend' && (
                        <Area
                          type="monotone"
                          dataKey="spend"
                          name="Daily Ad Spend"
                          stroke="#8B5CF6"
                          strokeWidth={2.5}
                          fill="url(#spendGradient)"
                        />
                      )}

                      {metricFocus === 'cpl' && (
                        <Area
                          type="monotone"
                          dataKey="cpl"
                          name="Cost Per Lead"
                          stroke="#3B82F6"
                          strokeWidth={2.5}
                          fill="url(#cplGradient)"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Secondary Chart: Daily CPL Efficiency Bar Chart */}
              <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EDF0F2]">
                  <div>
                    <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#10B981]" />
                      <span>Cost Per Lead (CPL) Efficiency Over Time</span>
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Daily acquisition cost consistency vs. ₹3,500 real estate target. Lower values indicate higher advertising efficiency.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span>Daily CPL (₹)</span>
                  </div>
                </div>

                <div className="h-60 w-full pt-4 min-h-[240px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                    <BarChart
                      data={formattedTimeseries}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF0F2" />
                      <XAxis
                        dataKey="displayDate"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#EDF0F2' }}
                        dy={6}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₹${val}`}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length || !payload[0]?.payload) return null;
                          const rawPt = payload[0].payload as Partial<AnalyticsTimeseriesPoint & { displayDate: string }>;
                          const pt = {
                            date: rawPt.date || rawPt.displayDate || '',
                            cpl: Number(rawPt.cpl || 0),
                            leads: Number(rawPt.leads || 0),
                          };
                          return (
                            <div className="rounded-xl bg-white border border-[#EDF0F2] p-3 shadow-md text-xs space-y-1">
                              <p className="font-bold text-[#1F2937] border-b border-[#EDF0F2] pb-1">
                                {pt.date}
                              </p>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[#64748B]">Cost Per Lead:</span>
                                <span className="font-bold text-[#10B981] tabular-nums">
                                  {formatCurrency(pt.cpl)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-500">
                                <span>Leads Acquired:</span>
                                <span className="font-semibold text-[#1F2937] tabular-nums">
                                  {pt.leads}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="cpl" name="CPL (₹)" fill="#10B981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: CAMPAIGN BREAKDOWN TABLE                                           */}
        {/* ========================================================================= */}
        <TabsContent value="campaigns" className="space-y-4 pt-1">
          <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
              <div>
                <h2 className="text-base font-bold text-[#1F2937]">Campaign Level Performance</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Detailed breakdown of active and paused Meta Ads campaigns, spend pacing, and CPL metrics.
                </p>
              </div>
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors"
              >
                <span>Manage Campaigns</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4">
              {isLoadingCampaigns ? (
                <div className="py-12 text-center text-xs text-[#64748B] space-y-2">
                  <div className="h-6 w-6 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Loading campaign performance records...</p>
                </div>
              ) : !Array.isArray(campaignsData) || campaignsData.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="w-10 h-10 text-[#64748B]" />}
                  title="No campaign analytics recorded"
                  description="Deploy or connect Meta Ads campaigns to view real-time attribution data."
                  action={
                    <Link to="/campaigns">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] transition-all cursor-pointer"
                      >
                        <span>View Campaigns</span>
                      </button>
                    </Link>
                  }
                />
              ) : (
                <div className="border border-[#EDF0F2] rounded-xl overflow-x-auto bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-[#EDF0F2] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                        <th className="p-3.5">Campaign Name</th>
                        <th className="p-3.5">Project</th>
                        <th className="p-3.5">Total Spend</th>
                        <th className="p-3.5">Inbound Leads</th>
                        <th className="p-3.5">Average CPL</th>
                        <th className="p-3.5">CTR</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF0F2]">
                      {campaignsData.map((c) => {
                        const itemRecord = c as unknown as Record<string, unknown>;
                        const spendVal =
                          typeof itemRecord.totalSpend === 'number'
                            ? itemRecord.totalSpend
                            : typeof itemRecord.spend === 'number'
                              ? itemRecord.spend
                              : 0;
                        const cplVal = c.cpl ?? 0;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors h-12">
                            <td className="p-3.5 font-bold text-[#1F2937]">{c.name}</td>
                            <td className="p-3.5 text-[#64748B]">{c.projectName}</td>
                            <td className="p-3.5 font-medium text-[#1F2937] tabular-nums">
                              {formatCurrency(spendVal)}
                            </td>
                            <td className="p-3.5 font-bold text-[#10B981] tabular-nums">
                              {c.leads ?? 0}
                            </td>
                            <td className="p-3.5 font-medium text-[#1F2937] tabular-nums">
                              {formatCurrency(cplVal)}
                            </td>
                            <td className="p-3.5 text-[#64748B] tabular-nums">{c.ctr ?? '0%'}</td>
                            <td className="p-3.5">
                              <StatusBadge status={c.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: CREATIVE FORMAT ROI                                                */}
        {/* ========================================================================= */}
        <TabsContent value="content" className="space-y-4 pt-1">
          <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
              <div>
                <h2 className="text-base font-bold text-[#1F2937]">Creative Format Performance</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Compare acquisition efficiency between vertical video reels, image carousels, and single-image ads.
                </p>
              </div>
              <Link
                to="/approvals"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors"
              >
                <span>Approvals Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4">
              {isLoadingContent ? (
                <div className="py-12 text-center text-xs text-[#64748B] space-y-2">
                  <div className="h-6 w-6 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Loading creative attribution records...</p>
                </div>
              ) : !Array.isArray(contentData) || contentData.length === 0 ? (
                <EmptyState
                  icon={<Layers className="w-10 h-10 text-[#64748B]" />}
                  title="No format analytics available"
                  description="Publish creatives across multiple formats to generate attribution comparisons."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {contentData.map((fmt, idx) => {
                    const fmtRecord = fmt as unknown as Record<string, unknown>;
                    const fmtLabel = fmt.format || (fmtRecord.label as string) || `Format ${idx + 1}`;
                    const fmtConv = fmt.conversionRate || (typeof fmtRecord.ctr === 'number' ? `${fmtRecord.ctr}%` : 'N/A');
                    const fmtCpl = typeof fmt.cpl === 'number' ? fmt.cpl : (typeof fmtRecord.spend === 'number' && typeof fmtRecord.leads === 'number' && fmtRecord.leads > 0 ? Math.round(fmtRecord.spend / fmtRecord.leads) : 0);
                    const fmtHighlight = fmt.highlight || (fmtRecord.headline as string) || 'Optimized Format';
                    const fmtDesc = fmt.description || 'High-performing creative format across digital real estate marketing channels.';

                    return (
                      <div
                        key={fmt.format || (fmtRecord.id as string) || idx}
                        className="rounded-2xl border border-[#EDF0F2] p-5 space-y-3 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[#1F2937] block truncate">
                              {fmtLabel}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F7F1] text-[#10B981]">
                              {fmtConv} conv
                            </span>
                          </div>

                          <div className="text-2xl font-bold text-[#1F2937] tabular-nums">
                            {formatCurrency(fmtCpl)}{' '}
                            <span className="text-xs font-normal text-[#64748B]">CPL</span>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                            <p className="text-xs font-semibold text-[#1F2937] flex items-center gap-1.5 truncate">
                              <Sparkles className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                              <span className="truncate">{fmtHighlight}</span>
                            </p>
                          </div>

                          <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">{fmtDesc}</p>
                        </div>

                        <div className="pt-2 border-t border-[#EDF0F2] text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Format Benchmark</span>
                          <span className="font-semibold text-[#10B981]">Optimized</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: LEAD ATTRIBUTION & PIPELINE FUNNEL                                 */}
        {/* ========================================================================= */}
        <TabsContent value="leads" className="space-y-6 pt-1">
          {/* Section 4A: Lead Source Attribution */}
          <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
              <div>
                <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#10B981]" />
                  <span>Lead Source Attribution</span>
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Origins of verified inbound inquiries across paid digital advertising and organic real estate channels.
                </p>
              </div>
              <Link
                to="/leads"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors"
              >
                <span>View CRM Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4">
              {isLoadingLeads ? (
                <div className="py-12 text-center text-xs text-[#64748B] space-y-2">
                  <div className="h-6 w-6 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Loading source attribution...</p>
                </div>
              ) : !leadsData ||
                !Array.isArray(leadsData.sourceAttribution) ||
                leadsData.sourceAttribution.length === 0 ? (
                <EmptyState
                  icon={<Share2 className="w-10 h-10 text-[#64748B]" />}
                  title="No lead origins recorded"
                  description="Inbound lead capture channels will appear here once inquiries arrive."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {leadsData.sourceAttribution.map((src, idx) => (
                    <div
                      key={src.source || idx}
                      className="rounded-2xl border border-[#EDF0F2] p-4 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#64748B] truncate block">
                          {String(src.source || 'Direct').replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-bold text-[#10B981] tabular-nums">
                          {Number(src.percentage || 0)}%
                        </span>
                      </div>

                      <div className="text-2xl font-bold text-[#1F2937] tabular-nums">
                        {Number(src.leads || 0)} <span className="text-xs font-normal text-[#64748B]">leads</span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, Number(src.percentage || 0)))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4B: Pipeline Conversion Velocity */}
          {leadsData && (
            <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
              <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">
                    Pipeline Conversion Stages &amp; Funnel
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Lead progression from initial inquiry through qualification, site visits, and final deal closing.
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                {(() => {
                  const funnelData = leadsData.conversionFunnel as
                    | Array<{ count?: number }>
                    | Record<string, number>
                    | undefined;
                  const leadsRecord = leadsData as unknown as Record<string, unknown>;
                  const funnel =
                    (leadsRecord.funnelStages as Record<string, number> | undefined) ||
                    (Array.isArray(funnelData) ? null : funnelData) || {
                      totalLeads: Array.isArray(funnelData) ? (funnelData[0]?.count ?? 0) : 0,
                      contacted: Array.isArray(funnelData) ? (funnelData[1]?.count ?? 0) : 0,
                      qualified: 0,
                      visitsDone: Array.isArray(funnelData) ? (funnelData[2]?.count ?? 0) : 0,
                      negotiation: Array.isArray(funnelData) ? (funnelData[3]?.count ?? 0) : 0,
                      won: Array.isArray(funnelData) ? (funnelData[4]?.count ?? 0) : 0,
                    };

                  const stages = [
                    { label: 'Inbound Total', count: funnel.totalLeads ?? 0, tone: 'slate' },
                    { label: 'Contacted', count: funnel.contacted ?? 0, tone: 'blue' },
                    { label: 'Qualified', count: funnel.qualified ?? 0, tone: 'purple' },
                    { label: 'Visits Done', count: funnel.visitsDone ?? 0, tone: 'amber' },
                    { label: 'Negotiation', count: funnel.negotiation ?? 0, tone: 'cyan' },
                    { label: 'Won Deals', count: funnel.won ?? 0, tone: 'emerald' },
                  ];

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {stages.map((st, idx) => (
                        <div
                          key={st.label}
                          className={`rounded-2xl border p-4 text-center space-y-1 ${
                            st.tone === 'emerald'
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                              : 'bg-white border-[#EDF0F2] text-[#1F2937]'
                          }`}
                        >
                          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                            {idx + 1}. {st.label}
                          </span>
                          <span
                            className={`text-2xl font-bold tabular-nums block ${
                              st.tone === 'emerald' ? 'text-emerald-700' : 'text-[#1F2937]'
                            }`}
                          >
                            {st.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Velocity Metric Footer */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-[#64748B]">
                  <Clock className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>
                    Average lead velocity from initial inquiry to completed site visit:{' '}
                    <strong className="text-[#1F2937] font-bold">
                      {typeof leadsData.avgVelocityDays === 'number'
                        ? leadsData.avgVelocityDays
                        : (leadsData.avgVelocityDays as { toSiteVisit?: number } | undefined)
                            ?.toSiteVisit ?? 2.8}{' '}
                      days
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function AnalyticsPage() {
  return (
    <AnalyticsErrorBoundary>
      <AnalyticsPageInternal />
    </AnalyticsErrorBoundary>
  );
}
