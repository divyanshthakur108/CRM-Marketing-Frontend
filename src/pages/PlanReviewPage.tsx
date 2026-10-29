import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
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
  MessageSquare,
  Sparkles,
  Building,
  Loader2,
  Calendar,
} from 'lucide-react';

export function PlanReviewPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  // Queries
  const { data: plans = [], isLoading: isPlansLoading, refetch: refetchPlans } = usePlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Default to first plan if available
  const activePlanId = useMemo(() => {
    if (selectedPlanId && plans.some((p) => p._id === selectedPlanId)) {
      return selectedPlanId;
    }
    return plans.length > 0 ? plans[0]._id : null;
  }, [plans, selectedPlanId]);

  const { data: planDetails, isLoading: isDetailsLoading } = usePlanDetails(activePlanId || undefined);

  // Mutations
  const approveMutation = useApprovePlan();
  const requestChangesMutation = useRequestChangesOnPlan();
  const generatePlanMutation = useGeneratePlan();

  // Revision Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');

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
        title: 'Action forbidden',
        message: 'Only marketing managers, client approvers, and organization owners can approve plans.',
        type: 'error',
      });
      return;
    }

    try {
      await approveMutation.mutateAsync({ planId: activePlanId });
      toast({
        title: 'Plan approved',
        message: 'The campaign plan has been approved and moved to publishing.',
        type: 'success',
      });
      refetchPlans();
    } catch (err: unknown) {
      toast({
        title: 'Approval failed',
        message: err instanceof Error ? err.message : 'Could not approve plan',
        type: 'error',
      });
    }
  };

  const handleRequestChanges = async () => {
    if (!activePlanId || !revisionComment.trim()) {
      toast({
        title: 'Comment required',
        message: 'Please provide notes on the changes requested.',
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
        title: 'Revisions requested',
        message: 'Feedback submitted to the team.',
        type: 'info',
      });
      setIsRevisionModalOpen(false);
      setRevisionComment('');
      refetchPlans();
    } catch (err: unknown) {
      toast({
        title: 'Submission failed',
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
        title: 'Plan generation started',
        message: 'Synthesizing monthly campaign deliverables.',
        type: 'success',
      });
      refetchPlans();
    } catch (err: unknown) {
      toast({
        title: 'Generation failed',
        message: err instanceof Error ? err.message : 'Could not generate plan',
        type: 'error',
      });
    }
  };

  if (isPlansLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
        <span className="text-[13px] text-[#737373]">
          Loading marketing plan review queue...
        </span>
      </div>
    );
  }

  const currentPlan = planDetails?.plan || plans[0];
  const currentItems = planDetails?.items || [];
  const currentApprovals = planDetails?.approvals || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Marketing plan review & sign-off"
        description="Audit AI-generated campaign plans, review copy hooks, request editorial revisions, or sign off for publishing."
        actions={
          <div className="flex items-center space-x-2">
            {plans.length === 0 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleGeneratePlan}
                isLoading={generatePlanMutation.isPending}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Generate draft plan
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsRevisionModalOpen(true)}
                  disabled={!canApprove}
                  leftIcon={<AlertCircle className="w-4 h-4" />}
                >
                  Request changes
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApprovePlan}
                  disabled={!canApprove || approveMutation.isPending}
                  isLoading={approveMutation.isPending}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Approve campaign plan
                </Button>
              </>
            )}
          </div>
        }
      />

      {!canApprove && (
        <div className="border border-[#E5E5E5] bg-[#F5F5F5] rounded-[8px] p-3 text-[13px] text-[#525252] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-[#0A0A0A] shrink-0" />
          <span>
            You are logged in with role <strong>{userRole}</strong>. Approvals and change requests require{' '}
            <strong>marketing_manager</strong> or <strong>client_approver</strong> permissions.
          </span>
        </div>
      )}

      {plans.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-10 h-10 text-[#737373]" />}
          title="No marketing plans found"
          description="There are no marketing plan cycles created yet for this organization. Generate a monthly schedule to begin stakeholder review."
          action={
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleGeneratePlan}
              isLoading={generatePlanMutation.isPending}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate monthly plan
            </Button>
          }
        />
      ) : (
        <>
          {/* Plan Selection Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isSelected = plan._id === activePlanId;
              return (
                <button
                  key={plan._id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan._id)}
                  className={`p-4 text-left border rounded-[10px] transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0A0A0A] bg-white shadow-card'
                      : 'border-[#E5E5E5] bg-white hover:border-[#737373]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#0A0A0A]">{plan.cycleName}</h3>
                      <span className="text-[12px] text-[#737373] flex items-center mt-0.5">
                        <Building className="w-3.5 h-3.5 mr-1 text-[#737373]" />
                        Month {plan.month}/{plan.year}
                      </span>
                    </div>
                    <StatusBadge status={plan.status} />
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-[#737373] pt-2 border-t border-[#E5E5E5]">
                    <span>v{plan.version}</span>
                    <span className="font-semibold text-[#0A0A0A] tabular-nums">
                      {formatCurrency(plan.allocatedBudget || 500000)} &bull; {plan.itemsCount} deliverables
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Plan Details & Creative Items */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Columns: Plan Strategy & Planned Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Strategy Summary Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b border-[#E5E5E5] pb-3">
                  <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
                    <span>Executive strategy &amp; growth objective</span>
                  </CardTitle>
                  {currentPlan && <StatusBadge status={currentPlan.status} />}
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <p className="text-[14px] text-[#525252] leading-relaxed bg-[#FAFAFA] p-3.5 rounded-[8px] border border-[#E5E5E5]">
                    {currentPlan?.strategySummary || 'Standard omni-channel luxury buyer acquisition campaign.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3 text-[13px] pt-1">
                    <div className="border border-[#E5E5E5] rounded-[8px] p-3">
                      <span className="text-[11px] text-[#737373] block">Total budget</span>
                      <span className="text-[14px] font-semibold text-[#0A0A0A] tabular-nums">
                        {formatCurrency(currentPlan?.allocatedBudget || 500000)}
                      </span>
                    </div>
                    <div className="border border-[#E5E5E5] rounded-[8px] p-3">
                      <span className="text-[11px] text-[#737373] block">Cycle</span>
                      <span className="text-[14px] font-semibold text-[#0A0A0A] tabular-nums">
                        Month {currentPlan?.month}/{currentPlan?.year}
                      </span>
                    </div>
                    <div className="border border-[#E5E5E5] rounded-[8px] p-3">
                      <span className="text-[11px] text-[#737373] block">Volume</span>
                      <span className="text-[14px] font-semibold text-[#0A0A0A] tabular-nums">
                        {currentItems.length || currentPlan?.itemsCount || 0} scheduled
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* List of Planned Creative Deliverables */}
              <Card>
                <CardHeader className="border-b border-[#E5E5E5] pb-3">
                  <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-[#0A0A0A]" />
                    <span>Scheduled deliverables breakdown ({currentItems.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {isDetailsLoading ? (
                    <div className="p-8 text-center text-[13px] text-[#737373] flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                      <span>Loading scheduled deliverables...</span>
                    </div>
                  ) : currentItems.length === 0 ? (
                    <div className="p-6 text-center text-[13px] text-[#737373]">
                      No items found for this plan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentItems.map((item, index) => (
                        <div
                          key={item._id}
                          className="border border-[#E5E5E5] rounded-[8px] bg-white p-3.5 hover:border-[#737373] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-[#0A0A0A] text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <h4 className="text-[14px] font-semibold text-[#0A0A0A]">{item.title || item.topic}</h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              {item.scheduledDate && (
                                <span className="text-[12px] text-[#737373] tabular-nums">
                                  {formatDisplayDate(item.scheduledDate)}
                                </span>
                              )}
                              <StatusBadge status="ACTIVE" label={item.type} />
                            </div>
                          </div>

                          <p className="text-[13px] text-[#525252] line-clamp-2 pl-7">
                            {item.creativeBrief}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Approval Trail & Decision Audit */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="border-b border-[#E5E5E5] pb-3">
                  <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-[#0A0A0A]" />
                    <span>Stakeholder approval trail</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {currentApprovals.length === 0 ? (
                    <div className="p-4 text-center text-[13px] text-[#737373] bg-[#FAFAFA] rounded-[8px] border border-[#E5E5E5]">
                      No formal review decisions recorded yet. Submit or approve plan to log the audit trail.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentApprovals.map((appr) => (
                        <div
                          key={appr._id}
                          className="border border-[#E5E5E5] rounded-[8px] bg-white p-3.5 space-y-2 text-[13px]"
                        >
                          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                            <span className="font-semibold text-[#0A0A0A]">
                              {appr.decidedByName || 'Reviewer'}
                            </span>
                            <StatusBadge status={appr.status} />
                          </div>

                          {appr.comments && appr.comments.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {appr.comments.map((c, idx) => (
                                <p key={idx} className="text-[#525252] italic">
                                  &ldquo;{c.text}&rdquo;
                                </p>
                              ))}
                            </div>
                          )}

                          <div className="text-[11px] text-[#737373] text-right pt-1 tabular-nums">
                            {appr.createdAt ? formatDisplayDate(appr.createdAt) : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Revision Modal */}
      <Modal isOpen={isRevisionModalOpen} onClose={() => setIsRevisionModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Request plan revisions</ModalTitle>
            <ModalDescription>
              Detail your required modifications for the marketing team. Status will transition to &ldquo;Needs Action&rdquo;.
            </ModalDescription>
          </ModalHeader>

          <div className="p-6 space-y-4">
            <Textarea
              label="Feedback & required changes"
              rows={4}
              placeholder="e.g. Please swap the high-budget reel to week 2 and emphasize payment schedule details..."
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
            />
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsRevisionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleRequestChanges}
              isLoading={requestChangesMutation.isPending}
            >
              Submit change request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
