import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
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
  useGeneratePresenterVideo,
  useGenerateCaptions,
  CaptionVariantItem,
  BackendCreativeItem,
} from '../hooks/useCreatives';
import { useProjects } from '../hooks/useProjects';
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
  UserCheck,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Search,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  ShieldCheck,
  CheckCheck,
  Film,
  Layers,
  X,
} from 'lucide-react';
import { AiStudioWorkflowView } from '../components/studio/AiStudioWorkflowView';

export function CreativeStudioPage() {
  const { toast } = useToast();
  const [studioTab, setStudioTab] = useState<'AI_STUDIO' | 'CATALOG_CREATIVES'>('AI_STUDIO');

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
  const { data: allProjects = [] } = useProjects();
  const generatePresenterVideoMutation = useGeneratePresenterVideo();
  const generateCaptionsMutation = useGenerateCaptions();

  // Selection & filter state
  const [selectedCreativeId, setSelectedCreativeId] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '4:5' | '9:16'>('4:5');
  const [creativeFilter, setCreativeFilter] = useState<'ALL' | 'REEL' | 'POSTER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Review flow modals & checklist
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);
  const [changesComment, setChangesComment] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Client rejected creative render during review.');
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isViewAllMediaOpen, setIsViewAllMediaOpen] = useState(false);

  // Fullscreen & Zoom Lightbox states
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [copiedFactKey, setCopiedFactKey] = useState<string | null>(null);

  // Video playback custom controls state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Style Preset for posters & reels (Mode A: Heritage Luxury vs Mode B: High-Growth ROI)
  const [selectedStylePreset, setSelectedStylePreset] = useState<'HERITAGE_LUXURY' | 'HIGH_GROWTH_ROI'>('HERITAGE_LUXURY');

  // Presenter Walkthrough Video State
  const [isPresenterModalOpen, setIsPresenterModalOpen] = useState(false);
  const [presenterLanguage, setPresenterLanguage] = useState<'Hinglish' | 'English' | 'Hindi'>('Hinglish');
  const [isGeneratingPresenterVideo, setIsGeneratingPresenterVideo] = useState(false);

  // 5-Step AI Captions State
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [generatedCaptionsData, setGeneratedCaptionsData] = useState<{ projectName: string; variants: CaptionVariantItem[] } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  // Occasions / Festive State (Condition 2) - Phase 2 On Hold
  const [isOccasionModalOpen, setIsOccasionModalOpen] = useState(false);

  // Keyboard shortcut listener for cinema/lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreenOpen(false);
        setIsZoomModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 6 Fact Checklist items required before client approval (starts unchecked)
  const [checklist, setChecklist] = useState({
    projectName: false,
    unitType: false,
    price: false,
    location: false,
    amenities: false,
    contactDetails: false,
  });

  const verifiedCount = useMemo(() => {
    return Object.values(checklist).filter(Boolean).length;
  }, [checklist]);

  const isChecklistComplete = useMemo(() => {
    return verifiedCount === 6;
  }, [verifiedCount]);

  const checklistProgressPercent = useMemo(() => {
    return Math.round((verifiedCount / 6) * 100);
  }, [verifiedCount]);

  // Active creative selection
  const activeCreative: BackendCreativeItem | null = useMemo(() => {
    if (!serverCreatives.length) return null;
    const found = selectedCreativeId
      ? serverCreatives.find((c) => c._id === selectedCreativeId)
      : null;
    return found || serverCreatives[0];
  }, [serverCreatives, selectedCreativeId]);

  // Filtered creative list based on search and tab filter
  const filteredCreatives = useMemo(() => {
    return serverCreatives.filter((item) => {
      if (creativeFilter === 'REEL' && item.type !== 'REEL') return false;
      if (creativeFilter === 'POSTER' && item.type === 'REEL') return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const pName =
          typeof item.projectId === 'object' && item.projectId !== null
            ? (item.projectId.name || '').toLowerCase()
            : '';
        const headline = (item.headline || '').toLowerCase();
        const format = (item.format || '').toLowerCase();
        return pName.includes(query) || headline.includes(query) || format.includes(query);
      }
      return true;
    });
  }, [serverCreatives, creativeFilter, searchQuery]);

  // Project ID for media lookup & catalog links
  const projectIdStr = useMemo(() => {
    if (activeCreative?.projectId) {
      return typeof activeCreative.projectId === 'object'
        ? activeCreative.projectId._id
        : activeCreative.projectId;
    }
    if (allProjects.length > 0) {
      return allProjects[0]._id || allProjects[0].id;
    }
    return undefined;
  }, [activeCreative, allProjects]);

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
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleToggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleAllChecklist = () => {
    const nextState = !isChecklistComplete;
    setChecklist({
      projectName: nextState,
      unitType: nextState,
      price: nextState,
      location: nextState,
      amenities: nextState,
      contactDetails: nextState,
    });
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
        reason: rejectReason || 'Client rejected creative render during review.',
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
        stylePreset: selectedStylePreset,
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

  const handleGeneratePresenterVideo = async () => {
    if (!projectIdStr) {
      toast({
        title: 'Select Project',
        message: 'Please select an active project to generate presenter walkthrough.',
        type: 'error',
      });
      return;
    }

    try {
      setIsGeneratingPresenterVideo(true);
      await generatePresenterVideoMutation.mutateAsync({
        projectId: projectIdStr,
        language: presenterLanguage,
        stylePreset: selectedStylePreset,
      });

      toast({
        title: 'Walkthrough Video Ready',
        message: '4-Act Presenter Walkthrough Video with voiceover synthesized successfully.',
        type: 'success',
      });
      setIsPresenterModalOpen(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : (err as any)?.message || 'Failed to generate presenter video';
      toast({ title: 'Walkthrough Generation Failed', message: msg, type: 'error' });
    } finally {
      setIsGeneratingPresenterVideo(false);
    }
  };

  const handleGenerateCaptions = async () => {
    if (!projectIdStr) {
      toast({
        title: 'Select Project',
        message: 'Please select an active project to generate captions.',
        type: 'error',
      });
      return;
    }

    try {
      setIsGeneratingCaptions(true);
      const res = await generateCaptionsMutation.mutateAsync({
        projectId: projectIdStr,
        stylePreset: selectedStylePreset,
      });
      setGeneratedCaptionsData(res);
      toast({
        title: 'Captions Generated',
        message: '3 winning platform-ready caption variants generated.',
        type: 'success',
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : (err as any)?.message || 'Failed to generate captions';
      toast({ title: 'Caption Generation Failed', message: msg, type: 'error' });
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // Video playback helper handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatVideoTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCopyFact = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedFactKey(key);
    setTimeout(() => setCopiedFactKey(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. Header Section: Modern SaaS Style Header */}
      <div className="sticky top-0 z-20 -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/95 backdrop-blur-md border-b border-border shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & Engine Status Indicators */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <span>Creative Studio</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 tracking-wide uppercase">
                  Production Suite
                </span>
              </h1>

              {/* Status Badges with Small Animated Pulsing Indicators */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Poster Engine */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span>Poster Engine</span>
                </div>

                {/* Video Engine */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span>Video Engine</span>
                </div>

                {/* AI Enhancement */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium text-xs border transition-colors ${
                    aiHealth?.configured
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    {aiHealth?.configured && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        aiHealth?.configured ? 'bg-emerald-600' : 'bg-neutral-400'
                      }`}
                    ></span>
                  </span>
                  <span>{aiHealth?.configured ? 'AI Engine: Ready' : 'AI Engine: Standby'}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary">
              Real estate creative production platform for client-ready posters, AI marketing shots, and Instagram reels.
            </p>
          </div>

          {/* Action Buttons: Organized with High Visual Hierarchy */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* AI Creation Capabilities */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (projectVideos.length > 0 && !selectedVideoAssetId) {
                    setSelectedVideoAssetId(projectVideos[0]._id || projectVideos[0].id || '');
                  }
                  setIsExtendModalOpen(true);
                }}
                leftIcon={<Video className="w-3.5 h-3.5 text-neutral-700" />}
                className="h-8 text-xs font-semibold hover:bg-white transition-all shadow-none hover:shadow-xs"
              >
                Extend Video
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPresenterModalOpen(true)}
                leftIcon={<UserCheck className="w-3.5 h-3.5 text-purple-600" />}
                className="h-8 text-xs font-semibold hover:bg-white text-purple-900 transition-all shadow-none hover:shadow-xs"
              >
                Presenter Walkthrough
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCaptionModalOpen(true)}
                leftIcon={<FileText className="w-3.5 h-3.5 text-blue-600" />}
                className="h-8 text-xs font-semibold hover:bg-white text-blue-900 transition-all shadow-none hover:shadow-xs"
              >
                5-Step Captions
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOccasionModalOpen(true)}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                className="h-8 text-xs font-semibold hover:bg-white text-amber-900 transition-all shadow-none hover:shadow-xs"
              >
                Occasions
                <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  Phase 2
                </span>
              </Button>
            </div>

            {/* Contextual actions for selected creative in Catalog view */}
            {activeCreative && studioTab === 'CATALOG_CREATIVES' && (
              <div className="flex items-center gap-1.5 pl-1 border-l border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRegenerateModalOpen(true)}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="h-8 text-xs font-semibold hover:bg-neutral-100"
                >
                  Regenerate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  disabled={!activeFile || isFailed || isGenerating}
                  className="h-8 text-xs font-semibold hover:bg-neutral-100"
                >
                  Download
                </Button>
              </div>
            )}

            {/* Primary High-Contrast Action Button: Generate Creatives */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenGenerateModal}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              className="h-8.5 px-4 text-xs font-semibold bg-neutral-900 text-white hover:bg-black shadow-xs transition-all"
            >
              <span className="tracking-wide">Generate Creatives</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Studio View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-border shadow-xs">
        <div className="flex items-center p-1 bg-neutral-100 rounded-lg border border-neutral-200/80">
          <button
            type="button"
            onClick={() => setStudioTab('AI_STUDIO')}
            className={`h-8.5 px-4 rounded-md text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              studioTab === 'AI_STUDIO'
                ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80 font-bold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Image &amp; Reel Suite</span>
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-neutral-900 text-white font-bold uppercase tracking-wider">
              15-Shot Suite
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('CATALOG_CREATIVES')}
            className={`h-8.5 px-4 rounded-md text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              studioTab === 'CATALOG_CREATIVES'
                ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80 font-bold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-neutral-700" />
            <span>Catalog Creative Reviews</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-neutral-200 text-neutral-800 font-bold">
              {serverCreatives.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary px-2">
          {studioTab === 'AI_STUDIO' ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-neutral-700">
                Automated 6-Step Pipeline: Photos &bull; Vision Analysis &bull; 15 Marketing Images &bull; 9:16 Vertical Reels
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neutral-700" />
              <span className="font-medium text-neutral-700">
                6-Fact Verification &amp; Client Compliance Review Workspace
              </span>
            </div>
          )}
        </div>
      </div>

      {studioTab === 'AI_STUDIO' ? (
        <AiStudioWorkflowView
          projects={allProjects}
          selectedProjectId={projectIdStr}
        />
      ) : serverCreatives.length === 0 && !isLoadingCreatives ? (
        <EmptyState
          icon={<ImageIcon className="w-12 h-12 text-text-muted" />}
          title="No creative sets generated yet"
          description="Submit a project or mark it ready to auto-generate posters and reels from verified catalog media."
          actionLabel="Browse Catalog Projects"
          onAction={() => window.location.assign('/projects')}
        />
      ) : !activeCreative && !isLoadingCreatives ? null : (
        /* 2. Main Studio Workspace: Balanced 3-Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ================= LEFT COLUMN: CREATIVE SETS SECTION (3 cols) ================= */}
          <div className="lg:col-span-3 space-y-3">
            <Card className="p-3.5 border border-border shadow-xs bg-white rounded-card">
              {/* Header with Counter and Filter Tabs */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-neutral-600" />
                    <span>Creative Sets</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                    {serverCreatives.length}
                  </span>
                </div>
                {isLoadingCreatives && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
              </div>

              {/* Search Box */}
              <div className="pt-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sets by project..."
                    className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-md border border-border bg-neutral-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Pills (All / Reels / Posters) */}
              <div className="flex items-center gap-1 pt-2">
                <button
                  type="button"
                  onClick={() => setCreativeFilter('ALL')}
                  className={`flex-1 py-1 text-[11px] font-medium rounded transition-all text-center ${
                    creativeFilter === 'ALL'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                  }`}
                >
                  All ({serverCreatives.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCreativeFilter('REEL')}
                  className={`flex-1 py-1 text-[11px] font-medium rounded transition-all text-center ${
                    creativeFilter === 'REEL'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                  }`}
                >
                  Reels ({serverCreatives.filter((c) => c.type === 'REEL').length})
                </button>
                <button
                  type="button"
                  onClick={() => setCreativeFilter('POSTER')}
                  className={`flex-1 py-1 text-[11px] font-medium rounded transition-all text-center ${
                    creativeFilter === 'POSTER'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                  }`}
                >
                  Posters ({serverCreatives.filter((c) => c.type !== 'REEL').length})
                </button>
              </div>

              {/* Creative Cards List */}
              <div className="space-y-2 mt-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
                {isLoadingCreatives ? (
                  // Loading Skeletons
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-neutral-50/50 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-12 h-14 rounded-md" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="w-16 h-3 rounded" />
                          <Skeleton className="w-28 h-4 rounded" />
                          <Skeleton className="w-20 h-3 rounded" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredCreatives.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-muted">
                    <p className="font-medium">No matching creative sets</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Try clearing filters or search query.</p>
                  </div>
                ) : (
                  filteredCreatives.map((item) => {
                    const isSelected = item._id === activeCreative?._id;
                    const cleanTitle = getCreativeCleanTitle(item);
                    const isReel = item.type === 'REEL';
                    const thumbUrl = isReel
                      ? (item.posterFrameUrl || null)
                      : (item.files?.find((f) => f.ratio === '4:5')?.url || item.files?.[0]?.url || item.renderedAssetUrl);

                    return (
                      <div
                        key={item._id}
                        onClick={() => handleSelectCreative(item)}
                        className={`group relative p-2.5 rounded-lg transition-all duration-150 cursor-pointer text-left select-none ${
                          isSelected
                            ? 'bg-white border-2 border-neutral-900 shadow-sm ring-1 ring-neutral-900/10'
                            : 'bg-white border border-border hover:border-neutral-400 hover:bg-neutral-50/80 hover:shadow-xs'
                        }`}
                      >
                        {/* Active Selection Left Bar Indicator */}
                        {isSelected && (
                          <div className="absolute left-0 inset-y-1.5 w-1 bg-neutral-900 rounded-r-full" />
                        )}

                        <div className="flex items-start gap-2.5 pl-1">
                          {/* Prominent Framed Thumbnail */}
                          <div className="w-12 h-16 sm:w-14 sm:h-16 rounded-md bg-neutral-950 border border-neutral-300 overflow-hidden shrink-0 flex items-center justify-center relative group-hover:scale-[1.02] transition-transform">
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
                              <Film className="w-5 h-5 text-neutral-400" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-neutral-400" />
                            )}

                            {/* Overlay Type Tag */}
                            <span className="absolute bottom-0 inset-x-0 bg-neutral-900/80 backdrop-blur-xs text-[9px] text-white font-bold py-0.5 text-center tracking-wider uppercase">
                              {isReel ? '9:16' : item.format || '4:5'}
                            </span>
                          </div>

                          {/* Card Content & Metadata */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-neutral-500">
                                {isReel ? (
                                  <>
                                    <Film className="w-3 h-3 text-neutral-700" />
                                    <span>Reel</span>
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="w-3 h-3 text-neutral-700" />
                                    <span>Poster</span>
                                  </>
                                )}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400 font-semibold">
                                v{item.version}
                              </span>
                            </div>

                            <h3 className="text-xs font-semibold text-text-primary truncate" title={cleanTitle}>
                              {cleanTitle}
                            </h3>

                            {/* Status badge and AI pill */}
                            <div className="mt-1.5 flex items-center justify-between gap-1 flex-wrap">
                              <StatusBadge status={item.approvalStatus || item.status} />
                              {item.generatedBy === 'ai' && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                                  AI
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* ================= CENTER COLUMN: CREATIVE PREVIEW SECTION (5 cols lg, 6 cols xl) ================= */}
          <div className="lg:col-span-5 xl:col-span-6 space-y-4">
            <Card className="p-4 sm:p-5 border border-border shadow-xs bg-white rounded-card">
              {/* Preview Header: Title, Specs & Aspect-Ratio Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                      {activeCreative ? getCreativeCleanTitle(activeCreative) : 'Creative Preview'}
                    </h2>
                    {activeCreative?.generatedBy === 'ai' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                        AI-animated · Illustrative
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary tabular-nums flex items-center gap-2">
                    <span className="font-semibold text-text-primary">Version v{activeCreative?.version}</span>
                    <span>&bull;</span>
                    <span>Updated {formatDisplayDate(activeCreative?.updatedAt || activeCreative?.createdAt || new Date().toISOString())}</span>
                  </p>
                </div>

                {/* Right controls: Ratio Switcher + Toolbar */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {/* Ratio Segmented Control */}
                  {activeCreative?.type !== 'REEL' ? (
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-neutral-100 border border-neutral-200">
                      {(['4:5', '1:1', '9:16'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setSelectedRatio(ratio)}
                          className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                            selectedRatio === ratio
                              ? 'bg-white text-text-primary shadow-xs font-semibold'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-neutral-700 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200 inline-flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5" />
                      9:16 Reel
                    </span>
                  )}

                  {/* Actions Toolbar: Fullscreen & Zoom */}
                  <div className="flex items-center gap-1 pl-1 border-l border-border">
                    {activeCreative?.type !== 'REEL' && activeFile && !isFailed && !isGenerating && (
                      <button
                        type="button"
                        onClick={() => {
                          setZoomScale(1.5);
                          setIsZoomModalOpen(true);
                        }}
                        title="Zoom & Inspect Poster"
                        className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors border border-transparent hover:border-neutral-200"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    )}

                    {activeFile && !isFailed && !isGenerating && (
                      <button
                        type="button"
                        onClick={() => setIsFullscreenOpen(true)}
                        title="Cinema Fullscreen View"
                        className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors border border-transparent hover:border-neutral-200"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}

                    {activeFile && !isFailed && !isGenerating && (
                      <button
                        type="button"
                        onClick={handleDownload}
                        title="Download Creative Asset"
                        className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors border border-transparent hover:border-neutral-200"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Cinema Canvas Container */}
              <div className="relative py-8 px-4 flex flex-col items-center justify-center bg-neutral-950 rounded-xl border border-neutral-900 shadow-inner mt-4 overflow-hidden min-h-[440px]">
                {/* Subtle Studio Grid lines backdrop */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />

                {isFailed ? (
                  /* Error State with Reason & Retry Button */
                  <div className="relative z-10 p-6 text-center max-w-sm space-y-3 bg-neutral-900/90 rounded-xl border border-red-900/40 text-white shadow-xl">
                    <div className="w-12 h-12 rounded-full bg-red-950/80 text-red-400 flex items-center justify-center mx-auto border border-red-800/40">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Rendering Engine Error</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        {activeCreative?.errorMessage || 'Rendering engine could not assemble the creative from catalog source media.'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsRegenerateModalOpen(true)}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      className="bg-white text-neutral-900 hover:bg-neutral-100 border-none font-semibold text-xs"
                    >
                      Retry Render
                    </Button>
                  </div>
                ) : isGenerating ? (
                  /* Loading / Generating State */
                  <div className="relative z-10 p-8 text-center space-y-3 bg-neutral-900/90 rounded-xl border border-neutral-800 text-white shadow-xl">
                    <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
                      <Sparkles className="w-4 h-4 text-amber-400 absolute" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Rendering Creative Assets...</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Composing factual overlays and verified catalog claims.
                      </p>
                    </div>
                  </div>
                ) : activeCreative?.type === 'REEL' ? (
                  /* Interactive 9:16 Vertical Video Player */
                  activeFile ? (
                    <div className="relative z-10 w-full max-w-[280px] sm:max-w-[300px] aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-2xl border border-neutral-800 group">
                      <video
                        ref={videoRef}
                        src={activeFile}
                        loop
                        playsInline
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={togglePlay}
                        onTimeUpdate={() => {
                          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                        }}
                        onLoadedMetadata={() => {
                          if (videoRef.current) setDuration(videoRef.current.duration);
                        }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />

                      {/* Big Center Play Overlay (visible when paused) */}
                      {!isPlaying && (
                        <div
                          onClick={togglePlay}
                          className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity"
                        >
                          <div className="w-14 h-14 rounded-full bg-white/95 text-neutral-900 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform pl-1">
                            <Play className="w-7 h-7 fill-current" />
                          </div>
                        </div>
                      )}

                      {/* Video Player Bottom Control Bar */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                        {/* Progress slider */}
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          step={0.1}
                          value={currentTime}
                          onChange={handleVideoSeek}
                          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                        />

                        {/* Controls row */}
                        <div className="flex items-center justify-between text-white text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={togglePlay}
                              className="p-1 rounded hover:bg-white/20 transition-colors"
                              title={isPlaying ? 'Pause' : 'Play'}
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                            </button>
                            <span className="font-mono text-[11px] tabular-nums text-neutral-300">
                              {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={toggleMute}
                              className="p-1 rounded hover:bg-white/20 transition-colors"
                              title={isMuted ? 'Unmute' : 'Mute'}
                            >
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsFullscreenOpen(true)}
                              className="p-1 rounded hover:bg-white/20 transition-colors"
                              title="Fullscreen"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center max-w-sm space-y-3 bg-neutral-900 rounded-xl text-white border border-neutral-800">
                      <Film className="w-8 h-8 text-neutral-400 mx-auto" />
                      <h4 className="text-sm font-semibold">Reel File Unavailable</h4>
                      <p className="text-xs text-neutral-400">
                        {activeCreative?.errorMessage || 'The video file for this creative could not be loaded.'}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsRegenerateModalOpen(true)}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        className="bg-white text-neutral-900 hover:bg-neutral-100 border-none font-semibold text-xs"
                      >
                        Retry Render
                      </Button>
                    </div>
                  )
                ) : (
                  /* Poster Aspect-Ratio Container */
                  activeFile ? (
                    <div
                      className={`relative z-10 rounded-xl overflow-hidden bg-black shadow-2xl border border-neutral-800 group transition-all cursor-pointer ${
                        selectedRatio === '1:1'
                          ? 'w-full max-w-[360px] aspect-square'
                          : selectedRatio === '4:5'
                          ? 'w-full max-w-[320px] aspect-[4/5]'
                          : 'w-full max-w-[270px] aspect-[9/16]'
                      }`}
                      onClick={() => setIsZoomModalOpen(true)}
                    >
                      <img
                        src={activeFile}
                        alt="Creative poster preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      {/* Click to Zoom Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="px-3 py-1.5 rounded-full bg-white text-neutral-900 text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Click to Inspect / Zoom</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center max-w-sm space-y-3 bg-neutral-900 rounded-xl text-white border border-neutral-800">
                      <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto" />
                      <h4 className="text-sm font-semibold">Poster File Unavailable</h4>
                      <p className="text-xs text-neutral-400">
                        The rendered image for {selectedRatio} ratio is not yet generated.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsRegenerateModalOpen(true)}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        className="bg-white text-neutral-900 hover:bg-neutral-100 border-none font-semibold text-xs"
                      >
                        Retry Render
                      </Button>
                    </div>
                  )
                )}
              </div>

              {/* Facts Snapshot: Executive Property Catalog Claims */}
              <div className="pt-5 mt-5 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Catalog Verified Facts Snapshot</span>
                  </h3>
                  {projectIdStr && (
                    <Link
                      to={`/projects/${projectIdStr}`}
                      className="text-xs font-medium text-text-secondary hover:text-text-primary inline-flex items-center gap-1 hover:underline underline-offset-2"
                    >
                      <span>Edit in Catalog</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {activeCreative?.factsSnapshot ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {/* Project Name */}
                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-neutral-400 tracking-wider block">
                          Project Name
                        </span>
                        <span className="font-semibold text-text-primary text-xs mt-0.5 block">
                          {String(activeCreative.factsSnapshot.projectName || '—')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyFact('projectName', String(activeCreative.factsSnapshot?.projectName || ''))}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60"
                        title="Copy project name"
                      >
                        {copiedFactKey === 'projectName' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Unit Type / Configuration */}
                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-neutral-400 tracking-wider block">
                          Unit Configuration
                        </span>
                        <span className="font-semibold text-text-primary text-xs mt-0.5 block">
                          {activeCreative.factsSnapshot.unitType &&
                          activeCreative.factsSnapshot.unitType !== 'Master' &&
                          activeCreative.factsSnapshot.unitType !== 'Residential'
                            ? String(activeCreative.factsSnapshot.unitType)
                            : 'Project-wide'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyFact('unitType', String(activeCreative.factsSnapshot?.unitType || 'Project-wide'))}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60"
                        title="Copy unit type"
                      >
                        {copiedFactKey === 'unitType' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Price */}
                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-neutral-400 tracking-wider block">
                          Price Claim
                        </span>
                        <span className="font-semibold text-text-primary text-xs mt-0.5 tabular-nums block">
                          {String(activeCreative.factsSnapshot.price || 'Price on request')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyFact('price', String(activeCreative.factsSnapshot?.price || ''))}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60"
                        title="Copy price claim"
                      >
                        {copiedFactKey === 'price' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Location */}
                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-neutral-400 tracking-wider block">
                          Micro-Market Location
                        </span>
                        <span className="font-semibold text-text-primary text-xs mt-0.5 block truncate max-w-[180px]">
                          {formatLocationTitleCase(String(activeCreative.factsSnapshot.location || '—'))}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyFact('location', String(activeCreative.factsSnapshot?.location || ''))}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60"
                        title="Copy location"
                      >
                        {copiedFactKey === 'location' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Contact & CTA */}
                    <div className="sm:col-span-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-neutral-400 tracking-wider block">
                          Official Contact &amp; Call To Action
                        </span>
                        <span className="font-semibold text-text-primary text-xs mt-0.5 tabular-nums block">
                          {String(activeCreative.factsSnapshot.contactPhone || '—')} &bull; {String(activeCreative.factsSnapshot.cta || 'Call Now')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyFact('contact', `${String(activeCreative.factsSnapshot?.contactPhone || '')} - ${String(activeCreative.factsSnapshot?.cta || '')}`)}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60"
                        title="Copy contact & CTA"
                      >
                        {copiedFactKey === 'contact' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic bg-neutral-50 p-3 rounded-lg border border-border">
                    No facts snapshot recorded for this creative.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* ================= RIGHT COLUMN: REVIEW & APPROVAL PANEL (4 cols lg, 3 cols xl) ================= */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            {/* 1. Review & Fact Verification Card */}
            <Card className="p-4 sm:p-5 border border-border shadow-xs bg-white rounded-card">
              <div className="flex items-center justify-between pb-3.5 border-b border-border">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                    Review &amp; Approval
                  </h3>
                  <p className="text-[11px] text-text-secondary">Mandatory regulatory review</p>
                </div>
                <StatusBadge status={activeCreative?.approvalStatus || activeCreative?.status || 'draft'} />
              </div>

              {isFailed || isGenerating ? (
                /* Failed or Generating State */
                <div className="py-4 space-y-3">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {isGenerating
                      ? 'This creative is currently generating. Approval will unlock once rendering completes.'
                      : 'Rendering failed for this creative. Please retry render or generate a new version.'}
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full bg-neutral-900 text-white font-semibold text-xs"
                    onClick={() => setIsRegenerateModalOpen(true)}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Retry Render
                  </Button>
                </div>
              ) : (
                /* Interactive Fact Verification Checklist */
                <div className="space-y-4 pt-3.5">
                  {/* Progress Header and Visual Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCheck className="w-4 h-4 text-neutral-700" />
                        <span className="text-xs font-bold text-text-primary">
                          Fact Verification
                        </span>
                      </div>

                      {/* Progress Badge: 3/6 verified */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                          isChecklistComplete
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {verifiedCount}/6 Verified
                      </span>
                    </div>

                    {/* Smooth Progress Bar */}
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                      <div
                        className={`h-full transition-all duration-300 ease-out ${
                          isChecklistComplete ? 'bg-emerald-600' : 'bg-neutral-900'
                        }`}
                        style={{ width: `${checklistProgressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
                      <span>Verify every fact against catalog data</span>
                      <button
                        type="button"
                        onClick={handleToggleAllChecklist}
                        className="font-medium text-neutral-800 hover:underline cursor-pointer"
                      >
                        {isChecklistComplete ? 'Uncheck All' : 'Verify All'}
                      </button>
                    </div>
                  </div>

                  {/* Checklist Items with Custom Interactive Row Styling */}
                  <div className="space-y-1.5">
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
                        <div
                          key={key}
                          onClick={() => handleToggleChecklist(k)}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                            checked
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-medium'
                              : 'bg-white border-neutral-200/70 hover:border-neutral-300 hover:bg-neutral-50 text-text-secondary'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center transition-colors border ${
                              checked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-neutral-300 bg-white'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs leading-tight">{label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions Section: Approve, Request Changes, Reject */}
                  <div className="pt-3 border-t border-border space-y-2">
                    {/* Approve Creative Button */}
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      disabled={!canApprove || approveMutation.isPending}
                      isLoading={approveMutation.isPending}
                      onClick={handleApprove}
                      className={`w-full font-bold text-xs h-10 transition-all ${
                        canApprove
                          ? 'bg-neutral-900 text-white hover:bg-black shadow-md cursor-pointer'
                          : 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                      }`}
                      leftIcon={<CheckCircle2 className={`w-4 h-4 ${canApprove ? 'text-emerald-400' : 'text-neutral-400'}`} />}
                    >
                      {isApproved ? 'Creative Approved' : 'Approve Creative'}
                    </Button>

                    {!canApprove && !isFailed && !isGenerating && (
                      <p className="text-[11px] text-neutral-500 text-center leading-tight">
                        {isApproved
                          ? 'This creative has already been approved for distribution.'
                          : !activeFile
                          ? 'Rendered file must exist to enable approval.'
                          : 'Tick all 6 checklist items to unlock approval.'}
                      </p>
                    )}

                    {/* Secondary Actions: Request Changes & Reject */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsChangesModalOpen(true)}
                        leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                        className="text-xs font-semibold h-8 hover:bg-neutral-100"
                      >
                        Request Changes
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsRejectModalOpen(true)}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        className="text-xs font-semibold h-8 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* 2. Compliance Note: Clean, Muted Real Estate Regulatory Badge */}
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-text-secondary flex items-start gap-2 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-text-primary">Compliance note: </span>
                Verify all pricing claims, floor layouts, and regulatory approvals before distribution.
              </div>
            </div>

            {/* 3. Source Media Assets Card */}
            <Card className="p-4 border border-border shadow-xs bg-white rounded-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Source Media ({sourceMediaItems.length})</span>
                </h3>
                {sourceMediaItems.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setIsViewAllMediaOpen(true)}
                    className="text-xs text-neutral-600 hover:text-text-primary font-medium underline underline-offset-2"
                  >
                    View all ({sourceMediaItems.length})
                  </button>
                )}
              </div>

              {sourceMediaItems.length === 0 ? (
                <p className="text-xs text-text-muted italic bg-neutral-50 p-2.5 rounded border border-border">
                  No verified source photos linked to this creative.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {sourceMediaItems.slice(0, 8).map((m) => (
                    <div
                      key={m.id || m._id}
                      className="relative group aspect-square rounded-md bg-neutral-100 overflow-hidden border border-border hover:border-neutral-400 transition-colors"
                    >
                      <img
                        src={m.fileUrl || m.url}
                        alt={m.fileName || m.filename || 'source media'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        onClick={() => handleEnhancePhoto(m.id || m._id)}
                        disabled={enhancePhotoMutation.isPending}
                        title="AI Enhance lighting & clarity (Illustrative)"
                        className="absolute inset-x-0 bottom-0 py-0.5 bg-neutral-900/90 hover:bg-black text-[9px] font-semibold text-white flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                        Enhance
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 4. Version History Card */}
            <Card className="p-4 border border-border shadow-xs bg-white rounded-card">
              <div className="flex items-center gap-1.5 mb-3">
                <History className="w-4 h-4 text-text-primary" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Version History
                </h3>
              </div>

              <div className="space-y-2.5">
                {/* Active Version */}
                {activeCreative && (
                  <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">
                        Version v{activeCreative.version}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-900 text-white">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">
                      {activeCreative.revisionNotes || 'Verified render generated from catalog media.'}
                    </p>
                    <div className="pt-1.5 border-t border-neutral-200/80 flex items-center justify-between text-[10px] text-text-muted tabular-nums">
                      <span>System Render</span>
                      <span>
                        {activeCreative.updatedAt
                          ? `${formatDisplayDate(activeCreative.updatedAt)} ${formatDisplayTime(activeCreative.updatedAt)}`
                          : 'Current'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Prior History */}
                {(activeCreative?.history || []).map((h) => (
                  <div key={h.version} className="p-2.5 rounded-lg bg-white border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-text-primary">
                        Version v{h.version}
                      </span>
                      <StatusBadge status="stale" />
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">{h.revisionNotes || 'Prior iteration.'}</p>
                    <div className="pt-1 border-t border-border flex items-center justify-between text-[10px] text-text-muted tabular-nums">
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

      {/* ================= MODAL: FULLSCREEN CINEMA PREVIEW ================= */}
      {isFullscreenOpen && activeCreative && activeFile && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-150">
          {/* Top Cinema Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-bold text-white">
                {getCreativeCleanTitle(activeCreative)}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                v{activeCreative.version}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                {activeCreative.type === 'REEL' ? '9:16 Video' : `${selectedRatio} Poster`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                leftIcon={<Download className="w-3.5 h-3.5 text-white" />}
                className="bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700 text-xs h-8"
              >
                Download
              </Button>
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
                title="Close Fullscreen (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Media Viewport */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            {activeCreative.type === 'REEL' ? (
              <div className="h-full max-h-[82vh] aspect-[9/16] rounded-xl overflow-hidden shadow-2xl bg-black border border-neutral-800 relative">
                <video
                  ref={fullscreenVideoRef}
                  src={activeFile}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="max-h-[82vh] max-w-4xl flex items-center justify-center">
                <img
                  src={activeFile}
                  alt="Fullscreen poster"
                  className="max-h-[82vh] w-auto object-contain rounded-xl shadow-2xl border border-neutral-800"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: POSTER ZOOM LIGHTBOX ================= */}
      {isZoomModalOpen && activeFile && activeCreative?.type !== 'REEL' && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-150">
          {/* Zoom Lightbox Header & Controls */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-neutral-400" />
                <span>High-Resolution Poster Inspection</span>
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                {Math.round(zoomScale * 100)}% Zoom
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-neutral-800 rounded-lg p-0.5 border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(1, prev - 0.25))}
                  disabled={zoomScale <= 1}
                  className="p-1.5 rounded hover:bg-neutral-700 disabled:opacity-40 text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  className="px-2 py-1 text-xs font-mono text-neutral-300 hover:bg-neutral-700 rounded"
                  title="Reset 100%"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.min(3, prev + 0.25))}
                  disabled={zoomScale >= 3}
                  className="p-1.5 rounded hover:bg-neutral-700 disabled:opacity-40 text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors ml-2"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scaled Image Viewport */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div className="transition-transform duration-150 ease-out origin-center">
              <img
                src={activeFile}
                alt="Zoomed Poster"
                style={{ transform: `scale(${zoomScale})` }}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl transition-transform duration-150"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: REQUEST CHANGES ================= */}
      <Modal
        isOpen={isChangesModalOpen}
        onClose={() => setIsChangesModalOpen(false)}
        title="Request Changes"
      >
        <div className="space-y-4">
          <p className="text-body text-text-secondary text-xs sm:text-sm">
            Please specify the revisions or text updates required on this creative render:
          </p>
          <textarea
            value={changesComment}
            onChange={(e) => setChangesComment(e.target.value)}
            placeholder="e.g. Please update the pricing claim or select alternative bedroom facade photography..."
            className="w-full h-28 p-3 text-xs sm:text-sm rounded-[8px] border border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none"
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

      {/* ================= MODAL 2: REJECT CONFIRMATION ================= */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Creative"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-text-secondary">
            Are you sure you want to reject this creative render? This will mark this version as rejected in the audit trail.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block">
              Rejection Reason / Client Feedback
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Specify why this creative is being rejected..."
              className="w-full h-20 p-2.5 text-xs rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
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

      {/* ================= MODAL 3: REGENERATE CONFIRMATION ================= */}
      <Modal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        title="Regenerate Creative"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
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

      {/* ================= MODAL 4: VIEW ALL SOURCE MEDIA ================= */}
      <Modal
        isOpen={isViewAllMediaOpen}
        onClose={() => setIsViewAllMediaOpen(false)}
        title={`Source Media Assets (${sourceMediaItems.length})`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-xs sm:text-sm text-text-secondary">
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

      {/* ================= MODAL 5: GENERATE REEL ================= */}
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
          <p className="text-xs sm:text-sm text-text-secondary">
            Select creative style and reel synthesis mode. RealCRM strictly preserves real photography and overlays exact RERA facts via code.
          </p>

          {/* Visual Style Preset Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Visual Style Preset (Signature Agency Branding)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => !isGeneratingReel && setSelectedStylePreset('HERITAGE_LUXURY')}
                className={`p-3.5 rounded-[10px] border cursor-pointer transition-all ${
                  selectedStylePreset === 'HERITAGE_LUXURY'
                    ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500'
                    : 'border-border bg-white hover:border-text-secondary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-text-primary text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Heritage Luxury (GDPL Style)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    Aspirational
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Deep Royal Navy &amp; Warm Gold, calm ivory backdrop, multi-room photo layout for luxury family estates.
                </p>
              </div>

              <div
                onClick={() => !isGeneratingReel && setSelectedStylePreset('HIGH_GROWTH_ROI')}
                className={`p-3.5 rounded-[10px] border cursor-pointer transition-all ${
                  selectedStylePreset === 'HIGH_GROWTH_ROI'
                    ? 'border-cyan-500 bg-cyan-50/60 ring-1 ring-cyan-500'
                    : 'border-border bg-white hover:border-text-secondary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-text-primary text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    High-Growth ROI (ACE Infra Style)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-900 font-bold border border-cyan-300">
                    Investor Focus
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Sleek dark slate &amp; electric cyan glow, Airport Road / PR-7 connectivity stats for commercial &amp; ROI velocity.
                </p>
              </div>
            </div>
          </div>

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
                  Cost Breakdown &amp; Daily Cap
                </span>
                <span className="text-xs font-medium text-indigo-700">
                  Model: {aiHealth?.videoModel || 'veo-2.0-generate-001'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-2.5 rounded border border-indigo-100">
                  <div className="text-text-secondary">Clips &amp; Duration</div>
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
                      ? 'bg-neutral-900 text-white'
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
                      ? 'bg-neutral-900 text-white'
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
                      ? 'bg-neutral-900 text-white'
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
                      ? 'bg-neutral-900 text-white'
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

      {/* ================= MODAL 6: PHOTO ENHANCEMENT ================= */}
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
            <p className="text-xs text-text-secondary">
              Subtle lighting &amp; color cleanup only. The original photo is strictly preserved.
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

      {/* ================= MODAL 7: EXTEND VIDEO MODAL ================= */}
      <Modal
        isOpen={isExtendModalOpen}
        onClose={() => {
          if (!isExtendingVideo) setIsExtendModalOpen(false);
        }}
        title="AI-Powered Video Extension (Natural Continuation)"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
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

      {/* ================= MODAL 8: OCCASIONS (PHASE 2 ON HOLD) ================= */}
      <Modal
        isOpen={isOccasionModalOpen}
        onClose={() => setIsOccasionModalOpen(false)}
        title="Occasions &amp; Festival Campaigns (Phase 2 Roadmap)"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Feature On Hold for Phase 2 Rollout
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Per instructions, Festival &amp; Occasion campaign generation has been placed on hold to prioritize core AI Walkthrough Videos, Dual-Style Property Posters, and 5-Step AI Captions.
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              The underlying Occasion Engine has been modularized and decoupled, allowing festive creative suites to be unlocked in Phase 2 without structural changes.
            </p>
          </div>

          {occasions.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                Staged Occasions in Engine ({occasions.length}):
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg bg-surface border border-border">
                {occasions.map((occ) => (
                  <span
                    key={occ.key}
                    className="px-2.5 py-1 rounded-md bg-background border border-border text-[11px] font-medium text-text-primary"
                  >
                    {occ.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setIsOccasionModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL 9: PRESENTER WALKTHROUGH VIDEO ================= */}
      <Modal
        isOpen={isPresenterModalOpen}
        onClose={() => {
          if (!isGeneratingPresenterVideo) setIsPresenterModalOpen(false);
        }}
        title="Generate Virtual Presenter Walkthrough Video"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Synthesizes a 9:16 vertical walkthrough video with 4 guided acts, spoken voiceover narration, smooth camera moves, lower-third overlays, and a verified presenter avatar badge.
          </p>

          <div className="p-3.5 bg-purple-50 rounded-[10px] border border-purple-200 text-xs text-purple-900 space-y-2">
            <div className="font-semibold flex items-center gap-2 text-purple-950">
              <UserCheck className="w-4 h-4 text-purple-600" />
              4-Act Guided Walkthrough Pipeline:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-purple-800">
              <li><strong>Act 1: The Hook &amp; Grand Entrance</strong> (Project facade &amp; prime location)</li>
              <li><strong>Act 2: Spatial Reveal &amp; Living Hall</strong> (Walkthrough of living area &amp; deck)</li>
              <li><strong>Act 3: Kitchen &amp; Master Suite</strong> (Designer modular kitchen &amp; finishes)</li>
              <li><strong>Act 4: Balcony Panorama &amp; CTA</strong> (Sunset view &amp; sales office visit invitation)</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-primary uppercase mb-1 block">Language &amp; Accent</label>
              <select
                value={presenterLanguage}
                onChange={(e) => setPresenterLanguage(e.target.value as any)}
                className="w-full text-xs p-2 rounded border border-border bg-white"
              >
                <option value="Hinglish">Hinglish (Recommended for Tricity / Mohali)</option>
                <option value="English">English (Urban Luxury)</option>
                <option value="Hindi">Hindi (Regional Appeal)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary uppercase mb-1 block">Style Preset</label>
              <select
                value={selectedStylePreset}
                onChange={(e) => setSelectedStylePreset(e.target.value as any)}
                className="w-full text-xs p-2 rounded border border-border bg-white"
              >
                <option value="HERITAGE_LUXURY">Heritage Luxury (Gold / GDPL Style)</option>
                <option value="HIGH_GROWTH_ROI">High-Growth ROI (Cyan / ACE Infra Style)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs p-2.5 bg-neutral-50 rounded border border-border">
            <span className="text-text-secondary flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-brand-primary" /> Spoken Voiceover + Verified Badge + Dynamic Lower-Thirds
            </span>
            <span className="font-bold text-brand-primary">Cost: 5 Credits</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              disabled={isGeneratingPresenterVideo}
              onClick={() => setIsPresenterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isGeneratingPresenterVideo}
              onClick={handleGeneratePresenterVideo}
              leftIcon={
                isGeneratingPresenterVideo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
            >
              {isGeneratingPresenterVideo ? 'Synthesizing Video & Audio...' : 'Confirm & Synthesize (5 Credits)'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL 10: 5-STEP AI CAPTIONS ================= */}
      <Modal
        isOpen={isCaptionModalOpen}
        onClose={() => setIsCaptionModalOpen(false)}
        title="5-Step AI Caption &amp; Ad Copy Generator"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Generates 3 winning ad copy variants engineered with the proven real estate formula: Emotional Hook → Location &amp; Connectivity → Specs &amp; Area → Direct Urgency CTA → Punjab RERA &amp; Hashtag Cloud.
          </p>

          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-900 uppercase">Tone Preset:</span>
              <select
                value={selectedStylePreset}
                onChange={(e) => setSelectedStylePreset(e.target.value as any)}
                className="text-xs p-1.5 rounded border border-blue-300 bg-white"
              >
                <option value="HERITAGE_LUXURY">Heritage Luxury (GDPL Style)</option>
                <option value="HIGH_GROWTH_ROI">High-Growth ROI (ACE Infra Style)</option>
              </select>
            </div>
            <Button
              size="sm"
              variant="primary"
              disabled={isGeneratingCaptions}
              onClick={handleGenerateCaptions}
              leftIcon={
                isGeneratingCaptions ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
            >
              {isGeneratingCaptions ? 'Generating...' : 'Generate 3 Variants'}
            </Button>
          </div>

          {generatedCaptionsData && (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {generatedCaptionsData.variants.map((v, idx) => (
                <div key={idx} className="p-3.5 bg-neutral-50 rounded-[10px] border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          v.style === 'HIGH_GROWTH_ROI'
                            ? 'bg-cyan-500'
                            : v.style === 'SHORT_REEL'
                            ? 'bg-purple-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      {v.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(v.fullCopy);
                        setCopiedIndex(idx);
                        setTimeout(() => setCopiedIndex(null), 2000);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold bg-white border border-border rounded hover:bg-neutral-100 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-text-secondary" />
                      )}
                      {copiedIndex === idx ? 'Copied!' : 'Copy Ad Copy'}
                    </button>
                  </div>
                  <pre className="text-xs text-text-secondary font-sans whitespace-pre-wrap bg-white p-2.5 rounded border border-neutral-200 leading-relaxed max-h-48 overflow-y-auto">
                    {v.fullCopy}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
