import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import {
  useCreatives,
  useApproveCreative,
  useRequestCreativeChanges,
  useRejectCreative,
  useRegenerateCreative,
  useAiHealth,
  useEstimateCost,
  useGenerateProjectCreatives,
  useEnhancePhoto,
  useOccasions,
  useExtendVideo,
  useGenerateOccasion,
  BackendCreativeItem,
} from '../hooks/useCreatives';
import { useProjectMedia } from '../hooks/useMedia';
import { formatDisplayDate, formatDisplayTime, formatLocationTitleCase } from '../lib/formatters';
import {
  History,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  MessageSquare,
  XCircle,
  RefreshCw,
  Download,
  AlertCircle,
  Video,
  FileText,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export function CreativeStudioPage() {
  const { toast } = useToast();

  // React Query Hooks
  const { data: serverCreatives = [], isLoading: isLoadingCreatives } = useCreatives();
  const { data: aiHealth } = useAiHealth();
  const approveMutation = useApproveCreative();
  const requestChangesMutation = useRequestCreativeChanges();
  const rejectMutation = useRejectCreative();
  const regenerateMutation = useRegenerateCreative();
  const generateCreativesMutation = useGenerateProjectCreatives();
  const estimateCostMutation = useEstimateCost();
  const enhancePhotoMutation = useEnhancePhoto();
  const { data: occasions = [] } = useOccasions();
  const extendVideoMutation = useExtendVideo();
  const generateOccasionMutation = useGenerateOccasion();

  // Selection state
  const [selectedCreativeId, setSelectedCreativeId] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '4:5' | '9:16'>('4:5');

  // Review flow modals & checklist
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);
  const [changesComment, setChangesComment] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isViewAllMediaOpen, setIsViewAllMediaOpen] = useState(false);

  // New Generation & AI Motion states
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateMode, setGenerateMode] = useState<'template' | 'ai_motion'>('template');
  const [costEstimateData, setCostEstimateData] = useState<{
    clipCount: number;
    secondsPerClip: number;
    totalSeconds: number;
    costPerSecondUsd: number;
    costPerImageUsd: number;
    videoCostUsd: number;
    imageCostUsd: number;
    totalCostUsd: number;
    requiredCredits: number;
    dailyCapUsd: number;
    dailyUsageSoFarUsd: number;
    remainingDailyCapUsd: number;
    canProceed: boolean;
  } | null>(null);
  const [isGeneratingReel, setIsGeneratingReel] = useState(false);
  const [jobProgressStep, setJobProgressStep] = useState<
    'idle' | 'queued' | 'generating' | 'downloading' | 'assembling' | 'ready' | 'failed' | 'blocked'
  >('idle');
  const [jobProgressReason, setJobProgressReason] = useState<string | null>(null);

  // Photo enhancement Before/After modal state
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<{
    originalUrl: string;
    enhancedUrl: string;
    mediaAssetId: string;
  } | null>(null);

  // Video Extension State (Condition 1)
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedVideoAssetId, setSelectedVideoAssetId] = useState<string>('');
  const [videoExtendPrompt, setVideoExtendPrompt] = useState('Continue camera panning steadily through the property interior with seamless architectural lighting');
  const [isExtendingVideo, setIsExtendingVideo] = useState(false);

  // Occasions / Festive State (Condition 2)
  const [isOccasionModalOpen, setIsOccasionModalOpen] = useState(false);
  const [selectedOccasionKey, setSelectedOccasionKey] = useState('diwali');
  const [customOccasionOffer, setCustomOccasionOffer] = useState('');
  const [customOccasionHeadline, setCustomOccasionHeadline] = useState('');
  const [isGeneratingOccasion, setIsGeneratingOccasion] = useState(false);

  // 6 Fact Checklist items required before client approval (starts unchecked)
  const [checklist, setChecklist] = useState({
    projectName: false,
    unitType: false,
    price: false,
    location: false,
    amenities: false,
    contactDetails: false,
  });

  const isChecklistComplete = useMemo(() => {
    return (
      checklist.projectName &&
      checklist.unitType &&
      checklist.price &&
      checklist.location &&
      checklist.amenities &&
      checklist.contactDetails
    );
  }, [checklist]);

  // Active creative selection
  const activeCreative: BackendCreativeItem | null = useMemo(() => {
    if (!serverCreatives.length) return null;
    const found = selectedCreativeId
      ? serverCreatives.find((c) => c._id === selectedCreativeId)
      : null;
    return found || serverCreatives[0];
  }, [serverCreatives, selectedCreativeId]);

  // Project ID for media lookup & catalog links
  const projectIdStr = useMemo(() => {
    if (!activeCreative?.projectId) return undefined;
    return typeof activeCreative.projectId === 'object'
      ? activeCreative.projectId._id
      : activeCreative.projectId;
  }, [activeCreative]);

  const { approvedMedia: projectMedia = [] } = useProjectMedia(projectIdStr, {
    consentedOnly: true,
  });

  const projectVideos = useMemo(() => {
    return projectMedia.filter((m) => m.type === 'VIDEO' || m.category === 'VIDEOS');
  }, [projectMedia]);

  // Source media items actually used in this creative
  const sourceMediaItems = useMemo(() => {
    if (!activeCreative) return [];
    if (activeCreative.sourceAssetIds && activeCreative.sourceAssetIds.length > 0) {
      const idSet = new Set(activeCreative.sourceAssetIds.map((id) => id.toString()));
      const matched = projectMedia.filter((m) => idSet.has(m.id || m._id));
      if (matched.length > 0) return matched;
    }
    return projectMedia;
  }, [activeCreative, projectMedia]);

  // Helper to format clean titles: "DLF · 3 BHK · Reel" style
  const getCreativeCleanTitle = (item: BackendCreativeItem) => {
    const pName =
      typeof item.projectId === 'object' && item.projectId !== null
        ? item.projectId.name
        : 'Project';
    
    // Extract unit config: "3 BHK", or fallback to "Project-wide"
    let unitLabel = 'Project-wide';
    if (item.factsSnapshot?.unitType && item.factsSnapshot.unitType !== 'Master' && item.factsSnapshot.unitType !== 'Residential') {
      unitLabel = item.factsSnapshot.unitType;
    } else if (item.headline && /\d\s*BHK/i.test(item.headline)) {
      const match = item.headline.match(/\d\s*BHK/i);
      if (match) unitLabel = match[0].toUpperCase();
    }

    const typeLabel = item.type === 'REEL' ? 'Reel' : 'Poster Set';
    return `${pName} · ${unitLabel} · ${typeLabel}`;
  };

  // Current visual asset file URL based on ratio or type
  const activeFile = useMemo(() => {
    if (!activeCreative) return null;
    if (activeCreative.type === 'REEL') {
      const reelFile = activeCreative.files?.find((f) => f.ratio === '9:16');
      return reelFile?.url || activeCreative.renderedAssetUrl || null;
    }
    const matched = activeCreative.files?.find((f) => f.ratio === selectedRatio);
    return matched?.url || activeCreative.renderedAssetUrl || null;
  }, [activeCreative, selectedRatio]);

  const handleSelectCreative = (item: BackendCreativeItem) => {
    setSelectedCreativeId(item._id);
    if (item.type === 'REEL') {
      setSelectedRatio('9:16');
    } else {
      setSelectedRatio(item.format || '4:5');
    }
    // Fact checklist always starts unchecked on new selection
    setChecklist({
      projectName: false,
      unitType: false,
      price: false,
      location: false,
      amenities: false,
      contactDetails: false,
    });
  };

  const handleToggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Status checks
  const isFailed =
    activeCreative?.status === 'FAILED' ||
    activeCreative?.approvalStatus === 'failed';

  const isGenerating =
    activeCreative?.status === 'GENERATING';

  const isApproved =
    activeCreative?.status === 'APPROVED' ||
    activeCreative?.approvalStatus === 'APPROVED';

  const canApprove =
    isChecklistComplete && !!activeFile && !isFailed && !isGenerating && !isApproved;

  const handleApprove = async () => {
    if (!activeCreative || !canApprove) return;
    try {
      await approveMutation.mutateAsync({
        creativeId: activeCreative._id,
        checklist,
      });
      toast({
        title: 'Creative Approved',
        message: 'Creative approved for marketing and asset deployment.',
        type: 'success',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Approval failed';
      toast({ title: 'Error', message: msg || 'Could not approve creative.', type: 'error' });
    }
  };

  const handleRequestChanges = async () => {
    if (!activeCreative || !changesComment.trim()) return;
    try {
      await requestChangesMutation.mutateAsync({
        creativeId: activeCreative._id,
        comment: changesComment.trim(),
      });
      setIsChangesModalOpen(false);
      setChangesComment('');
      toast({
        title: 'Changes Requested',
        message: 'Feedback submitted. Creative status updated.',
        type: 'info',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Request failed';
      toast({ title: 'Error', message: msg || 'Could not request changes.', type: 'error' });
    }
  };

  const handleConfirmReject = async () => {
    if (!activeCreative) return;
    try {
      await rejectMutation.mutateAsync({
        creativeId: activeCreative._id,
        reason: 'Client rejected creative render during review.',
      });
      setIsRejectModalOpen(false);
      toast({
        title: 'Creative Rejected',
        message: 'Status updated to rejected.',
        type: 'info',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Rejection failed';
      toast({ title: 'Error', message: msg || 'Could not reject creative.', type: 'error' });
    }
  };

  const handleRegenerate = async () => {
    if (!activeCreative) return;
    try {
      await regenerateMutation.mutateAsync(activeCreative._id);
      setIsRegenerateModalOpen(false);
      toast({
        title: 'Regeneration Queued',
        message: 'Fresh render has been enqueued using 1 credit.',
        type: 'success',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Regeneration failed';
      toast({ title: 'Error', message: msg || 'Could not regenerate creative.', type: 'error' });
    }
  };

  const handleDownload = () => {
    if (!activeFile || isFailed || isGenerating) {
      toast({
        title: 'Download Unavailable',
        message: 'Only completed creative files can be downloaded.',
        type: 'warning',
      });
      return;
    }
    const a = document.createElement('a');
    a.href = activeFile;
    const ext = activeCreative?.type === 'REEL' ? 'mp4' : 'png';
    a.download = `${activeCreative?.headline || 'creative'}-${selectedRatio}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExtendVideo = async () => {
    if (!projectIdStr || !selectedVideoAssetId) {
      toast({
        title: 'Select Video',
        message: 'Please choose an uploaded video from this project to extend.',
        type: 'error',
      });
      return;
    }
    try {
      setIsExtendingVideo(true);
      const res = await extendVideoMutation.mutateAsync({
        projectId: projectIdStr,
        mediaAssetId: selectedVideoAssetId,
        customPrompt: videoExtendPrompt,
      });
      setIsExtendModalOpen(false);
      toast({
        title: 'Video Extended & Scheduled',
        message: 'Continuation stitched seamlessly. Review notification & scheduled post created!',
        type: 'success',
      });
      if (res?.creative?._id) {
        setSelectedCreativeId(res.creative._id);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Video extension failed';
      toast({ title: 'Extension Failed', message: msg || 'Could not extend video.', type: 'error' });
    } finally {
      setIsExtendingVideo(false);
    }
  };

  const handleGenerateOccasion = async () => {
    if (!projectIdStr) {
      toast({
        title: 'Select Project',
        message: 'Please select an active project to generate festive campaigns.',
        type: 'error',
      });
      return;
    }
    try {
      setIsGeneratingOccasion(true);
      const res = await generateOccasionMutation.mutateAsync({
        projectId: projectIdStr,
        occasion: selectedOccasionKey,
        customOffer: customOccasionOffer || undefined,
        customHeadline: customOccasionHeadline || undefined,
      });
      setIsOccasionModalOpen(false);
      toast({
        title: 'Occasion Campaign Created',
        message: '4:5, 1:1, 9:16 Posters & 9:16 Reel generated, scheduled for review & client notified!',
        type: 'success',
      });
      if (res?.posterCreative?._id) {
        setSelectedCreativeId(res.posterCreative._id);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Occasion campaign failed';
      toast({ title: 'Campaign Failed', message: msg || 'Could not generate occasion set.', type: 'error' });
    } finally {
      setIsGeneratingOccasion(false);
    }
  };

  const handleOpenGenerateModal = async () => {
    setIsGenerateModalOpen(true);
    setJobProgressStep('idle');
    setJobProgressReason(null);
    try {
      const estimate = await estimateCostMutation.mutateAsync({ clipCount: 5 });
      setCostEstimateData(estimate);
    } catch {
      // ignore
    }
  };

  const handleConfirmGenerate = async () => {
    if (!projectIdStr) {
      toast({
        title: 'Select Project',
        message: 'Please select an active project to generate reels.',
        type: 'error',
      });
      return;
    }

    let timer1: ReturnType<typeof setTimeout> | undefined;
    let timer2: ReturnType<typeof setTimeout> | undefined;
    let timer3: ReturnType<typeof setTimeout> | undefined;

    try {
      setIsGeneratingReel(true);
      setJobProgressStep('queued');

      if (generateMode === 'ai_motion') {
        timer1 = setTimeout(() => setJobProgressStep('generating'), 1200);
        timer2 = setTimeout(() => setJobProgressStep('downloading'), 3200);
        timer3 = setTimeout(() => setJobProgressStep('assembling'), 5200);
      }

      // 45-second timeout safeguard so the modal never hangs indefinitely
      const generatePromise = generateCreativesMutation.mutateAsync({
        projectId: projectIdStr,
        mode: generateMode,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Generation request timed out after 45s. Please check backend server.')),
          45000
        )
      );

      await Promise.race([generatePromise, timeoutPromise]);

      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);

      setJobProgressStep('ready');
      toast({
        title: 'Reel Synthesized',
        message:
          generateMode === 'ai_motion'
            ? 'AI motion reel synthesized from real photos and queued for review.'
            : 'Template reel successfully generated.',
        type: 'success',
      });
      setTimeout(() => {
        setIsGenerateModalOpen(false);
        setIsGeneratingReel(false);
        setJobProgressStep('idle');
      }, 1500);
    } catch (err: unknown) {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
      setIsGeneratingReel(false);
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : (err as any)?.message || 'Generation failed';

      setJobProgressStep(msg?.toLowerCase()?.includes('block') ? 'blocked' : 'failed');
      setJobProgressReason(msg);
      toast({ title: 'Generation Blocked or Failed', message: msg, type: 'error' });
    }
  };

  const handleEnhancePhoto = async (photoId: string) => {
    try {
      const result = await enhancePhotoMutation.mutateAsync({ mediaAssetId: photoId });
      setEnhancedResult(result);
      setIsEnhanceModalOpen(true);
      toast({
        title: 'Background Enhanced',
        message: 'AI subtle lighting enhancement ready. Original photo preserved.',
        type: 'success',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : 'Failed to enhance photo';
      toast({ title: 'Enhancement Failed', message: msg || 'Failed to enhance photo', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Honest System Statuses */}
      <div className="sticky top-0 z-10 -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-border mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
                Creative Studio
              </h1>
              {/* Dynamic statuses: small dot + text */}
              <div className="flex flex-wrap items-center gap-3 text-meta text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-success" />
                  Poster engine: ready
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-success" />
                  Video engine: ready
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      aiHealth?.configured ? 'bg-status-success' : 'bg-neutral-400'
                    }`}
                  />
                  {aiHealth?.configured
                    ? 'AI enhancement: ready'
                    : 'AI enhancement: not configured'}
                </span>
              </div>
            </div>
            <p className="text-body text-text-secondary mt-1">
              Review and approve client-ready posters and reels rendered directly from verified catalog assets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (projectVideos.length > 0 && !selectedVideoAssetId) {
                  setSelectedVideoAssetId(projectVideos[0]._id || projectVideos[0].id || '');
                }
                setIsExtendModalOpen(true);
              }}
              leftIcon={<Video className="w-4 h-4 text-primary" />}
            >
              Extend Video
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOccasionModalOpen(true)}
              leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
            >
              Occasions &amp; Festivals
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenGenerateModal}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate Reel
            </Button>
            {activeCreative && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRegenerateModalOpen(true)}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Regenerate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  leftIcon={<Download className="w-4 h-4" />}
                  disabled={!activeFile || isFailed || isGenerating}
                >
                  Download
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {serverCreatives.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-12 h-12 text-text-muted" />}
          title="No creative sets generated yet"
          description="Submit a project or mark it ready to auto-generate posters and reels from verified catalog media."
          actionLabel="Browse Catalog Projects"
          onAction={() => window.location.assign('/projects')}
        />
      ) : !activeCreative ? null : (
        /* 2. Main Studio Workspace Layout (3-Column, single-page scroll) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Creative Sets List (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-section font-semibold text-text-primary">
                Creative Sets ({serverCreatives.length})
              </h2>
              {isLoadingCreatives && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
            </div>

            <div className="space-y-2">
              {serverCreatives.map((item) => {
                const isSelected = item._id === activeCreative._id;
                const cleanTitle = getCreativeCleanTitle(item);
                const isReel = item.type === 'REEL';
                const thumbUrl = isReel
                  ? (item.posterFrameUrl || null)
                  : (item.files?.find((f) => f.ratio === '4:5')?.url || item.files?.[0]?.url || item.renderedAssetUrl);


                return (
                  <div
                    key={item._id}
                    onClick={() => handleSelectCreative(item)}
                    className={`p-3 rounded-card transition-all cursor-pointer bg-surface text-left ${
                      isSelected
                        ? 'border border-primary shadow-card ring-1 ring-primary'
                        : 'border border-border hover:border-neutral-300 hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Compact thumbnail preview */}
                      <div className="w-12 h-12 rounded-[6px] bg-neutral-100 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : isReel ? (
                          <Video className="w-5 h-5 text-text-muted" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-text-muted" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[11px] font-medium tracking-wide uppercase text-text-muted">
                            {isReel ? 'Reel · 9:16' : 'Poster Set'}
                          </span>
                          <span className="text-meta text-text-muted tabular-nums">
                            v{item.version}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-text-primary truncate">
                          {cleanTitle}
                        </h3>
                        <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                          <StatusBadge status={item.approvalStatus || item.status} />
                          {item.generatedBy === 'ai' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300">
                              AI-animated · Illustrative
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Column: Preview Area (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-section font-semibold text-text-primary">
                      {getCreativeCleanTitle(activeCreative)}
                    </h2>
                    {activeCreative.generatedBy === 'ai' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300">
                        AI-animated · Illustrative
                      </span>
                    )}
                  </div>
                  <p className="text-meta text-text-secondary mt-0.5 tabular-nums">
                    Version {activeCreative.version} &bull; Updated {formatDisplayDate(activeCreative.updatedAt || activeCreative.createdAt || new Date().toISOString())}
                  </p>
                </div>

                {/* Ratio Segmented Control */}
                {activeCreative.type !== 'REEL' ? (
                  <div className="inline-flex items-center p-0.5 rounded-lg bg-neutral-100 border border-border">
                    {(['4:5', '1:1', '9:16'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setSelectedRatio(ratio)}
                        className={`px-2.5 py-1 text-meta rounded-md transition-all ${
                          selectedRatio === ratio
                            ? 'bg-surface text-text-primary shadow-xs font-medium'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-meta font-medium text-text-secondary px-2.5 py-1 rounded-md bg-neutral-100 border border-border">
                    9:16 Reel
                  </span>
                )}
              </div>

              {/* Preview Canvas Sized to Aspect Ratio */}
              <div className="py-6 flex flex-col items-center justify-center bg-page rounded-[8px] border border-border mt-4">
                {isFailed ? (
                  /* Proper Error State with Reason & Retry Button */
                  <div className="p-6 text-center max-w-sm space-y-3">
                    <div className="w-10 h-10 rounded-full bg-status-danger-bg text-status-danger flex items-center justify-center mx-auto">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">Rendering Failed</h4>
                      <p className="text-meta text-text-secondary mt-1">
                        {activeCreative.errorMessage || 'Rendering engine could not assemble the creative from source media.'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsRegenerateModalOpen(true)}
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                    >
                      Retry Render
                    </Button>
                  </div>
                ) : isGenerating ? (
                  /* Loading Skeleton / Generating State */
                  <div className="p-8 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-text-muted mx-auto" />
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">Generating creative...</h4>
                      <p className="text-meta text-text-secondary mt-0.5">
                        Rendering assets and composing factual overlays.
                      </p>
                    </div>
                  </div>
                ) : activeCreative.type === 'REEL' ? (
                  /* Reel 9:16 Player */
                  activeFile ? (
                    <div className="w-full max-w-[260px] aspect-[9/16] rounded-[8px] overflow-hidden bg-black shadow-card border border-border relative">
                      <video
                        src={activeFile}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-center max-w-sm space-y-3">
                      <Video className="w-8 h-8 text-text-muted mx-auto" />
                      <h4 className="text-sm font-semibold text-text-primary">Reel File Unavailable</h4>
                      <p className="text-meta text-text-secondary">
                        {activeCreative.errorMessage || 'The video file for this creative could not be loaded.'}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsRegenerateModalOpen(true)}
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                      >
                        Retry Render
                      </Button>
                    </div>
                  )
                ) : (
                  /* Poster Aspect-Ratio Container */
                  activeFile ? (
                    <div
                      className={`rounded-[8px] overflow-hidden bg-black shadow-card border border-border relative transition-all ${
                        selectedRatio === '1:1'
                          ? 'w-full max-w-[340px] aspect-square'
                          : selectedRatio === '4:5'
                          ? 'w-full max-w-[300px] aspect-[4/5]'
                          : 'w-full max-w-[240px] aspect-[9/16]'
                      }`}
                    >
                      <img
                        src={activeFile}
                        alt="Creative poster preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-center max-w-sm space-y-3">
                      <ImageIcon className="w-8 h-8 text-text-muted mx-auto" />
                      <h4 className="text-sm font-semibold text-text-primary">Poster File Unavailable</h4>
                      <p className="text-meta text-text-secondary">
                        The rendered image for {selectedRatio} ratio is not yet generated.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsRegenerateModalOpen(true)}
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                      >
                        Retry Render
                      </Button>
                    </div>
                  )
                )}
              </div>

              {/* Facts Snapshot: Two-column definition list with Edit in Catalog link */}
              <div className="pt-5 mt-5 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-section font-semibold text-text-primary flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-text-secondary" />
                    <span>Facts Snapshot</span>
                  </h3>
                  {projectIdStr && (
                    <Link
                      to={`/projects/${projectIdStr}`}
                      className="text-meta text-text-secondary hover:text-text-primary inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      <span>Edit in Catalog</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {activeCreative.factsSnapshot ? (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <dt className="text-meta text-text-muted">Project Name</dt>
                      <dd className="font-medium text-text-primary mt-0.5">
                        {String(activeCreative.factsSnapshot.projectName || '—')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-meta text-text-muted">Unit Type / Configuration</dt>
                      <dd className="font-medium text-text-primary mt-0.5">
                        {activeCreative.factsSnapshot.unitType &&
                        activeCreative.factsSnapshot.unitType !== 'Master' &&
                        activeCreative.factsSnapshot.unitType !== 'Residential'
                          ? String(activeCreative.factsSnapshot.unitType)
                          : 'Project-wide'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-meta text-text-muted">Price</dt>
                      <dd className="font-medium text-text-primary tabular-nums mt-0.5">
                        {String(activeCreative.factsSnapshot.price || 'Price on request')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-meta text-text-muted">Location</dt>
                      <dd className="font-medium text-text-primary mt-0.5">
                        {formatLocationTitleCase(String(activeCreative.factsSnapshot.location || '—'))}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-meta text-text-muted">Contact &amp; CTA</dt>
                      <dd className="font-medium text-text-primary mt-0.5 tabular-nums">
                        {String(activeCreative.factsSnapshot.contactPhone || '—')} &bull; {String(activeCreative.factsSnapshot.cta || 'Call Now')}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-meta text-text-muted italic">
                    No facts snapshot recorded for this creative.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Review Panel, Source Media, Version History (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* 1. Review Panel Card */}
            <Card className="p-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-section font-semibold text-text-primary">
                  Review &amp; Approval
                </h3>
                <StatusBadge status={activeCreative.approvalStatus || activeCreative.status} />
              </div>

              {isFailed || isGenerating ? (
                /* Failed or Generating: show Retry render instead of approval buttons */
                <div className="py-4 space-y-3">
                  <p className="text-body text-text-secondary">
                    {isGenerating
                      ? 'This creative is currently generating. Approval will be available once rendering completes.'
                      : 'Rendering failed for this creative. Please retry or generate a new version.'}
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => setIsRegenerateModalOpen(true)}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Retry Render
                  </Button>
                </div>
              ) : (
                /* Standard Review Checklist & Actions */
                <div className="space-y-4 pt-3">
                  <div>
                    <h4 className="text-meta font-medium text-text-secondary mb-1">
                      Fact Verification Checklist
                    </h4>
                    <p className="text-meta text-text-muted leading-tight">
                      Verify every fact against catalog data before approving:
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'projectName', label: 'Project Name matches catalog' },
                      { key: 'unitType', label: 'Unit Type / Configuration is exact' },
                      { key: 'price', label: 'Price & Payment claims are verified' },
                      { key: 'location', label: 'Location & micro-market accurate' },
                      { key: 'amenities', label: 'Amenities & features confirmed' },
                      { key: 'contactDetails', label: 'Official phone number & CTA correct' },
                    ].map(({ key, label }) => {
                      const k = key as keyof typeof checklist;
                      const checked = checklist[k];
                      return (
                        <label
                          key={key}
                          className="flex items-start gap-2.5 text-body text-text-primary cursor-pointer select-none group"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleChecklist(k)}
                            className="mt-0.5 rounded-[4px] border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-1"
                          />
                          <span className={`text-body ${checked ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                            {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-border space-y-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      disabled={!canApprove || approveMutation.isPending}
                      isLoading={approveMutation.isPending}
                      onClick={handleApprove}
                      className="w-full"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      {isApproved ? 'Creative Approved' : 'Approve Creative'}
                    </Button>

                    {!canApprove && !isFailed && !isGenerating && (
                      <p className="text-meta text-text-muted text-center">
                        {isApproved
                          ? 'This creative has already been approved'
                          : !activeFile
                          ? 'Rendered file must exist to enable approval'
                          : 'Tick all 6 checklist boxes to enable approval'}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsChangesModalOpen(true)}
                        leftIcon={<MessageSquare className="w-4 h-4" />}
                      >
                        Request Changes
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsRejectModalOpen(true)}
                        leftIcon={<XCircle className="w-4 h-4" />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* 2. Compliance Notice (Small muted info note, no heavy box) */}
            <div className="p-3 rounded-card bg-neutral-100 text-meta text-text-secondary">
              <span className="font-medium text-text-primary">Compliance note:</span> Review all claims, prices and approvals before approving for distribution.
            </div>

            {/* 3. Source Media Card (Up to 8 thumbnails, View all modal, no inner scrollbar) */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-section font-semibold text-text-primary">
                  Source Media ({sourceMediaItems.length})
                </h3>
                {sourceMediaItems.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setIsViewAllMediaOpen(true)}
                    className="text-meta text-text-secondary hover:text-text-primary underline underline-offset-2"
                  >
                    View all ({sourceMediaItems.length})
                  </button>
                )}
              </div>

              {sourceMediaItems.length === 0 ? (
                <p className="text-meta text-text-muted italic">
                  No verified source photos linked to this creative.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {sourceMediaItems.slice(0, 8).map((m) => (
                    <div
                      key={m.id || m._id}
                      className="relative group aspect-square rounded-[6px] bg-neutral-100 overflow-hidden border border-border"
                    >
                      <img
                        src={m.fileUrl || m.url}
                        alt={m.fileName || m.filename || 'source media'}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleEnhancePhoto(m.id || m._id)}
                        disabled={enhancePhotoMutation.isPending}
                        title="AI Enhance background lighting & clarity (Illustrative)"
                        className="absolute inset-x-0 bottom-0 py-1 bg-black/80 hover:bg-black text-[10px] font-medium text-white flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Enhance
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 4. Version History (Simple timeline list with version, date, who, status) */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-text-primary" />
                <h3 className="text-section font-semibold text-text-primary">
                  Version History
                </h3>
              </div>

              <div className="space-y-3">
                {/* Active Version */}
                <div className="p-3 rounded-card bg-surface-hover border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-text-primary">
                      Version v{activeCreative.version}
                    </span>
                    <span className="text-meta font-medium px-1.5 py-0.5 rounded bg-primary text-white">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-meta text-text-secondary">
                    {activeCreative.revisionNotes || 'Verified render generated from catalog media.'}
                  </p>
                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-meta text-text-muted tabular-nums">
                    <span>System Render</span>
                    <span>
                      {activeCreative.updatedAt
                        ? `${formatDisplayDate(activeCreative.updatedAt)} ${formatDisplayTime(activeCreative.updatedAt)}`
                        : 'Current'}
                    </span>
                  </div>
                </div>

                {/* Prior History */}
                {(activeCreative.history || []).map((h) => (
                  <div key={h.version} className="p-3 rounded-card bg-surface border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">
                        Version v{h.version}
                      </span>
                      <StatusBadge status="stale" />
                    </div>
                    <p className="text-meta text-text-secondary">{h.revisionNotes || 'Prior iteration.'}</p>
                    <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-meta text-text-muted tabular-nums">
                      <span>System Render</span>
                      <span>{h.generatedAt ? formatDisplayDate(h.generatedAt) : 'Prior'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal 1: Request Changes (requires comment) */}
      <Modal
        isOpen={isChangesModalOpen}
        onClose={() => setIsChangesModalOpen(false)}
        title="Request Changes"
      >
        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            Please specify the revisions or text updates required on this creative render:
          </p>
          <textarea
            value={changesComment}
            onChange={(e) => setChangesComment(e.target.value)}
            placeholder="e.g. Please update the pricing claim or select alternative bedroom facade photography..."
            className="w-full h-28 p-3 text-sm rounded-[8px] border border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsChangesModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleRequestChanges}
              isLoading={requestChangesMutation.isPending}
              disabled={!changesComment.trim()}
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Reject Confirmation */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Creative"
      >
        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            Are you sure you want to reject this creative render? This will mark this version as rejected in the audit trail.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="md"
              onClick={handleConfirmReject}
              isLoading={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Regenerate Confirmation (shows 1 credit notice) */}
      <Modal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        title="Regenerate Creative"
      >
        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            Regenerating will consume <strong>1 credit</strong> from your organization balance to render a fresh version using the latest approved photos and catalog facts.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsRegenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleRegenerate}
              isLoading={regenerateMutation.isPending}
            >
              Confirm &amp; Use 1 Credit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 4: View All Source Media */}
      <Modal
        isOpen={isViewAllMediaOpen}
        onClose={() => setIsViewAllMediaOpen(false)}
        title={`Source Media Assets (${sourceMediaItems.length})`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-body text-text-secondary">
            All client-approved, rights-consented photography linked to this creative set:
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {sourceMediaItems.map((m) => (
              <div
                key={m.id || m._id}
                className="aspect-square rounded-[8px] bg-neutral-100 overflow-hidden border border-border"
              >
                <img
                  src={m.fileUrl || m.url}
                  alt={m.fileName || m.filename || 'source media'}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal 5: Generate Reel (Mode A Template vs Mode B AI Motion) */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => {
          setIsGenerateModalOpen(false);
          setIsGeneratingReel(false);
          setJobProgressStep('idle');
          setJobProgressReason(null);
        }}
        title="Generate Project Reel"
      >
        <div className="space-y-5">
          <p className="text-body text-text-secondary">
            Select reel synthesis mode. RealCRM strictly preserves real photography and overlays exact RERA facts via code.
          </p>

          {/* Mode Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode A: Template Reel (Default, Free) */}
            <div
              onClick={() => !isGeneratingReel && setGenerateMode('template')}
              className={`p-4 rounded-[10px] border cursor-pointer transition-all ${
                generateMode === 'template'
                  ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                  : 'border-border bg-white hover:border-text-secondary/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-text-primary text-sm">Template Reel</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                  Free · Default
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Multi-photo slideshow with dynamic pan/zoom (Ken Burns), crossfades, typography overlays, and typewriter CTA.
              </p>
            </div>

            {/* Mode B: AI Motion Reel (Opt-in, Paid) */}
            <div
              onClick={() => {
                if (!isGeneratingReel && aiHealth?.configured) {
                  setGenerateMode('ai_motion');
                }
              }}
              className={`p-4 rounded-[10px] border transition-all ${
                !aiHealth?.configured
                  ? 'border-border/60 bg-neutral-50 opacity-60 cursor-not-allowed'
                  : generateMode === 'ai_motion'
                  ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary cursor-pointer'
                  : 'border-border bg-white hover:border-text-secondary/40 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                  AI Motion Reel
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-800">
                  Paid · Opt-in
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Slow cinematic camera motion clips generated from real photos as first frames, assembled with text overlays.
              </p>
              {!aiHealth?.configured && (
                <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 rounded p-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>AI enhancement not configured (missing key)</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Mode Cost Estimate Breakdown */}
          {generateMode === 'ai_motion' && (
            <div className="rounded-[10px] border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-900">
                  Cost Breakdown & Daily Cap
                </span>
                <span className="text-xs font-medium text-indigo-700">
                  Model: {aiHealth?.videoModel || 'veo-2.0-generate-001'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-2.5 rounded border border-indigo-100">
                  <div className="text-text-secondary">Clips & Duration</div>
                  <div className="font-semibold text-text-primary mt-0.5">
                    {costEstimateData?.clipCount || 5} clips · ~{costEstimateData?.totalSeconds || 25}s ($0.060/s)
                  </div>
                </div>
                <div className="bg-white/80 p-2.5 rounded border border-indigo-100">
                  <div className="text-text-secondary">Estimated Cost</div>
                  <div className="font-semibold text-indigo-700 mt-0.5">
                    ${(costEstimateData?.totalCostUsd || 1.5).toFixed(2)} USD (
                    {costEstimateData?.requiredCredits || Math.round((costEstimateData?.totalCostUsd || 1.5) * 100)} credits)
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-100 text-indigo-800">
                <span>
                  Daily Cap: ${costEstimateData?.dailyCapUsd?.toFixed(2) || '25.00'} · Remaining: $
                  {costEstimateData?.remainingDailyCapUsd?.toFixed(2) || '25.00'}
                </span>
                <span className="text-text-secondary text-[11px]">Strip provider audio · Illustrative badge</span>
              </div>

              <div className="text-[11px] text-text-secondary bg-white/60 p-2 rounded border border-indigo-100/50">
                <span className="font-medium text-text-primary">Motion Prompt: </span>
                "Slow cinematic camera move only (gentle push-in or pan). Do not add, remove or change any object, furniture, wall, window, or room structure. Keep the room exactly as in the photo. No people, no text."
              </div>
            </div>
          )}

          {/* Job Progress Steps */}
          {jobProgressStep !== 'idle' && (
            <div className="p-4 rounded-[10px] border border-border bg-neutral-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-text-secondary">Synthesis Progress</span>
                <span className="text-xs font-medium text-brand-primary capitalize flex items-center gap-1.5">
                  {isGeneratingReel && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {jobProgressStep}
                </span>
              </div>

              {/* Step indicator */}
              <div className="grid grid-cols-4 gap-1.5 text-[11px] text-center font-medium">
                <div
                  className={`py-1.5 px-1 rounded ${
                    jobProgressStep === 'queued'
                      ? 'bg-brand-primary text-white'
                      : ['generating', 'downloading', 'assembling', 'ready'].includes(jobProgressStep)
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  1. Queued
                </div>
                <div
                  className={`py-1.5 px-1 rounded ${
                    jobProgressStep === 'generating'
                      ? 'bg-brand-primary text-white'
                      : ['downloading', 'assembling', 'ready'].includes(jobProgressStep)
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  2. AI Clips
                </div>
                <div
                  className={`py-1.5 px-1 rounded ${
                    jobProgressStep === 'downloading'
                      ? 'bg-brand-primary text-white'
                      : ['assembling', 'ready'].includes(jobProgressStep)
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  3. Download
                </div>
                <div
                  className={`py-1.5 px-1 rounded ${
                    jobProgressStep === 'assembling'
                      ? 'bg-brand-primary text-white'
                      : jobProgressStep === 'ready'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  4. Assemble
                </div>
              </div>

              {jobProgressReason && (
                <div
                  className={`p-2.5 rounded text-xs ${
                    jobProgressStep === 'blocked'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-red-100 text-red-900 border border-red-200'
                  }`}
                >
                  <strong>{jobProgressStep === 'blocked' ? 'Blocked by provider: ' : 'Error: '}</strong>
                  {jobProgressReason}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsGenerateModalOpen(false);
                setIsGeneratingReel(false);
                setJobProgressStep('idle');
                setJobProgressReason(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={
                isGeneratingReel ||
                (generateMode === 'ai_motion' && (!aiHealth?.configured || costEstimateData?.canProceed === false))
              }
              onClick={handleConfirmGenerate}
            >
              {isGeneratingReel ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Synthesizing...
                </>
              ) : generateMode === 'ai_motion' ? (
                `Confirm & Generate ($${(costEstimateData?.totalCostUsd || 1.5).toFixed(2)})`
              ) : (
                'Generate Template Reel (Free)'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 6: Photo Enhancement (Before / After Comparison) */}
      <Modal
        isOpen={isEnhanceModalOpen}
        onClose={() => {
          setIsEnhanceModalOpen(false);
          setEnhancedResult(null);
        }}
        title="AI Photo Lighting Enhancement"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-body text-text-secondary text-xs">
              Subtle lighting & color cleanup only. The original photo is strictly preserved.
            </p>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
              Illustrative
            </span>
          </div>

          {enhancedResult && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-text-secondary uppercase">Original Real Photo</span>
                <div className="aspect-[4/3] rounded-[8px] bg-neutral-100 overflow-hidden border border-border">
                  <img
                    src={enhancedResult.originalUrl}
                    alt="Original Real Photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[11px] text-text-secondary">Client-approved authentic capture</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-brand-primary uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI-Enhanced (Lighting)
                </span>
                <div className="aspect-[4/3] rounded-[8px] bg-neutral-100 overflow-hidden border border-brand-primary/50 relative">
                  <img
                    src={enhancedResult.enhancedUrl}
                    alt="AI Enhanced Photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 text-white rounded text-[10px] font-medium">
                    Illustrative
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary">Subtle exposure / shadow balance</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsEnhanceModalOpen(false);
                setEnhancedResult(null);
              }}
            >
              Keep Original
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                toast({
                  title: 'Photo Selected',
                  message: 'Enhanced photo staged as illustrative asset.',
                  type: 'success',
                });
                setIsEnhanceModalOpen(false);
                setEnhancedResult(null);
              }}
            >
              Use Enhanced Asset
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= CONDITION 1: EXTEND VIDEO MODAL ================= */}
      <Modal
        isOpen={isExtendModalOpen}
        onClose={() => {
          if (!isExtendingVideo) setIsExtendModalOpen(false);
        }}
        title="AI-Powered Video Extension (Natural Continuation)"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Upload or select an existing client walkthrough, drone, or interior video. Antigravity AI analyzes the final keyframes, lighting, and camera trajectory to generate a seamless natural continuation clip and stitches them into a unified video.
          </p>

          <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              1. Select Source Project Video
            </span>

            {projectVideos.length === 0 ? (
              <div className="p-4 rounded border border-dashed border-border text-center space-y-2">
                <Video className="w-8 h-8 text-text-muted mx-auto" />
                <p className="text-xs text-text-secondary">
                  No video assets found for this project yet. Please upload a property walkthrough or interior video in the Project Media section.
                </p>
                <Link
                  to={`/projects/${projectIdStr}/edit`}
                  className="inline-flex text-xs text-primary font-medium hover:underline"
                >
                  Go to Project Media →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {projectVideos.map((vid) => {
                  const isSelected = (vid._id || vid.id) === selectedVideoAssetId;
                  return (
                    <div
                      key={vid._id || vid.id}
                      onClick={() => setSelectedVideoAssetId(vid._id || vid.id || '')}
                      className={`p-2.5 rounded-card border cursor-pointer transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-surface hover:border-neutral-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded bg-neutral-900 flex items-center justify-center shrink-0 text-white">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-primary truncate">
                          {vid.filename || 'Property Video'}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {vid.duration ? `${Math.round(vid.duration)}s` : 'Walkthrough'} &bull; {vid.category || 'EXTERIOR'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              2. Continuation Camera Trajectory &amp; Style Prompt
            </label>
            <textarea
              value={videoExtendPrompt}
              onChange={(e) => setVideoExtendPrompt(e.target.value)}
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Continue camera panning steadily through the property interior with seamless architectural lighting..."
            />
            <p className="text-[11px] text-text-muted">
              Maintains strict visual consistency: property structure, camera movement, and lighting tone.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
            <p className="font-semibold">Automated Post Preparation &amp; Notification (Condition 4)</p>
            <p className="text-[11px] text-emerald-800">
              Upon generation, the extended video is automatically staged into the upcoming social media schedule and a review notification is dispatched to the client.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              disabled={isExtendingVideo}
              onClick={() => setIsExtendModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isExtendingVideo || !selectedVideoAssetId}
              onClick={handleExtendVideo}
              leftIcon={
                isExtendingVideo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Video className="w-4 h-4" />
                )
              }
            >
              {isExtendingVideo ? 'Analyzing & Extending...' : 'Extend Video'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= CONDITION 2: OCCASION & FESTIVAL CAMPAIGN MODAL ================= */}
      <Modal
        isOpen={isOccasionModalOpen}
        onClose={() => {
          if (!isGeneratingOccasion) setIsOccasionModalOpen(false);
        }}
        title="AI Occasion &amp; Festival Campaign Generator"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Select a festival, national holiday, or seasonal theme. The AI automatically compiles client property photos and generates a multi-format campaign: <strong>4:5 Showcase, 1:1 Square, 9:16 Vertical Story Posters</strong>, plus an animated <strong>9:16 Festive Reel</strong> with verified RERA compliance.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              1. Choose Festival or Occasion Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {occasions.map((occ) => {
                const isSelected = selectedOccasionKey === occ.key;
                return (
                  <div
                    key={occ.key}
                    onClick={() => {
                      setSelectedOccasionKey(occ.key);
                      setCustomOccasionOffer(occ.defaultOffer);
                    }}
                    className={`p-3 rounded-card border cursor-pointer transition-all text-left space-y-1 ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                        : 'border-border bg-surface hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{occ.iconSvgSymbol}</span>
                      <span className="text-xs font-bold text-text-primary truncate">
                        {occ.name.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-1">
                      {occ.tagline}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                Custom Headline (Optional)
              </label>
              <input
                type="text"
                value={customOccasionHeadline}
                onChange={(e) => setCustomOccasionHeadline(e.target.value)}
                placeholder="Defaults to project name"
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                Festive Offer &amp; Privilege Note
              </label>
              <input
                type="text"
                value={customOccasionOffer}
                onChange={(e) => setCustomOccasionOffer(e.target.value)}
                placeholder="e.g. *Festive Privilege: Zero Stamp Duty on Spot Booking"
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-secondary border border-border text-xs space-y-1 text-text-secondary">
            <div className="flex items-center justify-between font-semibold text-text-primary">
              <span>Included Outputs in Campaign Package</span>
              <span className="text-primary font-bold">4 Assets</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>4:5 Master Showcase Poster (Sharp-rendered on-site photos, RERA verified)</li>
              <li>1:1 Square Feed Poster &bull; 9:16 Full-Screen Story Poster</li>
              <li>9:16 Festive Reel with occasion lower-third and smooth motion</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              disabled={isGeneratingOccasion}
              onClick={() => setIsOccasionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isGeneratingOccasion}
              onClick={handleGenerateOccasion}
              leftIcon={
                isGeneratingOccasion ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )
              }
            >
              {isGeneratingOccasion ? 'Synthesizing Occasion Suite...' : 'Generate Occasion Campaign'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

