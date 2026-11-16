import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { Skeleton } from '../ui/Skeleton';
import {
  useAiStudioBatches,
  useAiStudioBatch,
  useAnalyzeProperty,
  useGenerateStudioImages,
  useRegenerateStudioImage,
  useUpdateStudioSelection,
  useGenerateStudioReel,
  useSetStudioReelApproval,
  useUploadStudioPhotos,
  useSetStudioImageApproval,
  useSaveStudioImageToMedia,
  AiStudioImage,
  AiStudioReel,
  ReelVariationStyle,
  PropertyVisionAnalysis,
} from '../../hooks/useAiStudio';
import { useProjectMedia } from '../../hooks/useMedia';
import {
  Sparkles,
  Film,
  Camera,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Building2,
  Palette,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  FolderOpen,
  SplitSquareVertical,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';

interface AiStudioWorkflowViewProps {
  projects: Array<{ _id?: string; id?: string; name: string }>;
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onStepChange?: (step: number) => void;
}

export function AiStudioWorkflowView({
  projects,
  selectedProjectId: initialProjectId,
  onSelectProject,
  onStepChange,
}: AiStudioWorkflowViewProps) {
  const { toast } = useToast();

  // Active Project Selection
  const [projectId, setProjectId] = useState<string>(
    initialProjectId || (projects.length > 0 ? (projects[0]._id || projects[0].id || '') : '')
  );

  useEffect(() => {
    if (initialProjectId && initialProjectId !== projectId) {
      setProjectId(initialProjectId);
    } else if (!projectId && projects && projects.length > 0) {
      const firstId = projects[0]._id || projects[0].id || '';
      if (firstId) setProjectId(firstId);
    }
  }, [initialProjectId, projectId, projects]);

  const handleProjectChange = (newId: string) => {
    setProjectId(newId);
    setSelectedBatchId(null);
    setLocalVision(null);
    if (onSelectProject) onSelectProject(newId);
  };

  // Queries
  const { data: batches = [], isLoading: isLoadingBatches, refetch: refetchBatches } =
    useAiStudioBatches(projectId);

  // Selected Batch (defaults to highest version / latest batch)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const activeBatch = useMemo(() => {
    if (!batches.length) return null;
    if (selectedBatchId) {
      const found = batches.find((b) => b._id === selectedBatchId);
      if (found) return found;
    }
    // Prefer the latest READY batch with images
    const readyBatchesWithImages = [...batches]
      .filter((b) => b.status === 'READY' && b.images && b.images.length > 0)
      .sort((a, b) => b.version - a.version);
    if (readyBatchesWithImages.length > 0) {
      return readyBatchesWithImages[0];
    }
    // Return latest version by default
    return [...batches].sort((a, b) => b.version - a.version)[0];
  }, [batches, selectedBatchId]);

  // Detail query for active batch
  const { data: batchDetail, isLoading: isLoadingDetail } = useAiStudioBatch(
    activeBatch?._id || null
  );

  const currentBatch = batchDetail || activeBatch;

  // Resolve vision analysis: from active batch, any previous batch for this project, or local mutation state
  const [localVision, setLocalVision] = useState<PropertyVisionAnalysis | null>(null);
  const anyBatchVision = useMemo(() => {
    const found = batches.find(
      (b) => b.visionAnalysis && (b.visionAnalysis.analysisSummary || b.visionAnalysis.architecturalStyle)
    );
    return found?.visionAnalysis || null;
  }, [batches]);
  const currentVision = currentBatch?.visionAnalysis || anyBatchVision || localVision;

  // Client uploaded media for the selected project
  const { approvedMedia: clientPhotos = [], isLoading: isLoadingMedia } = useProjectMedia(
    projectId,
    { consentedOnly: false }
  );

  // Images and selection counts
  const imagesList = useMemo(() => currentBatch?.images || [], [currentBatch]);
  const selectedImages = useMemo(() => imagesList.filter((img) => img.isSelected), [imagesList]);
  const selectedCount = selectedImages.length;
  const totalCount = imagesList.length;

  // Selected Reel to Preview
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const activeReel: AiStudioReel | null = useMemo(() => {
    if (!currentBatch || !currentBatch.reels || currentBatch.reels.length === 0) return null;
    if (selectedReelId) {
      const found = currentBatch.reels.find((r) => r.id === selectedReelId);
      if (found) return found;
    }
    return currentBatch.reels[currentBatch.reels.length - 1]; // latest reel
  }, [currentBatch, selectedReelId]);

  // Guided Stepper Active Step (1 to 6)
  const [activeStep, setActiveStepState] = useState<number>(1);

  const setActiveStep = (step: number) => {
    setActiveStepState(step);
    if (onStepChange) onStepChange(step);
  };

  // Auto-advance starting step intelligently once on initial load
  const hasInitializedStep = useRef(false);
  useEffect(() => {
    if (!hasInitializedStep.current && !isLoadingBatches && !isLoadingMedia) {
      if (clientPhotos.length === 0) {
        setActiveStepState(1);
      } else if (!currentVision) {
        setActiveStepState(2);
      } else if (imagesList.length === 0) {
        setActiveStepState(3);
      } else if (selectedCount < 2) {
        setActiveStepState(4);
      } else if (!currentBatch?.reels?.length) {
        setActiveStepState(5);
      } else {
        setActiveStepState(6);
      }
      hasInitializedStep.current = true;
    }
  }, [isLoadingBatches, isLoadingMedia, clientPhotos.length, currentVision, imagesList.length, selectedCount, currentBatch?.reels?.length]);

  // Mutations
  const analyzeMutation = useAnalyzeProperty();
  const generateImagesMutation = useGenerateStudioImages();
  const regenerateSingleMutation = useRegenerateStudioImage();
  const updateSelectionMutation = useUpdateStudioSelection();
  const generateReelMutation = useGenerateStudioReel();
  const setApprovalMutation = useSetStudioReelApproval();
  const uploadPhotosMutation = useUploadStudioPhotos();
  const setImageApprovalMutation = useSetStudioImageApproval();
  const saveImageToMediaMutation = useSaveStudioImageToMedia();

  // Multi-Photo Upload & Save to Media State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [savingMediaImageId, setSavingMediaImageId] = useState<string | null>(null);

  // Generation Controls State
  const [targetImageCount, setTargetImageCount] = useState<number>(15);
  const [selectedStylePreset, setSelectedStylePreset] = useState<'HERITAGE_LUXURY' | 'HIGH_GROWTH_ROI'>('HERITAGE_LUXURY');
  const [generationMode, setGenerationMode] = useState<'ENHANCED_CROPS' | 'AI_IMAGE'>('ENHANCED_CROPS');
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generationStepText, setGenerationStepText] = useState('');

  // Single Image Regeneration state
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null);

  // Reel Generation State
  const [selectedReelVariation, setSelectedReelVariation] = useState<ReelVariationStyle>('CINEMATIC_SHOWCASE');
  const [isSynthesizingReel, setIsSynthesizingReel] = useState(false);
  const [reelProgressText, setReelProgressText] = useState('');

  // Fullscreen Lightbox Modal for Images
  const [lightboxImage, setLightboxImage] = useState<AiStudioImage | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  // Custom Video Player Controls for Reels
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Handle Video Player Events
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
    const seek = parseFloat(e.target.value);
    videoRef.current.currentTime = seek;
    setCurrentTime(seek);
  };

  const formatVideoTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Keyboard shortcut listener for Lightbox
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Toggle Single Image Selection
  const handleToggleSelect = async (imageId: string) => {
    if (!currentBatch) return;
    const newSelectedIds = imagesList
      .map((img) => (img.id === imageId ? { ...img, isSelected: !img.isSelected } : img))
      .filter((img) => img.isSelected)
      .map((img) => img.id);

    try {
      await updateSelectionMutation.mutateAsync({
        batchId: currentBatch._id,
        selectedImageIds: newSelectedIds,
      });
    } catch {
      toast({ title: 'Selection Error', message: 'Failed to update selection', type: 'error' });
    }
  };

  // Select / Deselect All Images
  const handleSelectAll = async (select: boolean) => {
    if (!currentBatch) return;
    const newSelectedIds = select ? imagesList.map((img) => img.id) : [];
    try {
      await updateSelectionMutation.mutateAsync({
        batchId: currentBatch._id,
        selectedImageIds: newSelectedIds,
      });
      toast({
        title: select ? 'All Images Selected' : 'All Images Deselected',
        message: select ? `${imagesList.length} images ready for reel` : 'Deselected all images',
        type: 'info',
      });
    } catch {
      toast({ title: 'Selection Error', message: 'Failed to update selection', type: 'error' });
    }
  };

  // Trigger Vision Analysis (Step 2)
  const handleAnalyzeProperty = async () => {
    if (!projectId) {
      toast({ title: 'Select Property', message: 'Please select a property first', type: 'error' });
      return;
    }
    try {
      toast({ title: 'AI Vision Analysis', message: 'Analyzing property photos...', type: 'info' });
      const res = await analyzeMutation.mutateAsync({ projectId });
      if (res) {
        setLocalVision(res);
      }
      toast({
        title: 'Analysis Complete',
        message: 'Property architecture, color palette, and room layouts identified.',
        type: 'success',
      });
      refetchBatches();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg =
        axiosErr.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to analyze property photos');
      toast({ title: 'Analysis Failed', message: msg, type: 'error' });
    }
  };

  // Generate 10-15 Fresh Images (Step 3)
  const handleGenerateFreshImages = async () => {
    if (!projectId) {
      toast({ title: 'Select Property', message: 'Please select a property first', type: 'error' });
      return;
    }

    try {
      setIsGeneratingImages(true);
      setGenerationStepText('Analyzing property features and layout...');
      const t1 = setTimeout(() => {
        setGenerationStepText('Synthesizing architectural camera perspectives...');
      }, 1500);
      const t2 = setTimeout(() => {
        setGenerationStepText(`Rendering ${targetImageCount} high-resolution marketing perspectives...`);
      }, 3500);
      const t3 = setTimeout(() => {
        setGenerationStepText('Applying color grading and assembling collection...');
      }, 5500);

      const newBatch = await generateImagesMutation.mutateAsync({
        projectId,
        targetCount: targetImageCount,
        stylePreset: selectedStylePreset,
        mode: generationMode,
        isAsync: false,
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setIsGeneratingImages(false);
      setGenerationStepText('');
      await refetchBatches();

      if (newBatch && newBatch.images && newBatch.images.length > 0) {
        setSelectedBatchId(newBatch._id);
        toast({
          title: `Collection Version ${newBatch.version} Ready!`,
          message: `Generated ${newBatch.images.length} property marketing images.`,
          type: 'success',
        });
        // Move to Step 4 to review and select images
        setActiveStep(4);
      } else {
        const errorMsg =
          newBatch?.errorMessage ||
          'Generation finished with 0 images. If you selected AI Image Generation, your free daily Gemini quota may be exhausted. Please switch to "Enhanced Crops" mode.';
        toast({
          title: 'Generation Notice',
          message: errorMsg,
          type: 'warning',
        });
      }
    } catch (err: unknown) {
      setIsGeneratingImages(false);
      setGenerationStepText('');
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg =
        axiosErr.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Image generation failed');
      toast({ title: 'Generation Failed', message: msg, type: 'error' });
    }
  };

  // Regenerate Single Image Slot
  const handleRegenerateSingleImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentBatch) return;

    try {
      setRegeneratingImageId(imageId);
      toast({ title: 'Regenerating Shot', message: 'Composing new creative camera angle...', type: 'info' });
      await regenerateSingleMutation.mutateAsync({
        batchId: currentBatch._id,
        imageId,
      });
      toast({
        title: 'Image Regenerated',
        message: 'Fresh architectural perspective generated and saved.',
        type: 'success',
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg =
        axiosErr.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to regenerate image');
      toast({ title: 'Regeneration Error', message: msg, type: 'error' });
    } finally {
      setRegeneratingImageId(null);
    }
  };

  // Handle Multi-Photo File Input Upload
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    if (!projectId) {
      toast({ title: 'Select Property', message: 'Please select a property first.', type: 'error' });
      return;
    }

    try {
      setIsUploadingPhotos(true);
      toast({
        title: 'Uploading Property Photos',
        message: `Uploading ${files.length} property photos...`,
        type: 'info',
      });
      await uploadPhotosMutation.mutateAsync({ projectId, files });
      toast({
        title: 'Photos Uploaded Successfully',
        message: `${files.length} property photos uploaded.`,
        type: 'success',
      });
      // Automatically trigger vision analysis and proceed to step 2
      await handleAnalyzeProperty();
      setActiveStep(2);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg =
        axiosErr.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Photo upload failed');
      toast({ title: 'Upload Failed', message: msg, type: 'error' });
    } finally {
      setIsUploadingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Set Single Image Approval
  const handleSetImageApproval = async (
    imageId: string,
    status: 'APPROVED' | 'REJECTED',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!currentBatch) return;

    try {
      await setImageApprovalMutation.mutateAsync({
        batchId: currentBatch._id,
        imageId,
        status,
      });
      toast({
        title: status === 'APPROVED' ? 'Image Approved' : 'Image Rejected',
        message: status === 'APPROVED' ? 'Marked approved for marketing catalog.' : 'Marked rejected.',
        type: status === 'APPROVED' ? 'success' : 'info',
      });
    } catch {
      toast({ title: 'Error', message: 'Failed to update image approval status', type: 'error' });
    }
  };

  // Save Generated Image to Media Library
  const handleSaveToMedia = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentBatch) return;

    try {
      setSavingMediaImageId(imageId);
      await saveImageToMediaMutation.mutateAsync({
        batchId: currentBatch._id,
        imageId,
      });
      toast({
        title: 'Saved to Media Library',
        message: 'High-resolution shot saved permanently to project assets.',
        type: 'success',
      });
    } catch {
      toast({ title: 'Error', message: 'Failed to save image to media library', type: 'error' });
    } finally {
      setSavingMediaImageId(null);
    }
  };

  // Generate Reel (Step 5)
  const handleGenerateReel = async () => {
    if (!currentBatch || !projectId) {
      toast({ title: 'Action Unavailable', message: 'Generate images first before synthesizing reel.', type: 'error' });
      return;
    }

    if (selectedCount < 2) {
      toast({
        title: 'Select More Images',
        message: 'Please select at least 2 images in Step 4 to compile a reel.',
        type: 'warning',
      });
      setActiveStep(4);
      return;
    }

    try {
      setIsSynthesizingReel(true);
      setReelProgressText('Step 1/3: Sequencing selected shots with pan and zoom motion...');
      const t1 = setTimeout(() => {
        setReelProgressText('Step 2/3: Applying property title cards and soundtrack...');
      }, 2000);
      const t2 = setTimeout(() => {
        setReelProgressText('Step 3/3: Rendering high-definition 9:16 vertical reel...');
      }, 4000);

      const newReel = await generateReelMutation.mutateAsync({
        batchId: currentBatch._id,
        variationStyle: selectedReelVariation,
      });

      clearTimeout(t1);
      clearTimeout(t2);

      setSelectedReelId(newReel.id);
      setIsSynthesizingReel(false);
      setReelProgressText('');

      toast({
        title: 'Reel Synthesized!',
        message: 'Your property reel is ready for preview and download.',
        type: 'success',
      });
      // Move to Step 6 to preview
      setActiveStep(6);
    } catch (err: unknown) {
      setIsSynthesizingReel(false);
      setReelProgressText('');
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg =
        axiosErr.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Reel synthesis failed');
      toast({ title: 'Reel Synthesis Failed', message: msg, type: 'error' });
    }
  };

  // Approve or Reject Reel
  const handleSetApproval = async (status: 'APPROVED' | 'REJECTED') => {
    if (!currentBatch || !activeReel) return;
    try {
      await setApprovalMutation.mutateAsync({
        batchId: currentBatch._id,
        reelId: activeReel.id,
        status,
      });
      toast({
        title: status === 'APPROVED' ? 'Reel Approved' : 'Reel Rejected',
        message:
          status === 'APPROVED'
            ? 'Reel marked client-approved and registered in project catalog.'
            : 'Reel marked rejected.',
        type: status === 'APPROVED' ? 'success' : 'info',
      });
    } catch {
      toast({ title: 'Approval Error', message: 'Failed to update approval status', type: 'error' });
    }
  };

  // Helper download function
  const handleDownloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Download Started', message: `Downloading ${filename}`, type: 'success' });
  };

  // Resolve matching original client photo for side-by-side comparison
  const sourceOriginalPhoto = useMemo(() => {
    if (!lightboxImage) return null;
    if (lightboxImage.sourceAssetUrl) {
      return { url: lightboxImage.sourceAssetUrl, name: 'Original Upload' };
    }
    if (lightboxImage.sourceAssetId) {
      const found = clientPhotos.find((p) => (p._id || p.id) === lightboxImage.sourceAssetId);
      if (found) return { url: found.url, name: found.filename || 'Original Photo' };
    }
    return clientPhotos[0]
      ? { url: clientPhotos[0].url, name: clientPhotos[0].filename || 'Original Photo' }
      : null;
  }, [lightboxImage, clientPhotos]);

  // Guided Workflow Steps Definition (Updated labels per Step 3)
  const workflowSteps = [
    {
      stepNum: 1,
      title: 'Upload Property Photos',
      shortTitle: 'Upload Photos',
      statusText: `${clientPhotos.length} Uploaded`,
      isComplete: clientPhotos.length > 0,
      isReady: true,
    },
    {
      stepNum: 2,
      title: 'Analyze Property',
      shortTitle: 'Analyze Property',
      statusText: currentVision ? 'Analyzed' : 'Pending',
      isComplete: Boolean(currentVision),
      isReady: clientPhotos.length > 0,
    },
    {
      stepNum: 3,
      title: 'Generate Marketing Images',
      shortTitle: 'Generate Images',
      statusText: imagesList.length > 0 ? `${imagesList.length} Generated` : 'Ready',
      isComplete: imagesList.length > 0,
      isReady: Boolean(currentVision),
    },
    {
      stepNum: 4,
      title: 'Select Your Best Images',
      shortTitle: 'Select Images',
      statusText: `${selectedCount} of ${totalCount} Selected`,
      isComplete: selectedCount >= 2,
      isReady: imagesList.length > 0,
    },
    {
      stepNum: 5,
      title: 'Create Property Reel',
      shortTitle: 'Create Reel',
      statusText: currentBatch?.reels?.length ? `${currentBatch.reels.length} Reel(s)` : 'Ready',
      isComplete: Boolean(currentBatch?.reels?.length),
      isReady: selectedCount >= 2,
    },
    {
      stepNum: 6,
      title: 'Preview & Download',
      shortTitle: 'Preview & Download',
      statusText: activeReel?.approvalStatus || (currentBatch?.reels?.length ? 'Ready' : 'Pending'),
      isComplete: activeReel?.approvalStatus === 'APPROVED',
      isReady: Boolean(activeReel),
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── 1. Guided Workflow Stepper Bar (Clean, Numbered, Clickable) ── */}
      <div className="bg-white p-3.5 rounded-card border border-app-border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="w-4 h-4 text-brand-primary" />
            <span className="font-semibold text-slate-900">
              {projects.find((p) => (p._id || p.id) === projectId)?.name || 'Selected Property'}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-500">
              Step {activeStep} of 6: {workflowSteps[activeStep - 1]?.title}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {batches.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Batch Version:</span>
                <select
                  value={currentBatch?._id || ''}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  {[...batches]
                    .sort((a, b) => b.version - a.version)
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        v{b.version} ({b.images?.length || 0} images{b.status === 'FAILED' ? ' - Error' : ''})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {projects.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Switch Property:</span>
                <select
                  value={projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-800 text-xs focus:outline-none"
                >
                  {projects.map((p) => {
                    const id = p._id || p.id || '';
                    return (
                      <option key={id} value={id}>
                        {p.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {workflowSteps.map((step) => {
            const isActive = activeStep === step.stepNum;
            return (
              <button
                key={step.stepNum}
                type="button"
                onClick={() => setActiveStep(step.stepNum)}
                className={`p-2.5 rounded-control border text-left transition-all cursor-pointer flex flex-col justify-between h-[66px] ${
                  isActive
                    ? 'border-brand-primary bg-brand-primary-soft/30 ring-2 ring-brand-primary shadow-xs'
                    : step.isComplete
                    ? 'border-slate-300 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-400'
                    : 'border-app-border bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                      step.isComplete
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-brand-primary text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {step.isComplete ? <Check className="w-3 h-3 stroke-[3]" /> : step.stepNum}
                  </span>

                  <span
                    className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-brand-primary text-white font-bold'
                        : step.isComplete
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-400'
                    }`}
                  >
                    Step {step.stepNum}
                  </span>
                </div>

                <div className="truncate w-full mt-1">
                  <div
                    className={`text-xs font-semibold truncate leading-tight ${
                      isActive ? 'text-brand-primary font-bold' : 'text-slate-900'
                    }`}
                  >
                    {step.shortTitle}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {step.statusText}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Active Step Main Work Area (Focused Single Workspace) ── */}
      <div>
        {/* ================= STEP 1: UPLOAD PROPERTY PHOTOS ================= */}
        {activeStep === 1 && (
          <Card className="border border-app-border bg-white rounded-card shadow-xs overflow-hidden">
            <div className="p-5 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Upload Property Photos
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {clientPhotos.length} {clientPhotos.length === 1 ? 'photo' : 'photos'} uploaded
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Upload authentic interior and exterior photos of the property. Original photos are preserved and never overwritten.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhotos}
                  leftIcon={
                    isUploadingPhotos ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {isUploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                </Button>

                <Link
                  to={projectId ? `/assets?projectId=${projectId}` : '/assets'}
                  className="h-8.5 px-3 rounded-control border border-app-border hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>Media Library</span>
                </Link>
              </div>
            </div>

            <div className="p-5">
              {isLoadingMedia ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : clientPhotos.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-10 text-center border-2 border-dashed border-slate-300 hover:border-brand-primary rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-all cursor-pointer space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Upload Property Photos to Get Started</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Drag and drop high-resolution JPG or PNG photos here, or click to browse files.
                    </p>
                  </div>
                  <Button type="button" variant="primary" size="sm" leftIcon={<UploadCloud className="w-3.5 h-3.5" />}>
                    Choose Photos
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {clientPhotos.map((photo, i) => (
                      <div
                        key={photo._id || photo.id || i}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:border-slate-400 transition-all shadow-2xs"
                      >
                        <img
                          src={photo.url}
                          alt={photo.filename || `Photo ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-[10px] text-white font-medium truncate">
                          {photo.category || 'Interior'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 1 Footer Navigation */}
            <div className="p-4 bg-slate-50 border-t border-app-border flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {clientPhotos.length > 0
                  ? `${clientPhotos.length} property photos ready for AI analysis.`
                  : 'Upload photos to proceed to analysis.'}
              </span>

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={clientPhotos.length === 0}
                onClick={() => {
                  if (!currentVision) {
                    handleAnalyzeProperty();
                  }
                  setActiveStep(2);
                }}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Continue to Analyze Property (Step 2)
              </Button>
            </div>
          </Card>
        )}

        {/* ================= STEP 2: ANALYZE PROPERTY ================= */}
        {activeStep === 2 && (
          <Card className="border border-app-border bg-white rounded-card shadow-xs overflow-hidden">
            <div className="p-5 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Analyze Property
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      currentVision
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {currentVision ? 'Analysis Complete' : 'Pending Analysis'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  AI extracts architectural style, lighting profile, room layouts, and unique selling points to craft authentic marketing images.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAnalyzeProperty}
                disabled={analyzeMutation.isPending}
                leftIcon={
                  analyzeMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  )
                }
              >
                {analyzeMutation.isPending ? 'Analyzing...' : currentVision ? 'Re-Analyze Property' : 'Analyze Property'}
              </Button>
            </div>

            <div className="p-5">
              {currentVision ? (
                <div className="space-y-4">
                  {/* Vision Summary */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-900 block mb-1">Property Analysis Summary:</span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {currentVision.analysisSummary}
                    </p>
                  </div>

                  {/* Architecture & Lighting Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-700" />
                        <span>Property Type & Architecture</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">{currentVision.propertyType}</div>
                      <div className="text-slate-600">Architectural Style: <strong className="text-slate-800">{currentVision.architecturalStyle}</strong></div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-slate-700" />
                        <span>Lighting Profile & Color Palette</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">{currentVision.lightingProfile}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-500">Palette:</span>
                        {currentVision.dominantColors.map((color: string, idx: number) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detected Spaces & Unique Features */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Detected Spaces & Highlights:</span>
                    <div className="flex flex-wrap gap-2">
                      {currentVision.detectedSpaces.map((space: string, i: number) => (
                        <span
                          key={`s-${i}`}
                          className="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-800 border border-slate-200 font-medium"
                        >
                          {space}
                        </span>
                      ))}
                      {currentVision.uniqueFeatures.map((feat: string, i: number) => (
                        <span
                          key={`f-${i}`}
                          className="px-2.5 py-1 rounded-full text-xs bg-amber-50 text-amber-900 border border-amber-300 font-semibold"
                        >
                          ✦ {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Property Vision Analysis Ready to Run</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Click below to analyze the uploaded photos and detect spaces, lighting, and architectural highlights.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAnalyzeProperty}
                    disabled={analyzeMutation.isPending || clientPhotos.length === 0}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Property'}
                  </Button>
                </div>
              )}
            </div>

            {/* Step 2 Footer Navigation */}
            <div className="p-4 bg-slate-50 border-t border-app-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Back to Photos (Step 1)
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!currentVision}
                onClick={() => setActiveStep(3)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Continue to Generate Images (Step 3)
              </Button>
            </div>
          </Card>
        )}

        {/* ================= STEP 3: GENERATE MARKETING IMAGES ================= */}
        {activeStep === 3 && (
          <Card className="border border-app-border bg-white rounded-card shadow-xs overflow-hidden">
            <div className="p-5 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Generate Marketing Images
                  </h3>
                  {imagesList.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {imagesList.length} images generated (v{currentBatch?.version || 1})
                    </span>
                  )}
                  {currentBatch?.status === 'FAILED' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200">
                      v{currentBatch.version} Error
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Synthesize a fresh collection of professional marketing perspectives tailored to this property&apos;s architectural characteristics.
                </p>
              </div>

              {imagesList.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateFreshImages}
                  disabled={isGeneratingImages}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Regenerate Collection
                </Button>
              )}
            </div>

            <div className="p-5 space-y-5">
              {/* Batch Limit / Error Alert */}
              {currentBatch?.status === 'FAILED' && (
                <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-amber-950">Notice for Version {currentBatch.version}</p>
                    <p className="text-amber-800">
                      {currentBatch.errorMessage || 'AI image generation was interrupted or exceeded Gemini daily API limits.'}
                    </p>
                    <div className="pt-1 text-slate-700 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-amber-900">Recommended:</span>
                      <span>Switch Processing Mode to <strong>&quot;Enhanced Crops&quot;</strong> (Instant, uses your property photos, 100% free)</span>
                      {batches.some((b) => b.status === 'READY' && b.images && b.images.length > 0) && (
                        <span>
                          or{' '}
                          <button
                            type="button"
                            onClick={() => {
                              const readyBatch = [...batches].find((b) => b.status === 'READY' && b.images && b.images.length > 0);
                              if (readyBatch) setSelectedBatchId(readyBatch._id);
                            }}
                            className="underline font-bold text-brand-primary hover:text-emerald-700 cursor-pointer"
                          >
                            switch to earlier ready batch
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                {/* Shots Count */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Number of Shots:</label>
                  <select
                    value={targetImageCount}
                    onChange={(e) => setTargetImageCount(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-control font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value={10}>10 Images</option>
                    <option value={12}>12 Images</option>
                    <option value={15}>15 Images (Recommended)</option>
                  </select>
                </div>

                {/* Style Preset */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Visual Style Preset:</label>
                  <select
                    value={selectedStylePreset}
                    onChange={(e) => setSelectedStylePreset(e.target.value as 'HERITAGE_LUXURY' | 'HIGH_GROWTH_ROI')}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-control font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="HERITAGE_LUXURY">Heritage Luxury (Warm, editorial lighting)</option>
                    <option value="HIGH_GROWTH_ROI">High-Growth ROI (Crisp, modern lighting)</option>
                  </select>
                </div>

                {/* Generation Mode */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Processing Mode:</label>
                  <select
                    value={generationMode}
                    onChange={(e) => setGenerationMode(e.target.value as 'ENHANCED_CROPS' | 'AI_IMAGE')}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-control font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="ENHANCED_CROPS">Enhanced Crops (Free, Instant & Uses Property Photos)</option>
                    <option value="AI_IMAGE">AI Image Generation (Creative Gemini synthesis - Subject to Quota)</option>
                  </select>
                </div>
              </div>

              {/* Progress Bar when Generating */}
              {isGeneratingImages && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-950">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                      <span>{generationStepText || 'Generating marketing perspectives...'}</span>
                    </span>
                    <span className="text-[11px] text-amber-800">Processing...</span>
                  </div>
                  <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full w-3/4 animate-pulse rounded-full" />
                  </div>
                </div>
              )}

              {/* Generated Images Preview Strip or Prompt */}
              {imagesList.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Current Generated Collection (Version {currentBatch?.version || 1}):
                    </span>
                    <span className="text-xs text-slate-500">
                      {imagesList.length} shots ready for selection
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[280px] overflow-y-auto pr-1">
                    {imagesList.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        onClick={() => {
                          setLightboxImage(img);
                          setIsCompareMode(false);
                        }}
                        className={`group relative aspect-[4/5] rounded-lg overflow-hidden border cursor-pointer transition-all shadow-2xs hover:shadow-sm ${
                          img.isSelected ? 'border-brand-primary ring-2 ring-brand-primary' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.title || `Shot ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-[10px] text-white font-medium truncate">
                          #{idx + 1} {img.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">No Marketing Images Generated Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Configure your desired shots count and style above, then click Generate to create the image collection.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateFreshImages}
                    disabled={isGeneratingImages}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Generate {targetImageCount} Marketing Images
                  </Button>
                </div>
              )}
            </div>

            {/* Step 3 Footer Navigation */}
            <div className="p-4 bg-slate-50 border-t border-app-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(2)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Back to Analysis (Step 2)
              </Button>

              <div className="flex items-center gap-2">
                {imagesList.length === 0 ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateFreshImages}
                    disabled={isGeneratingImages}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Generate Marketing Images
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveStep(4)}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Continue to Select Images (Step 4)
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* ================= STEP 4: SELECT YOUR BEST IMAGES ================= */}
        {activeStep === 4 && (
          <Card className="border border-app-border bg-white rounded-card shadow-xs overflow-hidden">
            <div className="p-5 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Select Your Best Images
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      selectedCount >= 2
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {selectedCount} of {totalCount} selected (min. 2 required)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Choose the images you want to feature in your animated property reel. Click on any image to inspect or compare.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {batches.length > 1 && (
                  <select
                    value={currentBatch?._id || ''}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="h-8 px-2.5 bg-white border border-slate-300 rounded-control font-medium text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                  >
                    {[...batches]
                      .sort((a, b) => b.version - a.version)
                      .map((b) => (
                        <option key={b._id} value={b._id}>
                          Version {b.version} ({b.images?.length || 0} images{b.status === 'FAILED' ? ' - Error' : ''})
                        </option>
                      ))}
                  </select>
                )}
                {totalCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(selectedCount !== totalCount)}
                  >
                    {selectedCount === totalCount ? 'Deselect All' : `Select All (${totalCount})`}
                  </Button>
                )}
              </div>
            </div>

            <div className="p-5">
              {/* Batch Failure Warning Banner */}
              {currentBatch?.status === 'FAILED' && (
                <div className="mb-4 p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-amber-950">Notice for Batch Version {currentBatch.version}</p>
                    <p className="text-amber-800">
                      {currentBatch.errorMessage || 'AI image generation was interrupted or exceeded Gemini daily API quota.'}
                    </p>
                    {batches.some((b) => b.status === 'READY' && b.images && b.images.length > 0) && (
                      <div className="pt-1 text-slate-700">
                        <strong>Ready batch available:</strong>{' '}
                        <button
                          type="button"
                          onClick={() => {
                            const readyBatch = [...batches].find((b) => b.status === 'READY' && b.images && b.images.length > 0);
                            if (readyBatch) setSelectedBatchId(readyBatch._id);
                          }}
                          className="underline font-bold text-brand-primary hover:text-emerald-700 cursor-pointer"
                        >
                          Switch to latest ready version ({[...batches].find((b) => b.status === 'READY' && b.images && b.images.length > 0)?.images?.length} images) &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isLoadingBatches || isLoadingDetail ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
                  ))}
                </div>
              ) : imagesList.length === 0 ? (
                <div className="p-10 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">No Images Available in Version {currentBatch?.version || 1}</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      {currentBatch?.errorMessage || 'Please go back to Step 3 and generate marketing images first.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {batches.some((b) => b.status === 'READY' && b.images && b.images.length > 0) && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          const readyBatch = [...batches].find((b) => b.status === 'READY' && b.images && b.images.length > 0);
                          if (readyBatch) setSelectedBatchId(readyBatch._id);
                        }}
                      >
                        Switch to Ready Batch ({[...batches].find((b) => b.status === 'READY' && b.images && b.images.length > 0)?.images?.length} Images)
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={() => setActiveStep(3)}>
                      Go to Step 3: Generate Images
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
                  {imagesList.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      onClick={() => {
                        setLightboxImage(img);
                        setIsCompareMode(false);
                      }}
                      className={`group relative aspect-[4/5] rounded-xl overflow-hidden border cursor-pointer transition-all duration-150 shadow-2xs hover:shadow-md ${
                        img.isSelected
                          ? 'border-brand-primary ring-2 ring-brand-primary bg-brand-primary-soft/10'
                          : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.title || `Shot ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Top Checkbox & Badges */}
                      <div className="absolute inset-x-0 top-0 p-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-10">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(img.id);
                          }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all ${
                            img.isSelected
                              ? 'bg-brand-primary text-white shadow-xs'
                              : 'bg-white/90 hover:bg-white text-transparent border border-slate-300'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 stroke-[3] ${img.isSelected ? 'text-white' : 'text-transparent'}`} />
                        </div>

                        <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Bottom Info & Quick Actions */}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white space-y-1">
                        <div className="text-xs font-semibold truncate">{img.title}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-300">
                          <span className="truncate">{img.category}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20">
                            {img.generationMode === 'ENHANCED_CROPS' ? 'Enhanced' : 'AI Render'}
                          </span>
                        </div>

                        {/* Hover Actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleSetImageApproval(img.id, 'APPROVED', e)}
                            className="p-1 rounded bg-white/20 hover:bg-emerald-600 text-white text-[10px] font-semibold"
                            title="Approve"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSaveToMedia(img.id, e)}
                            disabled={savingMediaImageId === img.id || Boolean(img.savedToMediaId)}
                            className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-white hover:text-slate-900 text-[10px] font-medium"
                            title="Save to project media library"
                          >
                            {img.savedToMediaId ? 'Saved' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage(img);
                              setIsCompareMode(true);
                            }}
                            className="p-1 rounded bg-white/20 hover:bg-white hover:text-slate-900 text-[10px]"
                            title="Compare with original"
                          >
                            <SplitSquareVertical className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4 Footer Navigation */}
            <div className="p-4 bg-slate-50 border-t border-app-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(3)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Back to Generation (Step 3)
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={selectedCount < 2}
                onClick={() => setActiveStep(5)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                {selectedCount >= 2
                  ? `Continue to Create Reel (${selectedCount} images selected) →`
                  : `Select at least 2 images (${selectedCount}/2)`}
              </Button>
            </div>
          </Card>
        )}

        {/* ================= STEP 5: CREATE PROPERTY REEL ================= */}
        {activeStep === 5 && (
          <Card className="border border-app-border bg-white rounded-card shadow-xs overflow-hidden">
            <div className="p-5 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    5
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Create Property Reel
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedCount} images ready for animation
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Synthesize an animated 9:16 vertical video reel with camera pan/zoom motion, soundtrack, and property typography.
                </p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Selected Images Strip */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">Images Selected for Animation ({selectedCount}):</span>
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="text-brand-primary hover:underline font-medium text-xs"
                  >
                    Modify Selection
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {selectedImages.map((img, i) => (
                    <img
                      key={img.id || i}
                      src={img.url}
                      alt={img.title}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0"
                    />
                  ))}
                </div>
              </div>

              {/* Reel Variation Styles */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Reel Animation Style:
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'CINEMATIC_SHOWCASE' as ReelVariationStyle,
                      title: 'Cinematic Showcase',
                      duration: '18s · Smooth Slow-Pans',
                      desc: 'Architectural push-ins, ambient soundtrack, and elegant subtitles.',
                    },
                    {
                      id: 'LUXURY_PRESENTATION' as ReelVariationStyle,
                      title: 'Luxury Presentation',
                      duration: '15s · Elegant Dissolves',
                      desc: 'Focal zooms, warm golden grading, and luxury branded title cards.',
                    },
                    {
                      id: 'MODERN_PROMO_AD' as ReelVariationStyle,
                      title: 'Modern Promo Ad',
                      duration: '12s · Dynamic Transitions',
                      desc: 'Snappy pacing, bold feature callouts, and strong investment call-to-action.',
                    },
                  ].map((variation) => {
                    const isSelected = selectedReelVariation === variation.id;
                    return (
                      <div
                        key={variation.id}
                        onClick={() => setSelectedReelVariation(variation.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brand-primary bg-brand-primary-soft/30 ring-2 ring-brand-primary shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className={isSelected ? 'text-brand-primary' : 'text-slate-900'}>
                            {variation.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-white border border-slate-200 text-slate-700">
                            {variation.duration}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {variation.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reel Synthesis Progress Bar */}
              {isSynthesizingReel && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-950">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                      <span>{reelProgressText || 'Synthesizing 9:16 vertical reel...'}</span>
                    </span>
                    <span className="text-[11px] text-amber-800">Processing video...</span>
                  </div>
                  <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full w-3/4 animate-pulse rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Step 5 Footer Navigation */}
            <div className="p-4 bg-slate-50 border-t border-app-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(4)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Back to Select Images (Step 4)
              </Button>

              <div className="flex items-center gap-2">
                {currentBatch?.reels && currentBatch.reels.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveStep(6)}
                  >
                    View Existing Reel (Step 6)
                  </Button>
                )}

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateReel}
                  disabled={isSynthesizingReel || selectedCount < 2}
                  leftIcon={
                    isSynthesizingReel ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Film className="w-4 h-4" />
                    )
                  }
                >
                  {isSynthesizingReel ? 'Synthesizing...' : 'Create Property Reel (9:16)'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ================= STEP 6: PREVIEW & DOWNLOAD ================= */}
        {activeStep === 6 && (
          <Card className="border border-app-border bg-white rounded-card shadow-xs overflow-hidden">
            <div className="p-5 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    6
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Preview & Download
                  </h3>
                  {activeReel && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        activeReel.approvalStatus === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : activeReel.approvalStatus === 'REJECTED'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      Status: {activeReel.approvalStatus}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Preview your vertical property reel, approve it for marketing publication, and download the finished MP4 video.
                </p>
              </div>

              {currentBatch?.reels && currentBatch.reels.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Reel Version:</span>
                  <select
                    value={activeReel?.id}
                    onChange={(e) => setSelectedReelId(e.target.value)}
                    className="h-8.5 px-2 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800 text-xs focus:outline-none"
                  >
                    {currentBatch.reels.map((r) => (
                      <option key={r.id} value={r.id}>
                        v{r.versionNumber}: {r.variationStyle.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-5">
              {activeReel ? (
                <div className="space-y-5">
                  {/* Phone Frame 9:16 Video Player */}
                  <div className="relative mx-auto max-w-[270px] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-xl border border-slate-800 group">
                    <video
                      ref={videoRef}
                      src={activeReel.videoUrl}
                      poster={activeReel.posterFrameUrl}
                      playsInline
                      loop
                      onTimeUpdate={() => {
                        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current) setDuration(videoRef.current.duration);
                      }}
                      onClick={togglePlay}
                      className="w-full h-full object-cover cursor-pointer"
                    />

                    {/* Big Center Play Icon when Paused */}
                    {!isPlaying && (
                      <div
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-2xs cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                          <Play className="w-6 h-6 fill-current ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Top Overlay Badge */}
                    <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs font-semibold text-[10px]">
                        9:16 Instagram Reel
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          activeReel.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-500 text-white'
                            : activeReel.approvalStatus === 'REJECTED'
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-400 text-slate-950'
                        }`}
                      >
                        {activeReel.approvalStatus}
                      </span>
                    </div>

                    {/* Bottom Playback Bar */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white space-y-2">
                      <div className="text-xs font-bold truncate">{activeReel.title}</div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="p-1 hover:text-amber-400 transition-colors"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>

                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          step={0.1}
                          value={currentTime}
                          onChange={handleVideoSeek}
                          className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                        />

                        <span className="text-[10px] font-mono shrink-0">
                          {formatVideoTime(currentTime)} / {formatVideoTime(duration || activeReel.durationSeconds)}
                        </span>

                        <button
                          type="button"
                          onClick={toggleMute}
                          className="p-1 hover:text-amber-400 transition-colors"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Approval & Download Buttons Bar */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleSetApproval('APPROVED')}
                      disabled={activeReel.approvalStatus === 'APPROVED'}
                      leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    >
                      Approve Reel
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetApproval('REJECTED')}
                      disabled={activeReel.approvalStatus === 'REJECTED'}
                      leftIcon={<XCircle className="w-4 h-4 text-rose-500" />}
                    >
                      Reject
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownloadFile(
                          activeReel.videoUrl,
                          `${activeReel.title.toLowerCase().replace(/\s+/g, '-')}-reel.mp4`
                        )
                      }
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Download MP4 (9:16)
                    </Button>
                  </div>

                  {/* Next Steps Action Bar when Approved */}
                  {activeReel.approvalStatus === 'APPROVED' && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-sm text-emerald-950">Reel Successfully Approved!</p>
                          <p className="text-emerald-800 text-xs">
                            Yeh reel approve ho chuki hai aur aapke property marketing catalog mein register ho gayi hai.
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center gap-2">
                        <Link to="/captions">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            leftIcon={<Sparkles className="w-4 h-4" />}
                          >
                            Step A: Create AI Captions
                          </Button>
                        </Link>

                        <Link to="/campaigns">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                          >
                            Step B: Launch Ad Campaign
                          </Button>
                        </Link>

                        <Link to="/approvals">
                          <Button type="button" variant="outline" size="sm">
                            View All Approvals
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <Film className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">No Reel Synthesized Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Please go back to Step 5 to create a property reel from your selected images.
                    </p>
                  </div>
                  <Button type="button" variant="primary" size="sm" onClick={() => setActiveStep(5)}>
                    Go to Step 5: Create Reel
                  </Button>
                </div>
              )}
            </div>

            {/* Step 6 Footer Navigation */}
            <div className="p-4 bg-slate-50 border-t border-app-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(5)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Back to Create Reel (Step 5)
              </Button>

              {activeReel && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleDownloadFile(
                      activeReel.videoUrl,
                      `${activeReel.title.toLowerCase().replace(/\s+/g, '-')}-reel.mp4`
                    )
                  }
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download Reel Video
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* ── 3. Fullscreen Lightbox & Side-by-Side Comparison Modal for Images ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{lightboxImage.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 font-medium">
                  {lightboxImage.generationMode === 'ENHANCED_CROPS' ? 'Enhanced Photo' : 'AI Render'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {lightboxImage.category} · {lightboxImage.cameraAngle} · {lightboxImage.lightingStyle}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sourceOriginalPhoto && (
                <button
                  type="button"
                  onClick={() => setIsCompareMode((prev) => !prev)}
                  className={`h-8 px-3 rounded-control text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCompareMode
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span>{isCompareMode ? 'Full View' : 'Compare with Original'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.min(prev + 0.25, 2.5))}
                className="p-2 rounded-control bg-white/10 hover:bg-white/20 text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.max(prev - 0.25, 0.75))}
                className="p-2 rounded-control bg-white/10 hover:bg-white/20 text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDownloadFile(lightboxImage.url, `${lightboxImage.title || 'property-shot'}.jpg`)
                }
                className="p-2 rounded-control bg-white/10 hover:bg-white/20 text-white"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-control bg-white/10 hover:bg-white/20 text-white"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          {isCompareMode && sourceOriginalPhoto ? (
            <div
              className="relative flex-1 w-full max-w-5xl my-4 overflow-y-auto flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-stretch">
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700 flex flex-col">
                  <span className="text-xs font-bold text-white mb-2">Original Photo Reference</span>
                  <div className="flex-1 flex items-center justify-center overflow-hidden min-h-[300px] bg-black/40 rounded-lg">
                    <img
                      src={sourceOriginalPhoto.url}
                      alt="Original"
                      className="max-h-[55vh] max-w-full object-contain rounded"
                    />
                  </div>
                </div>

                <div className="bg-slate-900/80 rounded-xl p-3 border border-amber-500/40 flex flex-col">
                  <span className="text-xs font-bold text-amber-300 mb-2">Generated Perspective</span>
                  <div className="flex-1 flex items-center justify-center overflow-hidden min-h-[300px] bg-black/40 rounded-lg">
                    <img
                      src={lightboxImage.url}
                      alt={lightboxImage.title}
                      className="max-h-[55vh] max-w-full object-contain rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="relative flex-1 w-full max-w-4xl flex items-center justify-center overflow-hidden my-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                style={{ transform: `scale(${lightboxZoom})` }}
                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-150"
              />
            </div>
          )}

          <div
            className="text-xs text-slate-400 flex items-center gap-3 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Press Esc to close</span>
            <span>•</span>
            <button
              type="button"
              onClick={(e) => handleRegenerateSingleImage(lightboxImage.id, e)}
              disabled={regeneratingImageId === lightboxImage.id}
              className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regeneratingImageId === lightboxImage.id ? 'animate-spin' : ''}`} />
              <span>{regeneratingImageId === lightboxImage.id ? 'Regenerating...' : 'Regenerate this camera perspective'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
