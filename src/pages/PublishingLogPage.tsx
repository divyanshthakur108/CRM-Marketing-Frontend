import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { formatDisplayDate, formatDisplayTime } from '../lib/formatters';
import {
  usePublishingLogs,
  useRetryPublishingLog,
  PublishingLogItem,
} from '../hooks/usePublishing';
import {
  Send,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  CheckCircle2,
  Share2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  RefreshCw,
  Search,
  X,
  Building2,
  TrendingUp,
  Copy,
  Check,
  Globe,
  Radio,
} from 'lucide-react';

const InstagramIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

function sanitizeErrorMessage(msg?: string): string {
  if (!msg) return '';
  return msg
    .replace(/(EA[A-Za-z0-9]{20,})/g, 'EA...[REDACTED]')
    .replace(/access_token=[^&\s]+/gi, 'access_token=[REDACTED]');
}

export function PublishingLogPage() {
  const { toast } = useToast();
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all logs to compute verified workspace-level KPIs
  const {
    data: logs = [],
    isLoading,
    isError,
    refetch,
  } = usePublishingLogs();

  const retryMutation = useRetryPublishingLog();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedErrorIds, setExpandedErrorIds] = useState<Set<string>>(new Set());

  // Safe retry confirmation state
  const [retryCandidate, setRetryCandidate] = useState<PublishingLogItem | null>(null);

  const toggleErrorExpand = (id: string) => {
    setExpandedErrorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'Copied to clipboard',
      message: `Meta Post ID (${id}) copied.`,
      type: 'info',
    });
  };

  const handleConfirmRetry = async () => {
    if (!retryCandidate) return;
    const log = retryCandidate;
    setRetryingId(log._id);
    try {
      await retryMutation.mutateAsync(log._id);
      toast({
        title: 'Dispatch retried successfully',
        message: `Payload for "${log.projectId?.name || 'Deliverable'}" re-sent to Meta Marketing API.`,
        type: 'success',
      });
      setRetryCandidate(null);
    } catch (err: unknown) {
      toast({
        title: 'Retry failed',
        message: err instanceof Error ? err.message : 'Could not retry publishing',
        type: 'error',
      });
    } finally {
      setRetryingId(null);
    }
  };

  // Filter logs by platform, status, and search query client-side
  const filteredLogs = useMemo(() => {
    let list = logs;
    if (platformFilter !== 'ALL') {
      list = list.filter((l) => l.platform === platformFilter);
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((l) => l.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((log) => {
        const matchCaption = log.caption?.toLowerCase().includes(q);
        const matchProject = log.projectId?.name?.toLowerCase().includes(q);
        const matchPostId = log.metaPostId?.toLowerCase().includes(q);
        return matchCaption || matchProject || matchPostId;
      });
    }
    return list;
  }, [logs, platformFilter, statusFilter, searchQuery]);

  // Authentic statistics computed from real API data
  const totalLogs = logs.length;
  const publishedCount = useMemo(() => logs.filter((l) => l.status === 'PUBLISHED').length, [logs]);
  const failedCount = useMemo(() => logs.filter((l) => l.status === 'FAILED').length, [logs]);
  const successRate = totalLogs > 0 ? Math.round((publishedCount / totalLogs) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1 font-medium">
            <span>Dashboard</span>
            <span>/</span>
            <span>Marketing</span>
            <span>/</span>
            <span className="text-[#10B981] font-semibold">Publishing Logs</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Publishing Logs &amp; Dispatch Records
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20">
              <Radio className="w-3.5 h-3.5" />
              {totalLogs} Dispatched Records
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time delivery log of organic social broadcasts, paid ad deployments, and Meta Marketing API events.
          </p>
        </div>

        {/* Sync / Refresh Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Refresh publishing logs from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Records</span>
          </button>
        </div>
      </div>

      {/* 2. Attention Alert Banner for Failures */}
      {failedCount > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-rose-900 text-sm">
                {failedCount} Dispatch Failure{failedCount === 1 ? '' : 's'} Detected
              </p>
              <p className="text-rose-800/90 text-xs mt-0.5">
                Meta Marketing API rejected one or more payloads. Expand the error diagnostics below to inspect error codes and safely retry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('FAILED')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            Filter Failed Dispatches
          </button>
        </div>
      )}

      {/* 3. Top KPI Cards (Authentic API Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Dispatched */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
              Total Dispatched
            </p>
            <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
              {totalLogs}
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              Across Facebook &amp; Instagram feeds
            </p>
          </div>
        </div>

        {/* KPI 2: Successfully Published */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
              Successfully Published
            </p>
            <div className="h-10 w-10 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
              {publishedCount}
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              Confirmed published on platform
            </p>
          </div>
        </div>

        {/* KPI 3: Dispatch Success Rate */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
              Success Rate
            </p>
            <div className="h-10 w-10 rounded-xl bg-[#F5F3FF] text-[#8B5CF6] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold tracking-tight text-[#1F2937] tabular-nums leading-none">
              {totalLogs > 0 ? `${successRate}%` : '—'}
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              {totalLogs > 0
                ? `${publishedCount} of ${totalLogs} deliverable${totalLogs === 1 ? '' : 's'} succeeded`
                : 'No records dispatched yet'}
            </p>
          </div>
        </div>

        {/* KPI 4: Failed / Action Required */}
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#64748B]">
              Action Required
            </p>
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                failedCount > 0
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-[28px] font-bold tracking-tight tabular-nums leading-none ${
                failedCount > 0 ? 'text-rose-600' : 'text-[#1F2937]'
              }`}
            >
              {failedCount}
            </div>
            <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-[#EDF0F2]">
              {failedCount === 0 ? 'All dispatches operational' : 'Review diagnostics below'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search Bar */}
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search caption, project, or Post ID..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Segmented Controls (Platform + Status) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Platform Segmented Switch */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPlatformFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                platformFilter === 'ALL'
                  ? 'bg-white text-[#1F2937] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              All Channels
            </button>
            <button
              type="button"
              onClick={() => setPlatformFilter('FACEBOOK')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                platformFilter === 'FACEBOOK'
                  ? 'bg-white text-[#1877F2] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1877F2]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-[#1877F2]" />
              <span>Facebook</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatformFilter('INSTAGRAM')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                platformFilter === 'INSTAGRAM'
                  ? 'bg-white text-[#E4405F] shadow-xs'
                  : 'text-[#64748B] hover:text-[#E4405F]'
              }`}
            >
              <InstagramIcon className="w-3.5 h-3.5 text-[#E4405F]" />
              <span>Instagram</span>
            </button>
          </div>

          {/* Status Segmented Switch */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#1F2937] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PUBLISHED')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'PUBLISHED'
                  ? 'bg-white text-[#10B981] shadow-xs'
                  : 'text-[#64748B] hover:text-[#10B981]'
              }`}
            >
              Published
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('FAILED')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'FAILED'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-[#64748B] hover:text-rose-600'
              }`}
            >
              Failed
            </button>
          </div>

          <span className="text-xs text-[#64748B] pl-1 tabular-nums">
            Showing <strong>{filteredLogs.length}</strong> record{filteredLogs.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-16 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <div className="h-9 w-9 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#1F2937]">Loading Dispatch Logs...</p>
          <p className="text-xs text-[#64748B]">Querying delivery history from Meta Graph API</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center text-rose-700 space-y-2 max-w-xl mx-auto shadow-xs">
          <p className="font-semibold text-sm">Failed to load dispatch records from server.</p>
          <p className="text-xs text-rose-600">Please verify API connection or retry your session.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="cursor-pointer"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* 5. DESKTOP DATA TABLE VIEW (Hidden on mobile <640px) */}
      {!isLoading && !isError && (
        <div className="hidden sm:block rounded-2xl bg-white border border-[#EDF0F2] overflow-hidden shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#EDF0F2] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider sticky top-0 z-10">
                  <th className="px-5 py-3.5">Deliverable &amp; Project</th>
                  <th className="px-4 py-3.5">Platform</th>
                  <th className="px-4 py-3.5">Meta Post ID &amp; Live Link</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF0F2]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <EmptyState
                        icon={<Send className="w-10 h-10 text-slate-300 mx-auto" />}
                        title="No Delivery Records Found"
                        description={
                          searchQuery
                            ? 'No dispatch records match your search criteria.'
                            : 'Approve a plan item with creative to trigger social publishing.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((item) => {
                    const isExpanded = expandedErrorIds.has(item._id);

                    return (
                      <tr
                        key={item._id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          item.status === 'FAILED' ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* 1. Deliverable & Project */}
                        <td className="px-5 py-4 max-w-sm">
                          <div className="space-y-1">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#64748B] flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{item.projectId?.name || 'Project Entity'}</span>
                            </span>
                            <h4 className="font-semibold text-[#1F2937] text-xs line-clamp-2 leading-relaxed">
                              {item.caption}
                            </h4>

                            {/* Expandable Error Diagnostic Toggle */}
                            {item.errorMessage && (
                              <div className="mt-2 pt-1.5 border-t border-rose-100">
                                <button
                                  type="button"
                                  onClick={() => toggleErrorExpand(item._id)}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 hover:text-rose-900 focus:outline-none cursor-pointer"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>{isExpanded ? 'Hide error details' : 'View dispatch error'}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                                {isExpanded && (
                                  <div className="mt-1.5 p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200/70 text-[11px] font-mono break-all leading-relaxed shadow-inner">
                                    <div className="font-bold text-[10px] text-rose-600 uppercase mb-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Meta Marketing API Error Diagnostic:
                                    </div>
                                    {sanitizeErrorMessage(item.errorMessage)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 2. Platform Badge */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {item.platform === 'FACEBOOK' ? (
                            <Badge
                              variant="neutral"
                              size="sm"
                              className="gap-1.5 font-semibold bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20"
                            >
                              <Share2 className="w-3.5 h-3.5 text-[#1877F2]" />
                              Facebook
                            </Badge>
                          ) : item.platform === 'INSTAGRAM' ? (
                            <Badge
                              variant="neutral"
                              size="sm"
                              className="gap-1.5 font-semibold bg-[#E4405F]/10 text-[#E4405F] border-[#E4405F]/20"
                            >
                              <InstagramIcon className="w-3.5 h-3.5 text-[#E4405F]" />
                              Instagram
                            </Badge>
                          ) : (
                            <Badge
                              variant="neutral"
                              size="sm"
                              className="gap-1.5 font-semibold bg-purple-50 text-purple-700 border-purple-200"
                            >
                              <Globe className="w-3.5 h-3.5 text-purple-600" />
                              Multi-Channel
                            </Badge>
                          )}
                        </td>

                        {/* 3. Meta Post ID & URL */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {item.metaPostId ? (
                              <button
                                type="button"
                                onClick={() => handleCopyId(item.metaPostId!)}
                                className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[#1F2937] font-mono text-[11px] border border-slate-200 transition-colors cursor-pointer"
                                title="Click to copy Meta Post ID"
                              >
                                <span>{item.metaPostId}</span>
                                {copiedId === item.metaPostId ? (
                                  <Check className="w-3 h-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Pending ID</span>
                            )}

                            {item.postUrl && (
                              <div>
                                <a
                                  href={item.postUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981] hover:underline transition-colors"
                                >
                                  <span>View live post</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 4. Status Badge */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* 5. Timestamp */}
                        <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                          {item.publishedAt ? (
                            <div className="space-y-0.5">
                              <span className="block font-semibold text-[#1F2937] text-xs">
                                {formatDisplayDate(item.publishedAt)}
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                {formatDisplayTime(item.publishedAt)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* 6. Controls & Retry Action */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          {item.status === 'FAILED' ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setRetryCandidate(item)}
                              isLoading={retryingId === item._id}
                              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                              className="rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                              aria-label={`Retry dispatch for ${item.caption.slice(0, 30)}`}
                            >
                              Retry Dispatch
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Dispatched ({item.retryCount || 0} retries)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MOBILE CARD LIST VIEW (Visible only on mobile <640px) */}
      <div className="block sm:hidden space-y-4">
        {!isLoading && !isError && filteredLogs.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#EDF0F2] p-8 text-center shadow-xs">
            <EmptyState
              icon={<Send className="w-8 h-8 text-slate-300 mx-auto" />}
              title="No Delivery Records Found"
              description="Approve a plan item with creative to trigger social publishing."
            />
          </div>
        ) : (
          filteredLogs.map((item) => {
            const isExpanded = expandedErrorIds.has(item._id);

            return (
              <div
                key={item._id}
                className={`p-4 rounded-2xl border bg-white shadow-xs space-y-3.5 ${
                  item.status === 'FAILED'
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-[#EDF0F2]'
                }`}
              >
                {/* Header: Project & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#64748B] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{item.projectId?.name || 'Project Entity'}</span>
                    </span>
                    <h4 className="font-semibold text-[#1F2937] text-xs mt-1 line-clamp-2 leading-relaxed">
                      {item.caption}
                    </h4>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                {/* Platform & Timestamp Strip */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div>
                    {item.platform === 'FACEBOOK' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#1877F2]">
                        <Share2 className="w-3.5 h-3.5" /> Facebook
                      </span>
                    ) : item.platform === 'INSTAGRAM' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#E4405F]">
                        <InstagramIcon className="w-3.5 h-3.5" /> Instagram
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-purple-700">
                        <Globe className="w-3.5 h-3.5" /> Multi-Channel
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {item.publishedAt ? formatDisplayDate(item.publishedAt) : '—'}
                  </div>
                </div>

                {/* Error diagnostics */}
                {item.errorMessage && (
                  <div className="pt-2 border-t border-rose-100">
                    <button
                      type="button"
                      onClick={() => toggleErrorExpand(item._id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:underline"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{isExpanded ? 'Hide error details' : 'View dispatch error'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-1.5 p-2.5 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-[11px] font-mono break-all leading-relaxed">
                        {sanitizeErrorMessage(item.errorMessage)}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: Post ID & Action Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono">
                    {item.metaPostId ? (
                      <button
                        type="button"
                        onClick={() => handleCopyId(item.metaPostId!)}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900"
                      >
                        <span>{item.metaPostId}</span>
                        <Copy className="w-3 h-3 text-slate-400" />
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Pending ID</span>
                    )}
                  </div>

                  <div>
                    {item.status === 'FAILED' ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setRetryCandidate(item)}
                        isLoading={retryingId === item._id}
                        leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                        className="rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                      >
                        Retry
                      </Button>
                    ) : item.postUrl ? (
                      <a
                        href={item.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#10B981] hover:underline"
                      >
                        <span>View live</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {item.retryCount || 0} retries
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 7. Safe Retry Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(retryCandidate)}
        onClose={() => setRetryCandidate(null)}
        onConfirm={handleConfirmRetry}
        title="Confirm Dispatch Re-Submission"
        description={
          <div className="space-y-2 text-xs text-slate-600">
            <p>
              Are you sure you want to resend this creative payload for{' '}
              <strong className="text-slate-900 font-semibold">
                &ldquo;{retryCandidate?.projectId?.name || 'Project Entity'}&rdquo;
              </strong>{' '}
              to the Meta Marketing API?
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-800 break-words">
              <strong>Platform:</strong> {retryCandidate?.platform}
              <br />
              <strong>Caption:</strong> {retryCandidate?.caption.slice(0, 100)}...
            </div>
            <p className="text-[11px] text-amber-700">
              This will initiate an external network dispatch to Meta.
            </p>
          </div>
        }
        confirmText="Confirm &amp; Retry Dispatch"
        cancelText="Cancel"
        variant="primary"
        isLoading={Boolean(retryingId)}
      />
    </div>
  );
}
