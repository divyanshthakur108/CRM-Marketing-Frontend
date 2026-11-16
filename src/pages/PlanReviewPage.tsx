import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { formatCurrency, formatDisplayDate } from '../lib/formatters';

function renderBudget(budget?: number | null): string {
  if (typeof budget === 'number' && !isNaN(budget)) {
    return formatCurrency(budget);
  }
  return 'Not allocated';
}
import {
  usePlans,
  usePlanDetails,
  useApprovePlan,
  useRequestChangesOnPlan,
  useGeneratePlan,
} from '../hooks/usePlans';
import { useAuthStore } from '../store/useAuthStore';
import {
  FileCheck,
  Check,
  AlertCircle,
  Sparkles,
  Building2,
  Loader2,
  Calendar,
  RefreshCw,
  Radio,
  Lock,
  Clock,
  AlertTriangle,
  History,
} from 'lucide-react';

export function PlanReviewPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  // Queries
  const { data: plans = [], isLoading: isPlansLoading, isError: isPlansError, refetch: refetchPlans } = usePlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Default to first plan if available
  const activePlanId = useMemo(() => {
    if (selectedPlanId && plans.some((p) => p._id === selectedPlanId)) {
      return selectedPlanId;
    }
    return plans.length > 0 ? plans[0]._id : null;
  }, [plans, selectedPlanId]);

  const { data: planDetails, isLoading: isDetailsLoading, refetch: refetchDetails } = usePlanDetails(
    activePlanId || undefined
  );

  // Mutations
  const approveMutation = useApprovePlan();
  const requestChangesMutation = useRequestChangesOnPlan();
  const generatePlanMutation = useGeneratePlan();

  // Dialog & Modal States
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  // Synchronized active plan entities (unconditionally derived at top-level)
  const currentPlan = useMemo(() => {
    if (planDetails?.plan && planDetails.plan._id === activePlanId) {
      return planDetails.plan;
    }
    return plans.find((p) => p._id === activePlanId) || null;
  }, [planDetails, plans, activePlanId]);

  const currentItems = useMemo(() => {
    if (planDetails?.plan?._id === activePlanId && planDetails.items) {
      return planDetails.items;
    }
    return [];
  }, [planDetails, activePlanId]);

  const currentApprovals = useMemo(() => {
    if (planDetails?.plan?._id === activePlanId && planDetails.approvals) {
      return planDetails.approvals;
    }
    return [];
  }, [planDetails, activePlanId]);

  const isPlanApproved = currentPlan?.status === 'APPROVED';

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

  const handleApprovePlan = async () => {
    if (!activePlanId) return;

    if (!canApprove) {
      toast({
        title: 'Action Forbidden',
        message: 'Only marketing managers, client approvers, and organization owners can approve plans.',
        type: 'error',
      });
      return;
    }

    try {
      await approveMutation.mutateAsync({ planId: activePlanId });
      setShowApproveConfirm(false);
      toast({
        title: 'Campaign Plan Approved',
        message: 'The campaign plan has been cleared and scheduled deliverables advanced to production.',
        type: 'success',
      });
      refetchPlans();
      refetchDetails();
    } catch (err: unknown) {
      toast({
        title: 'Approval Failed',
        message: err instanceof Error ? err.message : 'Could not approve plan',
        type: 'error',
      });
    }
  };

  const handleRequestChanges = async () => {
    if (!activePlanId) return;

    if (!revisionComment.trim()) {
      toast({
        title: 'Feedback Required',
        message: 'Please provide notes detailing the requested plan modifications.',
        type: 'error',
      });
      return;
    }

    try {
      await requestChangesMutation.mutateAsync({
        planId: activePlanId,
        comments: revisionComment,
      });
      toast({
        title: 'Revisions Requested',
        message: 'Feedback submitted to the marketing strategy team.',
        type: 'info',
      });
      setIsRevisionModalOpen(false);
      setRevisionComment('');
      refetchPlans();
      refetchDetails();
    } catch (err: unknown) {
      toast({
        title: 'Submission Failed',
        message: err instanceof Error ? err.message : 'Could not request revisions',
        type: 'error',
      });
    }
  };

  const handleGeneratePlan = async () => {
    try {
      const now = new Date();
      await generatePlanMutation.mutateAsync({
        month: now.toLocaleString('en-US', { month: 'long' }),
        year: now.getFullYear(),
      });
      toast({
        title: 'Plan Generation Started',
        message: 'Synthesizing monthly campaign deliverables and channels.',
        type: 'success',
      });
      refetchPlans();
    } catch (err: unknown) {
      toast({
        title: 'Generation Failed',
        message: err instanceof Error ? err.message : 'Could not generate plan',
        type: 'error',
      });
    }
  };

  if (isPlansLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
        <span className="text-xs font-medium text-slate-500">
          Loading marketing plan review queue...
        </span>
      </div>
    );
  }

  if (isPlansError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-center text-rose-700 space-y-3 max-w-xl mx-auto shadow-xs my-12">
        <div className="flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <p className="font-semibold text-sm">Failed to load marketing plans from server.</p>
        </div>
        <p className="text-xs text-rose-600">Please verify API connection or retry your session.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchPlans()}
          className="rounded-xl border-rose-300 text-rose-800 hover:bg-rose-100 cursor-pointer"
        >
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
            <span className="text-[#10B981] font-semibold">Plan Review</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Marketing Plan Review
            </h1>
            {currentPlan && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20">
                <Radio className="w-3.5 h-3.5" />
                Cycle v{currentPlan.version} &bull; {currentPlan.cycleName || `Month ${currentPlan.month}/${currentPlan.year}`}
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Audit AI-generated campaign plans, review copy hooks, request editorial revisions, or sign off for publishing.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {plans.length === 0 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleGeneratePlan}
              isLoading={generatePlanMutation.isPending}
              leftIcon={<Sparkles className="w-4 h-4" />}
              className="rounded-xl font-semibold bg-[#10B981] hover:bg-[#059669] text-white shadow-xs cursor-pointer"
            >
              Generate Draft Plan
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsRevisionModalOpen(true)}
                disabled={!canApprove || isPlanApproved}
                leftIcon={<AlertCircle className="w-3.5 h-3.5" />}
                className="rounded-xl font-semibold border-[#EDF0F2] hover:bg-slate-50 cursor-pointer shadow-xs"
              >
                Request Changes
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setShowApproveConfirm(true)}
                disabled={!canApprove || approveMutation.isPending || isPlanApproved}
                isLoading={approveMutation.isPending}
                leftIcon={<Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                className={`rounded-xl font-semibold shadow-xs cursor-pointer ${
                  isPlanApproved
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white'
                }`}
              >
                {isPlanApproved ? 'Plan Approved' : 'Approve Campaign Plan'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  refetchPlans();
                  refetchDetails();
                }}
                disabled={isPlansLoading || isDetailsLoading}
                className="p-2 rounded-xl border border-[#EDF0F2] bg-white text-[#64748B] hover:text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                title="Refresh plan details"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDetailsLoading ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. RBAC Permissions Advisory Banner */}
      {!canApprove && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs flex items-center gap-3 text-xs">
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <p className="font-bold text-amber-900 text-sm">Review-Only Access</p>
            <p className="text-amber-800/90 text-xs mt-0.5">
              Logged in as <strong className="capitalize">{userRole}</strong>. Approving campaign plans or submitting change requests requires <strong>marketing_manager</strong>, <strong>client_approver</strong>, or <strong>admin</strong> privileges.
            </p>
          </div>
        </div>
      )}

      {/* 3. Empty State or Active Plan Workspace */}
      {plans.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-12 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
          <EmptyState
            icon={<Calendar className="w-12 h-12 text-[#10B981]" />}
            title="No Marketing Plans Found"
            description="There are no marketing plan cycles created yet for this organization. Generate a monthly schedule to begin stakeholder review."
            action={
              <Button
                type="button"
                size="sm"
                onClick={handleGeneratePlan}
                isLoading={generatePlanMutation.isPending}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="rounded-xl font-semibold bg-[#10B981] hover:bg-[#059669] text-white shadow-xs cursor-pointer mt-2"
              >
                Generate Monthly Plan
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* 4. Monthly Plan Selection Cards Strip */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block px-1">
              Marketing Plan Cycles ({plans.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isSelected = plan._id === activePlanId;
                return (
                  <button
                    key={plan._id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan._id)}
                    className={`p-4 text-left rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#10B981] bg-[#F0FDF4]/70 shadow-[0_0_2px_0_rgba(16,185,129,0.3),0_8px_16px_-4px_rgba(16,185,129,0.15)] ring-1 ring-[#10B981]/30'
                        : 'border-[#EDF0F2] bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1F2937] truncate">{plan.cycleName}</h3>
                        <span className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Month {plan.month}/{plan.year}</span>
                        </span>
                      </div>
                      <StatusBadge status={plan.status} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#64748B] pt-2.5 border-t border-slate-100">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700">
                        v{plan.version}
                      </span>
                      <span className="font-semibold text-[#1F2937] tabular-nums">
                        {renderBudget(plan.allocatedBudget)} &bull; {plan.itemsCount} deliverables
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Master-Detail Layout: Left Main Area + Right Approval Trail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Plan Strategy & Scheduled Deliverables */}
            <div className="lg:col-span-8 space-y-6">
              {/* Executive Strategy Card */}
              <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F2937]">
                        Executive Strategy &amp; Objective
                      </h3>
                      <p className="text-[11px] text-[#64748B]">Multi-channel growth thesis for cycle</p>
                    </div>
                  </div>
                  {currentPlan && <StatusBadge status={currentPlan.status} />}
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 text-xs text-slate-700 leading-relaxed font-normal">
                  {currentPlan?.strategySummary || 'No executive strategy summary recorded for this cycle.'}
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Allocated Budget
                    </span>
                    <span className="text-base font-bold text-[#1F2937] tabular-nums mt-0.5 block">
                      {renderBudget(currentPlan?.allocatedBudget)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Campaign Cycle
                    </span>
                    <span className="text-base font-bold text-[#1F2937] tabular-nums mt-0.5 block">
                      Month {currentPlan?.month}/{currentPlan?.year}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Content Volume
                    </span>
                    <span className="text-base font-bold text-[#1F2937] tabular-nums mt-0.5 block">
                      {currentItems.length || currentPlan?.itemsCount || 0} Deliverables
                    </span>
                  </div>
                </div>
              </div>

              {/* Scheduled Deliverables Breakdown */}
              <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 text-[#1F2937] flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F2937]">
                        Scheduled Deliverables Breakdown
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Chronological sequence of content releases &amp; creatives
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {currentItems.length} Deliverable{currentItems.length === 1 ? '' : 's'}
                  </span>
                </div>

                {isDetailsLoading ? (
                  <div className="p-12 text-center text-xs text-[#64748B] flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                    <span>Loading scheduled deliverables...</span>
                  </div>
                ) : currentItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50/80 rounded-xl border border-slate-100">
                    No deliverables found for this plan cycle.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentItems.map((item, index) => (
                      <div
                        key={item._id}
                        className="rounded-xl border border-[#EDF0F2] bg-white p-4 hover:border-slate-300 hover:shadow-2xs transition-all space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[#1F2937] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#1F2937] truncate">
                                {item.title || item.topic}
                              </h4>
                              {item.projectName && (
                                <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  <span>{item.projectName}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            {item.scheduledDate && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formatDisplayDate(item.scheduledDate)}
                              </span>
                            )}
                            <StatusBadge status="ACTIVE" label={item.type.replace(/_/g, ' ')} />
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pl-8">
                          {item.creativeBrief}
                        </p>

                        {(item.channel || item.targetAudience) && (
                          <div className="flex flex-wrap items-center gap-3 pl-8 pt-1 text-[11px] text-slate-500">
                            {item.channel && (
                              <span>
                                Channel: <strong className="text-slate-700">{item.channel}</strong>
                              </span>
                            )}
                            {item.targetAudience && (
                              <>
                                <span>&bull;</span>
                                <span>
                                  Audience:{' '}
                                  <strong className="text-slate-700">{item.targetAudience}</strong>
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Columns: Stakeholder Approval Trail */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 text-[#1F2937] flex items-center justify-center shrink-0">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F2937]">Approval Trail</h3>
                      <p className="text-[11px] text-[#64748B]">Stakeholder decision history</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {currentApprovals.length} Event{currentApprovals.length === 1 ? '' : 's'}
                  </span>
                </div>

                {currentApprovals.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#64748B] bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-semibold text-slate-700">No Decisions Recorded</p>
                    <p className="text-[11px] text-slate-500">
                      Submit feedback or approve this plan cycle to log stakeholder audit records.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentApprovals.map((appr) => (
                      <div
                        key={appr._id}
                        className="rounded-xl border border-[#EDF0F2] bg-white p-3.5 space-y-2 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-[#1F2937]">
                            {appr.decidedByName || 'Reviewer'}
                          </span>
                          <StatusBadge status={appr.status} />
                        </div>

                        {appr.comments && appr.comments.length > 0 && (
                          <div className="space-y-1 pt-0.5">
                            {appr.comments.map((c, idx) => (
                              <p key={idx} className="text-slate-600 italic leading-relaxed text-[11px]">
                                &ldquo;{c.text}&rdquo;
                              </p>
                            ))}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 text-right pt-1 tabular-nums border-t border-slate-50">
                          {appr.createdAt ? formatDisplayDate(appr.createdAt) : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 6. Request Revision Modal */}
      <Modal isOpen={isRevisionModalOpen} onClose={() => setIsRevisionModalOpen(false)}>
        <ModalContent className="max-w-xl rounded-2xl p-6 border-slate-100 shadow-xl">
          <ModalHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <ModalTitle className="text-lg font-bold text-[#1F2937]">Request Plan Changes</ModalTitle>
                <ModalDescription className="text-xs text-[#64748B]">
                  Detail required strategy, scheduling, or budget adjustments for the marketing team.
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>

          <div className="py-4 space-y-4">
            <Textarea
              label="Feedback & Required Changes"
              rows={4}
              placeholder="e.g. Please swap the high-budget reel to week 2 and emphasize payment schedule details..."
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              className="rounded-xl text-xs"
            />
            <p className="text-[11px] text-slate-400">
              The plan status will transition to <span className="font-semibold text-amber-700">Changes Requested</span> and notify project stakeholders.
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
              onClick={handleRequestChanges}
              isLoading={requestChangesMutation.isPending}
              disabled={requestChangesMutation.isPending || !revisionComment.trim()}
              className="rounded-xl font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
            >
              Submit Change Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 7. Approve Plan Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprovePlan}
        isLoading={approveMutation.isPending}
        variant="primary"
        title="Approve Campaign Plan?"
        description={
          <div className="space-y-2 text-xs text-slate-600">
            <p>
              Are you sure you want to approve{' '}
              <strong className="text-slate-900 font-semibold">
                &ldquo;{currentPlan?.cycleName || 'Current Plan Cycle'}&rdquo;
              </strong>
              ?
            </p>
            <div className="p-3 rounded-xl bg-[#E8F7F1] border border-[#10B981]/20 space-y-1 text-slate-800 text-[11px]">
              <p className="font-semibold text-[#10B981] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Downstream Publishing Scope:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                <li>Locks strategy and budget allocation ({renderBudget(currentPlan?.allocatedBudget)}).</li>
                <li>Advances {currentItems.length} scheduled deliverables to Creative Approvals.</li>
                <li>Prepares multi-channel calendar for scheduled broadcasts.</li>
              </ul>
            </div>
          </div>
        }
        confirmText="Confirm &amp; Approve Plan"
        cancelText="Cancel"
      />
    </div>
  );
}
