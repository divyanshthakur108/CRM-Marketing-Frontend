import { useState, useMemo } from 'react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { formatCurrency } from '../lib/formatters';
import {
  useCampaigns,
  useResumeCampaign,
  useUpdateCampaignStatus,
  CampaignItem,
} from '../hooks/usePublishing';
import {
  Play,
  Pause,
  RotateCw,
  AlertTriangle,
  Wallet,
  Users,
  ShieldCheck,
  Copy,
  Check,
  RotateCcw,
  Search,
  X,
  RefreshCw,
  Zap,
  Building2,
  TrendingUp,
} from 'lucide-react';

const DEPLOYMENT_STEPS = ['CAMPAIGN', 'AD_SET', 'CREATIVE', 'AD'] as const;

const STEP_DETAILS: Record<string, { label: string; short: string }> = {
  CAMPAIGN: { label: 'Campaign', short: 'Camp' },
  AD_SET: { label: 'Ad Set', short: 'AdSet' },
  CREATIVE: { label: 'Creative', short: 'Cre' },
  AD: { label: 'Ad', short: 'Ad' },
};

export function CampaignsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'NEEDS_ACTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all campaigns and filter client-side for consistent workspace KPIs
  const { data: campaigns = [], isLoading, isError, refetch } = useCampaigns();
  const resumeMutation = useResumeCampaign();
  const statusMutation = useUpdateCampaignStatus();

  const [resumingId, setResumingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Spend-affecting action confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'activate' | 'pause' | 'resume';
    campaign: CampaignItem;
  } | null>(null);

  const handleCopyId = (id: string, label: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'Copied to clipboard',
      message: `${label} (${id}) copied.`,
      type: 'info',
    });
  };

  const handleToggleStatus = (item: CampaignItem) => {
    const nextStatus = item.status === 'ACTIVE' ? 'pause' : 'activate';
    setConfirmAction({
      type: nextStatus,
      campaign: item,
    });
  };

  const handleResumeClick = (item: CampaignItem) => {
    setConfirmAction({
      type: 'resume',
      campaign: item,
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, campaign } = confirmAction;

    if (type === 'activate' || type === 'pause') {
      const nextStatus = type === 'activate' ? 'ACTIVE' : 'PAUSED';
      try {
        await statusMutation.mutateAsync({ campaignId: campaign._id, status: nextStatus });
        toast({
          title: `Campaign ${nextStatus === 'ACTIVE' ? 'Activated' : 'Paused'}`,
          message: `Updated Meta Ads delivery state for "${campaign.name}"`,
          type: nextStatus === 'ACTIVE' ? 'success' : 'info',
        });
      } catch (err: unknown) {
        toast({
          title: 'Status Update Failed',
          message: err instanceof Error ? err.message : 'Could not update campaign status',
          type: 'error',
        });
      }
    } else if (type === 'resume') {
      setResumingId(campaign._id);
      try {
        await resumeMutation.mutateAsync(campaign._id);
        toast({
          title: 'Deployment Resumed Successfully',
          message: `Continued deployment for "${campaign.name}" from first incomplete step.`,
          type: 'success',
        });
      } catch (err: unknown) {
        toast({
          title: 'Resumption Failed',
          message: err instanceof Error ? err.message : 'Could not resume campaign deployment',
          type: 'error',
        });
      } finally {
        setResumingId(null);
      }
    }

    setConfirmAction(null);
  };

  // Real Calculated Metrics
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.metrics?.leads || 0), 0);
  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const pausedCount = campaigns.filter((c) => c.status === 'PAUSED').length;
  const needsActionCount = campaigns.filter((c) => c.needsAction).length;

  // Filtered campaigns for table & mobile cards
  const displayedCampaigns = useMemo(() => {
    let list = campaigns;
    if (statusFilter === 'NEEDS_ACTION') {
      list = list.filter((c) => c.needsAction);
    } else if (statusFilter === 'ACTIVE') {
      list = list.filter((c) => c.status === 'ACTIVE');
    } else if (statusFilter === 'PAUSED') {
      list = list.filter((c) => c.status === 'PAUSED');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.projectId?.name?.toLowerCase().includes(q) ||
          c.metaCampaignId?.toLowerCase().includes(q) ||
          c.metaAdSetId?.toLowerCase().includes(q) ||
          c.metaAdId?.toLowerCase().includes(q) ||
          c._id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [campaigns, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span>Marketing</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#1F2937]">Meta Ads &amp; Campaigns</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Meta Ads &amp; Campaigns
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20">
              {campaigns.length} Total Campaigns
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Monitor real-time Meta campaign delivery, lead acquisition metrics, daily spend limits, and deployment recovery.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Refresh campaign list from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Needs Action Attention Alert Banner */}
      {needsActionCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">
                {needsActionCount} Campaign Deployment{needsActionCount === 1 ? '' : 's'} Require Attention
              </p>
              <p className="text-amber-800/90 text-xs mt-0.5">
                A transient API timeout or rate limit interrupted multi-step deployment. Click Resume on any affected campaign to continue setup.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('NEEDS_ACTION')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            Filter Stalled Campaigns
          </button>
        </div>
      )}

      {/* 3. Top Minimal KPI Statistics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Meta Ad Spend */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">Total Meta Ad Spend</p>
            <div className="h-10 w-10 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
              {formatCurrency(totalSpend)}
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              Across all {campaigns.length} campaigns in workspace
            </p>
          </div>
        </div>

        {/* Metric 2: Inbound Verified Leads */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">Inbound Verified Leads</p>
            <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
              {totalLeads} Leads
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              Special Ad Category: Housing compliant
            </p>
          </div>
        </div>

        {/* Metric 3: Active Ad Delivery */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">Active Ad Delivery</p>
            <div className="h-10 w-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
              {activeCount}
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              {pausedCount} paused delivery
            </p>
          </div>
        </div>

        {/* Metric 4: Deployment Health */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">Deployment Health</p>
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                needsActionCount === 0
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
              {needsActionCount === 0 ? 'All Clear' : `${needsActionCount} Stalled`}
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              {needsActionCount === 0
                ? 'No stalled deployments in queue'
                : 'Resumable step deployments in queue'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Toolbar */}
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns by name, project, or Meta ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 text-xs pl-10 pr-9 rounded-xl border border-[#EDF0F2] bg-slate-50/50 text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981] focus:border-[#10B981] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2937] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-[#1F2937] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                All ({campaigns.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-[#1F2937] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PAUSED')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'PAUSED'
                    ? 'bg-white text-[#1F2937] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                Paused ({pausedCount})
              </button>
              {needsActionCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('NEEDS_ACTION')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'NEEDS_ACTION'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Needs Action ({needsActionCount})</span>
                </button>
              )}
            </div>

            {/* Results Counter */}
            <span className="text-xs text-[#64748B] pl-2 tabular-nums">
              Showing <strong>{displayedCampaigns.length}</strong> campaign{displayedCampaigns.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <div className="h-9 w-9 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#1F2937]">Synchronizing Meta Ad Campaigns...</p>
          <p className="text-xs text-[#64748B]">Querying verified delivery states from Meta Marketing API</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center text-rose-700 space-y-2">
          <p className="font-semibold text-sm">Failed to load Meta ad campaigns from server.</p>
          <p className="text-xs text-rose-600">Please verify API connection or try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
            Retry Query
          </Button>
        </div>
      )}

      {/* 5. DESKTOP CAMPAIGNS DATA TABLE (Hidden on mobile <640px) */}
      {!isLoading && !isError && (
        <div className="hidden sm:block rounded-2xl bg-white border border-[#EDF0F2] overflow-hidden shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#EDF0F2] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider sticky top-0 z-10">
                  <th className="px-5 py-3.5">Campaign &amp; Project</th>
                  <th className="px-4 py-3.5">Objective</th>
                  <th className="px-4 py-3.5">Daily Budget</th>
                  <th className="px-4 py-3.5">Deployment Stepper</th>
                  <th className="px-4 py-3.5">Meta Identifiers</th>
                  <th className="px-4 py-3.5">Delivery Status</th>
                  <th className="px-5 py-3.5 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF0F2]">
                {displayedCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="max-w-xs mx-auto space-y-2">
                        <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-sm font-semibold text-[#1F2937]">No Ad Campaigns Found</p>
                        <p className="text-xs text-[#64748B]">
                          No campaigns match your current status filter or search query. Deploy an approved creative from the Approvals queue to begin.
                        </p>
                        {(searchQuery || statusFilter !== 'ALL') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('ALL');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] text-white hover:bg-[#059669] shadow-xs transition-colors cursor-pointer mt-1"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedCampaigns.map((item) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.needsAction ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Campaign & Project */}
                      <td className="px-5 py-3 max-w-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{item.projectId?.name || 'Project Entity'}</span>
                          </div>
                          <h4 className="font-semibold text-[#1F2937] text-xs leading-tight">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums block">
                            ID: {item._id}
                          </span>

                          {item.needsAction && item.lastErrorMessage && (
                            <div className="mt-1 p-2 bg-rose-50 text-rose-700 text-[11px] rounded-lg border border-rose-200 flex items-start gap-1.5 leading-relaxed">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                              <span>
                                <strong>Failed at [{item.lastErrorStep}]:</strong> {item.lastErrorMessage}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Objective */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.objective?.replace(/_/g, ' ') || 'LEAD GENERATION'}
                        </span>
                      </td>

                      {/* Daily Budget */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-[#1F2937] tabular-nums text-xs">
                          {formatCurrency(item.dailyBudget)}
                          <span className="text-[11px] font-normal text-[#64748B]"> / day</span>
                        </div>
                      </td>

                      {/* Deployment Stepper */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {DEPLOYMENT_STEPS.map((step, idx) => {
                            const isDone = item.completedSteps?.includes(step);
                            const isFailed = item.needsAction && item.lastErrorStep === step;

                            return (
                              <div key={step} className="flex items-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                                    isFailed
                                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200'
                                      : isDone
                                      ? 'bg-[#E8F7F1] text-[#10B981] border-[#10B981]/30 font-bold'
                                      : 'bg-slate-50 text-slate-400 border-slate-200'
                                  }`}
                                  title={`Step ${idx + 1}: ${STEP_DETAILS[step].label} (${
                                    isFailed
                                      ? 'Failed: ' + (item.lastErrorMessage || 'Error')
                                      : isDone
                                      ? 'Completed'
                                      : 'Pending'
                                  })`}
                                >
                                  {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  {isFailed && <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />}
                                  <span>{STEP_DETAILS[step].label}</span>
                                </span>
                                {idx < DEPLOYMENT_STEPS.length - 1 && (
                                  <span className="text-slate-300 mx-0.5 text-[10px]">&rsaquo;</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Meta Identifiers */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1 font-mono text-[11px]">
                          {item.metaCampaignId && (
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-[#EDF0F2]">
                              <span className="text-slate-400 font-sans text-[10px]">Camp:</span>
                              <span className="text-[#1F2937] font-semibold">{item.metaCampaignId}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyId(item.metaCampaignId!, 'Campaign ID')}
                                className="p-0.5 text-slate-400 hover:text-[#10B981] transition-colors ml-auto cursor-pointer"
                                title="Copy Meta Campaign ID"
                              >
                                {copiedId === item.metaCampaignId ? (
                                  <Check className="w-3 h-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {item.metaAdSetId && (
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-[#EDF0F2]">
                              <span className="text-slate-400 font-sans text-[10px]">AdSet:</span>
                              <span className="text-[#1F2937] font-semibold">{item.metaAdSetId}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyId(item.metaAdSetId!, 'AdSet ID')}
                                className="p-0.5 text-slate-400 hover:text-[#10B981] transition-colors ml-auto cursor-pointer"
                                title="Copy Meta AdSet ID"
                              >
                                {copiedId === item.metaAdSetId ? (
                                  <Check className="w-3 h-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {item.metaAdId && (
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-[#EDF0F2]">
                              <span className="text-slate-400 font-sans text-[10px]">Ad:</span>
                              <span className="text-[#1F2937] font-semibold">{item.metaAdId}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyId(item.metaAdId!, 'Ad ID')}
                                className="p-0.5 text-slate-400 hover:text-[#10B981] transition-colors ml-auto cursor-pointer"
                                title="Copy Meta Ad ID"
                              >
                                {copiedId === item.metaAdId ? (
                                  <Check className="w-3 h-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {!item.metaCampaignId && !item.metaAdSetId && !item.metaAdId && (
                            <span className="text-slate-400 font-sans italic text-xs">Pending Meta sync</span>
                          )}
                        </div>
                      </td>

                      {/* Delivery Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.needsAction ? (
                          <StatusBadge status="needs_action" label="Needs Action" />
                        ) : (
                          <StatusBadge status={item.status} />
                        )}
                      </td>

                      {/* Controls */}
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {item.needsAction ? (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleResumeClick(item)}
                            isLoading={resumingId === item._id}
                            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                            aria-label={`Resume deployment for ${item.name}`}
                          >
                            Resume
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(item)}
                            leftIcon={
                              item.status === 'ACTIVE' ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )
                            }
                            aria-label={`${item.status === 'ACTIVE' ? 'Pause' : 'Activate'} delivery for ${item.name}`}
                          >
                            {item.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MOBILE CAMPAIGNS CARD LIST VIEW (Visible only on mobile <640px) */}
      <div className="block sm:hidden space-y-3">
        {displayedCampaigns.length === 0 && !isLoading && (
          <div className="rounded-2xl bg-white border border-[#EDF0F2] p-8 text-center space-y-2 shadow-xs">
            <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-[#1F2937]">No Ad Campaigns Found</p>
            <p className="text-xs text-[#64748B]">No campaigns match the active filters.</p>
          </div>
        )}

        {displayedCampaigns.map((item) => (
          <div
            key={item._id}
            className={`rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-3 ${
              item.needsAction ? 'border-amber-300 bg-amber-50/20' : ''
            }`}
          >
            {/* Header: Project & Status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B] block">
                  {item.projectId?.name || 'Project Entity'}
                </span>
                <h4 className="font-bold text-[#1F2937] text-xs mt-0.5 leading-snug">{item.name}</h4>
                <span className="text-[10px] text-slate-400 font-mono tabular-nums block mt-0.5">
                  ID: {item._id}
                </span>
              </div>
              <div className="shrink-0">
                {item.needsAction ? (
                  <StatusBadge status="needs_action" label="Needs Action" />
                ) : (
                  <StatusBadge status={item.status} />
                )}
              </div>
            </div>

            {/* Error notice if failed */}
            {item.needsAction && item.lastErrorMessage && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-[11px] rounded-xl border border-rose-200 flex items-start gap-1.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>
                  <strong>Failed at [{item.lastErrorStep}]:</strong> {item.lastErrorMessage}
                </span>
              </div>
            )}

            {/* Grid: Objective & Budget */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#EDF0F2]">
              <div>
                <span className="text-[11px] text-[#64748B] block">Objective</span>
                <span className="font-semibold text-[#1F2937] block mt-0.5 truncate">
                  {item.objective?.replace(/_/g, ' ') || 'LEAD GENERATION'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B] block">Daily Budget</span>
                <span className="font-bold text-[#1F2937] tabular-nums block mt-0.5">
                  {formatCurrency(item.dailyBudget)} / day
                </span>
              </div>
            </div>

            {/* Deployment Stepper */}
            <div className="pt-2 border-t border-[#EDF0F2]">
              <span className="text-[11px] text-[#64748B] block mb-1 font-medium">Deployment Stepper</span>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {DEPLOYMENT_STEPS.map((step, idx) => {
                  const isDone = item.completedSteps?.includes(step);
                  const isFailed = item.needsAction && item.lastErrorStep === step;

                  return (
                    <div key={step} className="flex items-center shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isFailed
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : isDone
                            ? 'bg-[#E8F7F1] text-[#10B981] border-[#10B981]/30'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        {isFailed && <AlertTriangle className="w-2.5 h-2.5" />}
                        <span>{STEP_DETAILS[step].label}</span>
                      </span>
                      {idx < DEPLOYMENT_STEPS.length - 1 && (
                        <span className="text-slate-300 mx-0.5 text-[10px]">&rsaquo;</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Meta IDs & Action Footer */}
            <div className="pt-2.5 border-t border-[#EDF0F2] flex items-center justify-between gap-2">
              <div className="text-[11px] text-[#64748B] font-mono">
                {item.metaCampaignId ? (
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-[#EDF0F2]">
                    <span>Camp: {item.metaCampaignId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(item.metaCampaignId!, 'Campaign ID')}
                      className="p-0.5 text-slate-400 hover:text-[#10B981] cursor-pointer"
                    >
                      {copiedId === item.metaCampaignId ? (
                        <Check className="w-3 h-3 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="italic font-sans text-slate-400 text-[11px]">Pending sync</span>
                )}
              </div>

              <div>
                {item.needsAction ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleResumeClick(item)}
                    isLoading={resumingId === item._id}
                    leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                  >
                    Resume
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(item)}
                    leftIcon={
                      item.status === 'ACTIVE' ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {item.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 7. Confirm Dialog for Spend-Affecting Actions */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeConfirmedAction}
          isLoading={statusMutation.isPending || resumeMutation.isPending}
          variant={confirmAction.type === 'pause' ? 'danger' : 'primary'}
          title={
            confirmAction.type === 'activate'
              ? 'Activate Meta Campaign'
              : confirmAction.type === 'pause'
              ? 'Pause Meta Campaign'
              : 'Resume Deployment Step'
          }
          description={
            confirmAction.type === 'activate' ? (
              <span>
                Are you sure you want to activate <strong>"{confirmAction.campaign.name}"</strong>?
                Live ad delivery will resume and daily spend of{' '}
                <strong>{formatCurrency(confirmAction.campaign.dailyBudget)}/day</strong> will be
                dispatched on Meta.
              </span>
            ) : confirmAction.type === 'pause' ? (
              <span>
                Pause delivery for <strong>"{confirmAction.campaign.name}"</strong>? Active
                lead generation and live ad spend on Meta will be paused immediately.
              </span>
            ) : (
              <span>
                Resume deployment for <strong>"{confirmAction.campaign.name}"</strong> from step{' '}
                <strong>"{confirmAction.campaign.lastErrorStep || 'first incomplete step'}"</strong>?
              </span>
            )
          }
          confirmText={
            confirmAction.type === 'activate'
              ? 'Activate Campaign'
              : confirmAction.type === 'pause'
              ? 'Pause Delivery'
              : 'Resume Deployment'
          }
          cancelText="Cancel"
        />
      )}
    </div>
  );
}
