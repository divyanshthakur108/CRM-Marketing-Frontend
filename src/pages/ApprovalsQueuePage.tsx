import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { Textarea } from '../components/ui/Textarea';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import {
  useApprovals,
  useDecideApproval,
  FrontendCreativeApproval,
} from '../hooks/useApprovals';
import { useAuthStore } from '../store/useAuthStore';
import {
  Check,
  AlertCircle,
  Eye,
  Building2,
  ShieldCheck,
  MessageSquare,
  Loader2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Lock,
  History,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export function ApprovalsQueuePage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [selectedCreativeId, setSelectedCreativeId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Real React Query Hooks
  const { data: creatives = [], isLoading, isError, refetch } = useApprovals(statusFilter);
  const decideMutation = useDecideApproval();

  // Local checklist toggle state overrides per item
  const [localChecklists, setLocalChecklists] = useState<
    Record<string, FrontendCreativeApproval['checklist']>
  >({});

  // Revision Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');

  // Role permissions check
  const userRole = (user?.role || 'viewer').toLowerCase();
  const canApprove = [
    'platform_admin',
    'org_owner',
    'marketing_manager',
    'client_approver',
    'owner',
    'admin',
  ].includes(userRole);

  const activeCreative = useMemo(() => {
    if (!creatives.length) return null;
    if (selectedCreativeId) {
      const found = creatives.find((c) => c.id === selectedCreativeId);
      if (found) return found;
    }
    return creatives[0];
  }, [creatives, selectedCreativeId]);

  // Current checklist for active creative
  const currentChecklist = useMemo(() => {
    if (!activeCreative) return null;
    return localChecklists[activeCreative.id] || activeCreative.checklist;
  }, [activeCreative, localChecklists]);

  // Count how many items are checked for the active creative
  const verifiedCount = useMemo(() => {
    if (!currentChecklist) return 0;
    let count = 0;
    if (currentChecklist.priceVerified) count++;
    if (currentChecklist.bedroomsVerified) count++;
    if (currentChecklist.amenitiesVerified) count++;
    if (currentChecklist.ctaVerified) count++;
    if (currentChecklist.reraDisclaimerVerified) count++;
    return count;
  }, [currentChecklist]);

  const allChecked = verifiedCount === 5;

  // Pending count across loaded items
  const pendingCount = useMemo(() => {
    return creatives.filter((c) => c.status !== 'Approved').length;
  }, [creatives]);

  const approvedCount = useMemo(() => {
    return creatives.filter((c) => c.status === 'Approved').length;
  }, [creatives]);

  const handleToggleChecklist = (key: keyof FrontendCreativeApproval['checklist']) => {
    if (!activeCreative || !currentChecklist) return;

    setLocalChecklists((prev) => ({
      ...prev,
      [activeCreative.id]: {
        ...currentChecklist,
        [key]: !currentChecklist[key],
      },
    }));
  };

  const handleApprove = async () => {
    if (!activeCreative || !currentChecklist) return;

    if (!canApprove) {
      toast({
        title: 'Action forbidden',
        message: 'Only managers, client approvers, and organization owners can approve creatives.',
        type: 'error',
      });
      return;
    }

    const { priceVerified, bedroomsVerified, amenitiesVerified, ctaVerified, reraDisclaimerVerified } =
      currentChecklist;

    if (!allChecked) {
      toast({
        title: 'Checklist incomplete',
        message: 'All 5 statutory facts must be verified before granting approval.',
        type: 'error',
      });
      return;
    }

    try {
      await decideMutation.mutateAsync({
        approvalId: activeCreative.id,
        decision: 'APPROVED',
        factChecklist: {
          priceVerified,
          bedroomsVerified,
          amenitiesVerified,
          ctaVerified,
          reraDisclaimerVerified,
        },
        feedback: 'Statutory facts verified against approved documentation.',
      });

      toast({
        title: 'Creative approved',
        message: `"${activeCreative.creativeTitle}" verified and cleared for broadcast.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Could not approve creative';

      toast({
        title: 'Approval failed',
        message: msg || 'Error approving creative',
        type: 'error',
      });
    }
  };

  const handleRequestRevision = async () => {
    if (!activeCreative) return;

    if (!revisionFeedback.trim()) {
      toast({
        title: 'Feedback required',
        message: 'Please provide notes detailing the necessary modifications.',
        type: 'error',
      });
      return;
    }

    try {
      await decideMutation.mutateAsync({
        approvalId: activeCreative.id,
        decision: 'CHANGES_REQUESTED',
        factChecklist: currentChecklist || activeCreative.checklist,
        feedback: revisionFeedback,
      });

      toast({
        title: 'Revision requested',
        message: 'Feedback submitted to production queue.',
        type: 'info',
      });

      setIsRevisionModalOpen(false);
      setRevisionFeedback('');
    } catch (err: unknown) {
      toast({
        title: 'Request failed',
        message: err instanceof Error ? err.message : 'Could not request revision',
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
        <span className="text-xs font-medium text-slate-500">
          Loading creative approvals workspace...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 p-6 space-y-3 bg-white shadow-xs max-w-xl mx-auto my-12">
        <div className="flex items-center space-x-2 text-rose-700 font-semibold text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error Loading Approvals Queue</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Could not communicate with the approvals verification service. Please verify your network connection and session credentials.
        </p>
        <Button size="sm" variant="secondary" onClick={() => refetch()} className="cursor-pointer">
          Retry Connection
        </Button>
      </div>
    );
  }

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
            <span className="text-[#10B981] font-semibold">Creative Approvals</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">Creative Approvals & Compliance</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              {pendingCount} Pending Review
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Verify pricing, configurations, amenities, CTAs, and RERA disclosures before broadcast.
          </p>
        </div>

        {/* Status Filter Tabs & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#1F2937] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              All ({creatives.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-[#1F2937] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'APPROVED'
                  ? 'bg-white text-[#1F2937] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              Approved ({approvedCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Refresh creative approvals queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. RBAC Permissions Advisory Banner */}
      {!canApprove && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs flex items-center gap-3 text-xs">
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <p className="font-bold text-amber-900 text-sm">Review-Only Mode</p>
            <p className="text-amber-800/90 text-xs mt-0.5">
              Logged in as <strong className="capitalize">{userRole}</strong>. Authorizing release or requesting revisions requires <strong>marketing_manager</strong>, <strong>client_approver</strong>, or <strong>admin</strong> privileges.
            </p>
          </div>
        </div>
      )}

      {/* 3. Empty Queue or Master-Detail Split Workspace */}
      {creatives.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-12 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
          <EmptyState
            icon={<ShieldCheck className="w-12 h-12 text-[#10B981]" />}
            title="No Creatives in Approvals Queue"
            description="All submitted campaigns and creative assets have been reviewed or none match the selected filter."
          />
        </div>
      ) : activeCreative && currentChecklist ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Creatives Queue List (4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Review Queue ({creatives.length})
              </span>
              <span className="text-xs text-slate-400">
                Select an item to inspect
              </span>
            </div>

            <div className="space-y-2.5 max-h-[820px] overflow-y-auto pr-1">
              {creatives.map((item) => {
                const isSelected = item.id === activeCreative.id;
                const isApprovedItem = item.status === 'Approved';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCreativeId(item.id)}
                    className={`p-4 rounded-2xl text-left cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-[#10B981] bg-[#F0FDF4]/70 shadow-[0_0_2px_0_rgba(16,185,129,0.3),0_8px_16px_-4px_rgba(16,185,129,0.15)] ring-1 ring-[#10B981]/30'
                        : 'border-[#EDF0F2] bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.projectName}</span>
                      </span>
                      <StatusBadge status={item.status} />
                    </div>

                    <h4 className="text-sm font-bold text-[#1F2937] line-clamp-2 leading-snug">
                      {item.creativeTitle}
                    </h4>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs text-[#64748B]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700">
                          {item.format.replace(/_/g, ' ')}
                        </span>
                        <span className="truncate text-slate-400">&bull; {item.channel}</span>
                      </div>

                      {isApprovedItem ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981] shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 shrink-0">
                          Pending
                        </span>
                      )}
                    </div>

                    {item.revisions && item.revisions.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-dashed border-slate-100 text-[11px] text-[#64748B]">
                        <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">By {item.revisions[item.revisions.length - 1].author}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="shrink-0 text-slate-400">{item.revisions[item.revisions.length - 1].date}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Creative Inspection & RERA Checklist (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Master Header Card: Active Item Details & Action Buttons */}
            <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#E8F7F1] text-xs font-semibold text-[#10B981] border border-[#10B981]/20">
                    {activeCreative.format.replace(/_/g, ' ')}
                  </span>
                  <StatusBadge status={activeCreative.status} />
                </div>
                <h3 className="text-lg font-bold text-[#1F2937] truncate">
                  {activeCreative.creativeTitle}
                </h3>
                <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeCreative.projectName}</span>
                  <span>&bull;</span>
                  <span>{activeCreative.channel}</span>
                </p>
              </div>

              {/* Review Actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsRevisionModalOpen(true)}
                  disabled={!canApprove}
                  leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                  className="rounded-xl font-semibold cursor-pointer border-[#EDF0F2] hover:bg-slate-50"
                >
                  Request Revision
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleApprove}
                  disabled={!canApprove || decideMutation.isPending || !allChecked}
                  isLoading={decideMutation.isPending}
                  leftIcon={<Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  className={`rounded-xl font-semibold shadow-xs cursor-pointer ${
                    allChecked
                      ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                  title={allChecked ? 'Authorize release' : 'All 5 statutory facts must be verified first'}
                >
                  Authorize Release
                </Button>
              </div>
            </div>

            {/* Split Inspection: Media Asset Preview + Statutory Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Box 1: Creative Media Asset & Ad Copy Hook */}
              <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[#E8F7F1] text-[#10B981] flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1F2937]">Generated Creative</h4>
                      <p className="text-[11px] text-[#64748B]">Original aspect ratio asset</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {activeCreative.format.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Media Container with Safe Fallback & Non-Cropping Aspect Ratio */}
                {(() => {
                  const isVideo = Boolean(activeCreative.assetUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i));
                  const containerAspectClass =
                    activeCreative.format === 'INSTAGRAM_REEL'
                      ? 'aspect-[9/16] max-h-[520px]'
                      : activeCreative.format === 'LINKEDIN_POST'
                      ? 'aspect-[16/9]'
                      : 'aspect-[4/5]';

                  return (
                    <div className={`relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 ${containerAspectClass} mx-auto w-full flex items-center justify-center group shadow-inner`}>
                      {imageErrors[activeCreative.id] ? (
                        <div className="p-6 text-center space-y-2 text-slate-400">
                          <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
                          <p className="text-xs font-semibold text-slate-300">Media Preview Unavailable</p>
                          <p className="text-[11px] text-slate-500">Asset URL could not be resolved directly.</p>
                          <a
                            href={activeCreative.assetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#10B981] hover:underline pt-2 font-medium"
                          >
                            <span>Open Raw URL</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : isVideo ? (
                        <video
                          src={activeCreative.assetUrl}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <>
                          <img
                            src={activeCreative.assetUrl}
                            alt={activeCreative.creativeTitle}
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                            onError={() =>
                              setImageErrors((prev) => ({ ...prev, [activeCreative.id]: true }))
                            }
                          />

                          {/* Full Resolution Overlay Action */}
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                            <a
                              href={activeCreative.assetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#10B981]" />
                              <span>Inspect Full Resolution</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Copy, Headline & CTA Inspection */}
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Headline Hook
                    </span>
                    <p className="text-xs font-semibold text-[#1F2937]">
                      {activeCreative.copyHeadline}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Body Copy &amp; Messaging
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {activeCreative.bodyCopy}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#E8F7F1]/40 border border-[#10B981]/20 text-xs">
                    <span className="font-semibold text-slate-600">Call-To-Action (CTA):</span>
                    <span className="font-bold text-[#10B981] bg-white px-2.5 py-1 rounded-lg border border-[#10B981]/25 shadow-2xs">
                      {activeCreative.cta}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Statutory Truth & RERA Checklist Card */}
              <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[#E8F7F1] text-[#10B981] flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1F2937]">Statutory &amp; RERA Checklist</h4>
                      <p className="text-[11px] text-[#64748B]">All 5 checks mandatory before broadcast</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      allChecked
                        ? 'bg-[#E8F7F1] text-[#10B981] border-[#10B981]/30'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {verifiedCount}/5 Verified
                  </span>
                </div>

                {/* Checklist Progress Indicator */}
                <div className="space-y-1.5 pb-1">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        allChecked ? 'bg-[#10B981]' : 'bg-amber-500'
                      }`}
                      style={{ width: `${(verifiedCount / 5) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Verification Readiness</span>
                    <span
                      className={`font-semibold ${
                        allChecked ? 'text-[#10B981]' : 'text-amber-700'
                      }`}
                    >
                      {allChecked ? '100% Cleared for Release' : `${5 - verifiedCount} Remaining`}
                    </span>
                  </div>
                </div>

                {/* 5 Distinct Statutory Fact Cards */}
                <div className="space-y-2.5">
                  {/* Item 1: Price */}
                  <div
                    onClick={() => handleToggleChecklist('priceVerified')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      currentChecklist.priceVerified
                        ? 'border-[#10B981]/40 bg-[#F0FDF4]/60 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={currentChecklist.priceVerified}
                          onChange={() => handleToggleChecklist('priceVerified')}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            currentChecklist.priceVerified
                              ? 'bg-[#10B981] border-[#10B981] text-white shadow-2xs'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {currentChecklist.priceVerified && (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1F2937]">
                            1. Price &amp; Payment Structure
                          </span>
                          {currentChecklist.priceVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10B981] bg-[#E8F7F1] px-1.5 py-0.5 rounded-md">
                              <Check className="w-2.5 h-2.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {currentChecklist.priceDetails}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Item 2: Bedrooms & Layouts */}
                  <div
                    onClick={() => handleToggleChecklist('bedroomsVerified')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      currentChecklist.bedroomsVerified
                        ? 'border-[#10B981]/40 bg-[#F0FDF4]/60 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={currentChecklist.bedroomsVerified}
                          onChange={() => handleToggleChecklist('bedroomsVerified')}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            currentChecklist.bedroomsVerified
                              ? 'bg-[#10B981] border-[#10B981] text-white shadow-2xs'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {currentChecklist.bedroomsVerified && (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1F2937]">
                            2. Configuration &amp; Carpet Area
                          </span>
                          {currentChecklist.bedroomsVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10B981] bg-[#E8F7F1] px-1.5 py-0.5 rounded-md">
                              <Check className="w-2.5 h-2.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {currentChecklist.bedroomDetails}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Item 3: Amenities Claim */}
                  <div
                    onClick={() => handleToggleChecklist('amenitiesVerified')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      currentChecklist.amenitiesVerified
                        ? 'border-[#10B981]/40 bg-[#F0FDF4]/60 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={currentChecklist.amenitiesVerified}
                          onChange={() => handleToggleChecklist('amenitiesVerified')}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            currentChecklist.amenitiesVerified
                              ? 'bg-[#10B981] border-[#10B981] text-white shadow-2xs'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {currentChecklist.amenitiesVerified && (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1F2937]">
                            3. Lifestyle Amenities Confirmed
                          </span>
                          {currentChecklist.amenitiesVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10B981] bg-[#E8F7F1] px-1.5 py-0.5 rounded-md">
                              <Check className="w-2.5 h-2.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {currentChecklist.amenitiesDetails}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Item 4: CTA Destination */}
                  <div
                    onClick={() => handleToggleChecklist('ctaVerified')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      currentChecklist.ctaVerified
                        ? 'border-[#10B981]/40 bg-[#F0FDF4]/60 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={currentChecklist.ctaVerified}
                          onChange={() => handleToggleChecklist('ctaVerified')}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            currentChecklist.ctaVerified
                              ? 'bg-[#10B981] border-[#10B981] text-white shadow-2xs'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {currentChecklist.ctaVerified && (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1F2937]">
                            4. CTA &amp; Funnel Destination Compliant
                          </span>
                          {currentChecklist.ctaVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10B981] bg-[#E8F7F1] px-1.5 py-0.5 rounded-md">
                              <Check className="w-2.5 h-2.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {currentChecklist.ctaDetails}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Item 5: Mandatory Statutory & RERA Disclaimer */}
                  <div
                    onClick={() => handleToggleChecklist('reraDisclaimerVerified')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      currentChecklist.reraDisclaimerVerified
                        ? 'border-[#10B981]/40 bg-[#F0FDF4]/60 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={currentChecklist.reraDisclaimerVerified}
                          onChange={() => handleToggleChecklist('reraDisclaimerVerified')}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            currentChecklist.reraDisclaimerVerified
                              ? 'bg-[#10B981] border-[#10B981] text-white shadow-2xs'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {currentChecklist.reraDisclaimerVerified && (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1F2937]">
                            5. Mandatory RERA Registration Displayed
                          </span>
                          {currentChecklist.reraDisclaimerVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10B981] bg-[#E8F7F1] px-1.5 py-0.5 rounded-md">
                              <Check className="w-2.5 h-2.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {currentChecklist.reraDetails}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial Review Notes & Decision History Card */}
            {activeCreative.revisions.length > 0 && (
              <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 text-[#1F2937] flex items-center justify-center">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1F2937]">
                        Editorial Review Notes &amp; Decision History
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        Audit trail of comments, revision feedback, and past decisions
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {activeCreative.revisions.length} Entry{activeCreative.revisions.length === 1 ? '' : 'ies'}
                  </span>
                </div>

                <div className="space-y-3">
                  {activeCreative.revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-bold text-[#1F2937]">{rev.author}</span>
                        <span className="text-[11px]">{rev.date}</span>
                      </div>
                      <p className="text-slate-700 italic leading-relaxed">
                        &ldquo;{rev.notes}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 4. Revision Request Modal */}
      <Modal isOpen={isRevisionModalOpen} onClose={() => setIsRevisionModalOpen(false)}>
        <ModalContent className="max-w-xl rounded-2xl p-6 border-slate-100 shadow-xl">
          <ModalHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <ModalTitle className="text-lg font-bold text-[#1F2937]">Request Creative Revision</ModalTitle>
                <ModalDescription className="text-xs text-[#64748B]">
                  Detail required copy, visual, or statutory adjustments for the creative studio team.
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>

          <div className="py-4 space-y-4">
            <Textarea
              label="Revision Feedback & Instructions"
              rows={4}
              placeholder="e.g. Please update the pricing text in the headline to match the latest base selling price, and enlarge the RERA registration number..."
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              className="rounded-xl text-xs"
            />
            <p className="text-[11px] text-slate-400">
              This will update the approval status to <span className="font-semibold text-amber-700">Changes Requested</span> and notify the content production team.
            </p>
          </div>

          <ModalFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsRevisionModalOpen(false)}
              className="rounded-xl font-semibold cursor-pointer border-[#EDF0F2]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRequestRevision}
              isLoading={decideMutation.isPending}
              disabled={decideMutation.isPending || !revisionFeedback.trim()}
              className="rounded-xl font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
            >
              Submit Revision Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
