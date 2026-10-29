import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
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
  Building,
  ShieldCheck,
  MessageSquare,
  Loader2,
} from 'lucide-react';

export function ApprovalsQueuePage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [selectedCreativeId, setSelectedCreativeId] = useState<string | null>(null);

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

    const allChecked =
      priceVerified && bedroomsVerified && amenitiesVerified && ctaVerified && reraDisclaimerVerified;

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
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
        <span className="text-[13px] text-[#737373]">
          Loading creative approvals queue...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border border-[#E5E5E5] rounded-[10px] p-6 space-y-3 bg-white">
        <div className="flex items-center space-x-2 text-[#B91C1C] font-semibold text-[14px]">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading approvals</span>
        </div>
        <p className="text-[13px] text-[#525252]">
          Could not communicate with the approvals verification service.
        </p>
        <Button size="sm" variant="secondary" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="Creative fact-check & approvals queue"
        description="Verify pricing, configurations, amenities, CTAs, and disclosures before broadcast."
        actions={
          <div className="flex items-center space-x-2">
            <div className="flex border border-[#E5E5E5] rounded-[8px] overflow-hidden bg-[#FAFAFA] p-0.5">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 text-[12px] rounded-[6px] font-medium transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-[#525252] hover:text-[#0A0A0A]'
                }`}
              >
                All ({creatives.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1 text-[12px] rounded-[6px] font-medium transition-colors ${
                  statusFilter === 'PENDING'
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-[#525252] hover:text-[#0A0A0A]'
                }`}
              >
                Pending review
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-3 py-1 text-[12px] rounded-[6px] font-medium transition-colors ${
                  statusFilter === 'APPROVED'
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-[#525252] hover:text-[#0A0A0A]'
                }`}
              >
                Approved
              </button>
            </div>
          </div>
        }
      />

      {!canApprove && (
        <div className="border border-[#E5E5E5] bg-[#F5F5F5] rounded-[8px] p-3 text-[13px] text-[#525252] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-[#0A0A0A] shrink-0" />
          <span>
            Logged in as <strong>{userRole}</strong>. Approving creatives requires{' '}
            <strong>marketing_manager</strong> or <strong>client_approver</strong> permissions.
          </span>
        </div>
      )}

      {creatives.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-10 h-10 text-[#737373]" />}
          title="No approvals in queue"
          description="All submitted creatives and campaigns have been processed or none match the selected filter."
        />
      ) : activeCreative && currentChecklist ? (
        /* Main Layout: Left Queue List + Right Fact-Check & Decision Pane */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: List of Creatives Awaiting Fact-Check */}
          <div className="lg:col-span-1 space-y-3">
            <span className="text-[12px] font-medium text-[#737373] block">
              Queue items ({creatives.length})
            </span>

            <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {creatives.map((item) => {
                const isSelected = item.id === activeCreative.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCreativeId(item.id)}
                    className={`p-3.5 border rounded-[10px] text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0A0A0A] bg-white shadow-card'
                        : 'border-[#E5E5E5] bg-white hover:border-[#737373]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[12px] text-[#737373] truncate">
                        {item.projectName}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>

                    <h4 className="text-[14px] font-semibold text-[#0A0A0A] line-clamp-2 leading-snug">
                      {item.creativeTitle}
                    </h4>

                    <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-[#E5E5E5] text-[12px] text-[#737373]">
                      <span>{item.format.replace('_', ' ')}</span>
                      <span>&bull;</span>
                      <span className="truncate max-w-[120px]">{item.channel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Selected Creative Inspection & Fact-Check Audit */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-[#E5E5E5] rounded-[10px] shadow-card">
              <div>
                <h3 className="text-[16px] font-semibold text-[#0A0A0A]">
                  {activeCreative.creativeTitle}
                </h3>
                <span className="text-[12px] text-[#737373] flex items-center mt-0.5">
                  <Building className="w-3.5 h-3.5 mr-1" />
                  {activeCreative.projectName} &bull; {activeCreative.format.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsRevisionModalOpen(true)}
                  disabled={!canApprove}
                  leftIcon={<AlertCircle className="w-3.5 h-3.5" />}
                >
                  Request revision
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApprove}
                  disabled={!canApprove || decideMutation.isPending}
                  isLoading={decideMutation.isPending}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Authorize release
                </Button>
              </div>
            </div>

            {/* Split Preview: Left Media Asset & Right Statutory Fact Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Creative Media Preview */}
              <Card>
                <CardHeader className="border-b border-[#E5E5E5] pb-3">
                  <CardTitle className="text-[14px] font-semibold text-[#0A0A0A] flex items-center justify-between">
                    <span>Generated creative asset</span>
                    <StatusBadge status="ACTIVE" label={activeCreative.format} />
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* Visual Asset Container */}
                  <div className="border border-[#E5E5E5] rounded-[8px] bg-[#0A0A0A] relative group overflow-hidden aspect-[4/5] flex items-center justify-center">
                    <img
                      src={activeCreative.assetUrl}
                      alt={activeCreative.creativeTitle}
                      className="w-full h-full object-cover"
                    />

                    {/* Preview overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <a
                        href={activeCreative.assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white text-[#0A0A0A] text-[12px] font-medium rounded-[6px] flex items-center space-x-1 hover:bg-[#F5F5F5]"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Inspect full-res</span>
                      </a>
                    </div>
                  </div>

                  {/* Ad Copy & Hook Inspection */}
                  <div className="space-y-2 border-t border-[#E5E5E5] pt-3 text-[13px]">
                    <div>
                      <span className="text-[12px] font-medium text-[#737373] block">
                        Copy headline hook
                      </span>
                      <p className="font-semibold text-[#0A0A0A] mt-0.5">{activeCreative.copyHeadline}</p>
                    </div>

                    <div>
                      <span className="text-[12px] font-medium text-[#737373] block">
                        Body messaging
                      </span>
                      <p className="text-[#525252] leading-relaxed text-[13px] mt-0.5">
                        {activeCreative.bodyCopy}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[12px] pt-1">
                      <span className="text-[#737373]">Call-to-action:</span>
                      <span className="font-semibold text-[#0A0A0A]">
                        {activeCreative.cta}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statutory Fact Checklist */}
              <Card>
                <CardHeader className="border-b border-[#E5E5E5] pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[14px] font-semibold text-[#0A0A0A] flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#0A0A0A]" />
                      <span>Statutory truth &amp; RERA checklist</span>
                    </CardTitle>
                    <StatusBadge status="ACTIVE" label="5 items" />
                  </div>
                  <p className="text-[12px] text-[#737373] mt-1">
                    All 5 items must be confirmed to prevent misleading advertising.
                  </p>
                </CardHeader>

                <CardContent className="p-4 space-y-3 pt-4">
                  {/* Checklist item 1: Price */}
                  <div className="border border-[#E5E5E5] rounded-[8px] p-3 space-y-1">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentChecklist.priceVerified}
                        onChange={() => handleToggleChecklist('priceVerified')}
                        className="mt-0.5 w-4 h-4 rounded-[4px] accent-[#0A0A0A] cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[13px] font-semibold text-[#0A0A0A] block">
                          1. Price &amp; payment structure verified
                        </span>
                        <p className="text-[12px] text-[#737373]">
                          {currentChecklist.priceDetails}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Checklist item 2: Bedrooms & Layouts */}
                  <div className="border border-[#E5E5E5] rounded-[8px] p-3 space-y-1">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentChecklist.bedroomsVerified}
                        onChange={() => handleToggleChecklist('bedroomsVerified')}
                        className="mt-0.5 w-4 h-4 rounded-[4px] accent-[#0A0A0A] cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[13px] font-semibold text-[#0A0A0A] block">
                          2. Configuration &amp; carpet area
                        </span>
                        <p className="text-[12px] text-[#737373]">
                          {currentChecklist.bedroomDetails}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Checklist item 3: Amenities Claim */}
                  <div className="border border-[#E5E5E5] rounded-[8px] p-3 space-y-1">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentChecklist.amenitiesVerified}
                        onChange={() => handleToggleChecklist('amenitiesVerified')}
                        className="mt-0.5 w-4 h-4 rounded-[4px] accent-[#0A0A0A] cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[13px] font-semibold text-[#0A0A0A] block">
                          3. Lifestyle amenities confirmed
                        </span>
                        <p className="text-[12px] text-[#737373]">
                          {currentChecklist.amenitiesDetails}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Checklist item 4: CTA Destination */}
                  <div className="border border-[#E5E5E5] rounded-[8px] p-3 space-y-1">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentChecklist.ctaVerified}
                        onChange={() => handleToggleChecklist('ctaVerified')}
                        className="mt-0.5 w-4 h-4 rounded-[4px] accent-[#0A0A0A] cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[13px] font-semibold text-[#0A0A0A] block">
                          4. CTA &amp; funnel destination compliant
                        </span>
                        <p className="text-[12px] text-[#737373]">
                          {currentChecklist.ctaDetails}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Checklist item 5: RERA Disclaimer */}
                  <div className="border border-[#E5E5E5] rounded-[8px] p-3 space-y-1">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentChecklist.reraDisclaimerVerified}
                        onChange={() => handleToggleChecklist('reraDisclaimerVerified')}
                        className="mt-0.5 w-4 h-4 rounded-[4px] accent-[#0A0A0A] cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[13px] font-semibold text-[#0A0A0A] block">
                          5. Mandatory statutory disclaimer displayed
                        </span>
                        <p className="text-[12px] text-[#737373]">
                          {currentChecklist.reraDetails}
                        </p>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revision Feedback Log */}
            {activeCreative.revisions.length > 0 && (
              <Card>
                <CardHeader className="border-b border-[#E5E5E5] pb-3">
                  <CardTitle className="text-[14px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-[#0A0A0A]" />
                    <span>Editorial review notes &amp; decision history</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {activeCreative.revisions.map((rev) => (
                      <div
                        key={rev.id}
                        className="border border-[#E5E5E5] rounded-[8px] bg-[#FAFAFA] p-3 text-[13px] space-y-1"
                      >
                        <div className="flex items-center justify-between text-[12px] text-[#737373]">
                          <span className="font-semibold text-[#0A0A0A]">{rev.author}</span>
                          <span>{rev.date}</span>
                        </div>
                        <p className="text-[#525252] italic">&ldquo;{rev.notes}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : null}

      {/* Revision Request Modal */}
      <Modal isOpen={isRevisionModalOpen} onClose={() => setIsRevisionModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Request creative revision</ModalTitle>
            <ModalDescription>
              Detail required copy, visual, or disclaimer corrections for the production team.
            </ModalDescription>
          </ModalHeader>

          <div className="p-6 space-y-4">
            <Textarea
              label="Revision feedback instructions"
              rows={4}
              placeholder="e.g. Please update the pricing text in the headline to match the latest base selling price, and enlarge the RERA registration number..."
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
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
              onClick={handleRequestRevision}
              isLoading={decideMutation.isPending}
            >
              Submit revision request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
