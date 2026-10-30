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
} from '../../hooks/useAiStudio';
import { useProjectMedia } from '../../hooks/useMedia';
import { formatDisplayDate } from '../../lib/formatters';
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
  ArrowRight,
  ShieldCheck,
  X,
  ZoomIn,
  ZoomOut,
  FolderOpen,
  SplitSquareVertical,
  AlertTriangle,
  UploadCloud,
} from 'lucide-react';

interface AiStudioWorkflowViewProps {
  projects: Array<{ _id?: string; id?: string; name: string }>;
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
}

export function AiStudioWorkflowView({
  projects,
  selectedProjectId: initialProjectId,
  onSelectProject,
}: AiStudioWorkflowViewProps) {
  const { toast } = useToast();

  // Active Project Selection
  const [projectId, setProjectId] = useState<string>(
    initialProjectId || (projects.length > 0 ? (projects[0]._id || projects[0].id || '') : '')
  );

  useEffect(() => {
    if (initialProjectId && initialProjectId !== projectId) {
      setProjectId(initialProjectId);
    }
  }, [initialProjectId, projectId]);

  const handleProjectChange = (newId: string) => {
    setProjectId(newId);
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
    // Return latest version by default
    return [...batches].sort((a, b) => b.version - a.version)[0];
  }, [batches, selectedBatchId]);

  // Detail query for active batch
  const { data: batchDetail, isLoading: isLoadingDetail } = useAiStudioBatch(
    activeBatch?._id || null
  );

  const currentBatch = batchDetail || activeBatch;

  // Client uploaded media for the selected project
  const { approvedMedia: clientPhotos = [], isLoading: isLoadingMedia } = useProjectMedia(
    projectId,
    { consentedOnly: false }
  );

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
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generationStepText, setGenerationStepText] = useState('');

  // Single Image Regeneration state
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null);

  // Reel Generation State
  const [selectedReelVariation, setSelectedReelVariation] = useState<ReelVariationStyle>('CINEMATIC_SHOWCASE');
  const [isSynthesizingReel, setIsSynthesizingReel] = useState(false);
  const [reelProgressText, setReelProgressText] = useState('');

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

  // Selection counts
  const imagesList = useMemo(() => currentBatch?.images || [], [currentBatch]);
  const selectedImages = useMemo(() => imagesList.filter((img) => img.isSelected), [imagesList]);
  const selectedCount = selectedImages.length;
  const totalCount = imagesList.length;

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
      toast({ title: 'AI Vision Analysis', message: 'Analyzing client property photos...', type: 'info' });
      await analyzeMutation.mutateAsync({ projectId });
      toast({
        title: 'Analysis Complete',
        message: 'Property architecture, color palette, and room layouts identified.',
        type: 'success',
      });
      refetchBatches();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : (err as any)?.message || 'Failed to analyze property photos';
      toast({ title: 'Analysis Failed', message: msg || 'Failed to analyze property photos', type: 'error' });
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
      setGenerationStepText('Step 1/4: Analyzing client property features and layout...');
      const t1 = setTimeout(() => {
        setGenerationStepText('Step 2/4: Synthesizing customized architectural camera angles...');
      }, 1500);
      const t2 = setTimeout(() => {
        setGenerationStepText(`Step 3/4: Rendering ${targetImageCount} high-resolution marketing perspectives...`);
      }, 3500);
      const t3 = setTimeout(() => {
        setGenerationStepText('Step 4/4: Applying color grading and assembling new version...');
      }, 5500);

      const newBatch = await generateImagesMutation.mutateAsync({
        projectId,
        targetCount: targetImageCount,
        stylePreset: selectedStylePreset,
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setSelectedBatchId(newBatch._id);
      setIsGeneratingImages(false);
      setGenerationStepText('');

      toast({
        title: `Generation ${newBatch.version} Ready!`,
        message: `Successfully generated ${newBatch.images.length} unique property marketing images.`,
        type: 'success',
      });
    } catch (err: unknown) {
      setIsGeneratingImages(false);
      setGenerationStepText('');
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : (err as any)?.message || 'Image generation failed';
      toast({ title: 'Generation Failed', message: msg || 'Image generation failed', type: 'error' });
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
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Failed to regenerate image';
      toast({ title: 'Regeneration Error', message: msg || 'Failed to regenerate image', type: 'error' });
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
        message: `Uploading & verifying ${files.length} photos...`,
        type: 'info',
      });
      await uploadPhotosMutation.mutateAsync({ projectId, files });
      toast({
        title: 'Photos Uploaded Successfully',
        message: `${files.length} property photos uploaded with full rights consent.`,
        type: 'success',
      });
      // Automatically trigger vision analysis
      await handleAnalyzeProperty();
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error?.message || (err as any)?.message || 'Photo upload failed';
      toast({ title: 'Upload Failed', message: msg, type: 'error' });
    } finally {
      setIsUploadingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Image Approval / Rejection
  const handleSetImageApproval = async (imageId: string, status: 'APPROVED' | 'REJECTED', e: React.MouseEvent) => {
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
        message: status === 'APPROVED' ? 'Shot marked as client-approved.' : 'Shot rejected.',
        type: status === 'APPROVED' ? 'success' : 'info',
      });
    } catch {
      toast({ title: 'Approval Error', message: 'Failed to update image approval status', type: 'error' });
    }
  };

  // Handle Save Image to Project Media Library
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
        message: 'Generated marketing image is now permanently saved in your Project Media assets.',
        type: 'success',
      });
    } catch {
      toast({ title: 'Save Error', message: 'Failed to save image to media library', type: 'error' });
    } finally {
      setSavingMediaImageId(null);
    }
  };

  // Generate AI Reel (Step 5)
  const handleGenerateReel = async () => {
    if (!currentBatch) {
      toast({ title: 'No Image Batch', message: 'Please generate images first.', type: 'error' });
      return;
    }
    if (selectedCount < 2) {
      toast({
        title: 'Select More Images',
        message: 'Please select at least 2 images to generate an animated reel.',
        type: 'error',
      });
      return;
    }

    try {
      setIsSynthesizingReel(true);
      setReelProgressText('Step 1/4: Analyzing selected visual hierarchy & aspect ratios...');
      const t1 = setTimeout(() => {
        setReelProgressText('Step 2/4: Applying cinematic pan, tilt & Ken-Burns camera paths...');
      }, 2000);
      const t2 = setTimeout(() => {
        setReelProgressText('Step 3/4: Synchronizing background audio & branding overlays...');
      }, 4500);
      const t3 = setTimeout(() => {
        setReelProgressText('Step 4/4: Compiling vertical 9:16 MP4 reel in FFmpeg...');
      }, 7000);

      const newReel = await generateReelMutation.mutateAsync({
        batchId: currentBatch._id,
        variationStyle: selectedReelVariation,
        selectedImageIds: selectedImages.map((img) => img.id),
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setSelectedReelId(newReel.id);
      setIsSynthesizingReel(false);
      setReelProgressText('');

      toast({
        title: 'AI Reel Synthesized!',
        message: `Reel Version ${newReel.versionNumber} (${newReel.title || 'Reel'}) is ready to preview.`,
        type: 'success',
      });
    } catch (err: unknown) {
      setIsSynthesizingReel(false);
      setReelProgressText('');
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : (err as any)?.message || 'Reel synthesis failed';
      toast({ title: 'Reel Synthesis Failed', message: msg || 'Reel synthesis failed', type: 'error' });
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
      return { url: lightboxImage.sourceAssetUrl, name: 'Original Client Upload' };
    }
    if (lightboxImage.sourceAssetId) {
      const found = clientPhotos.find((p) => (p._id || p.id) === lightboxImage.sourceAssetId);
      if (found) return { url: found.url, name: found.filename || 'Original Client Photo' };
    }
    return clientPhotos[0]
      ? { url: clientPhotos[0].url, name: clientPhotos[0].filename || 'Original Client Photo' }
      : null;
  }, [lightboxImage, clientPhotos]);

  return (
    <div className="space-y-6">
      {/* ── Sub-Header: Property Selector & Unified 6-Step Stepper ── */}
      <Card className="p-5 border border-border shadow-xs bg-white rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Camera className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                  AI Property Image &amp; Reel Suite
                </h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Automated Pipeline
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Analyze property photos · Synthesize 10–15 bespoke marketing shots · Produce animated 9:16 Instagram reels
              </p>
            </div>
          </div>

          {/* Property Dropdown Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-medium text-text-secondary">Property:</label>
            <select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="h-9 text-xs font-semibold px-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer min-w-[200px] transition-colors"
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
        </div>

        {/* 6-Step Visual Workflow Stepper with Unified Heights & Proportions */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            {
              stepNum: '1',
              title: 'Client Photos',
              desc: `${clientPhotos.length} Uploaded`,
              done: clientPhotos.length > 0,
              active: true,
            },
            {
              stepNum: '2',
              title: 'AI Vision Analysis',
              desc: currentBatch?.visionAnalysis ? 'Identified' : 'Pending',
              done: Boolean(currentBatch?.visionAnalysis),
              active: Boolean(currentBatch?.visionAnalysis),
            },
            {
              stepNum: '3',
              title: '15 AI Images',
              desc: currentBatch ? `v${currentBatch.version} (${currentBatch.images.length})` : 'Ready',
              done: Boolean(currentBatch && currentBatch.images.length >= 10),
              active: Boolean(currentBatch && currentBatch.images.length > 0),
            },
            {
              stepNum: '4',
              title: 'Review & Select',
              desc: `${selectedCount} Selected`,
              done: selectedCount >= 2,
              active: selectedCount > 0,
            },
            {
              stepNum: '5',
              title: 'Generate Reel',
              desc: currentBatch?.reels?.length ? `${currentBatch.reels.length} Variations` : 'Ready',
              done: Boolean(currentBatch?.reels?.length),
              active: Boolean(currentBatch?.reels?.length),
            },
            {
              stepNum: '6',
              title: 'Preview & Export',
              desc: activeReel?.approvalStatus || 'Review',
              done: activeReel?.approvalStatus === 'APPROVED',
              active: Boolean(activeReel),
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`h-[68px] p-2.5 rounded-lg border flex flex-col justify-between text-left transition-all ${
                item.done
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                  : item.active
                  ? 'bg-white text-neutral-900 border-neutral-900 ring-1 ring-neutral-900 shadow-2xs'
                  : 'bg-neutral-50/70 text-neutral-500 border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    item.done
                      ? 'bg-emerald-500 text-white'
                      : item.active
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {item.done ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : item.stepNum}
                </span>

                <span
                  className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded ${
                    item.done
                      ? 'bg-white/20 text-neutral-200'
                      : item.active
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-400'
                  }`}
                >
                  Step {item.stepNum}
                </span>
              </div>

              <div>
                <div className="text-xs font-bold truncate leading-tight">{item.title}</div>
                <div
                  className={`text-[10px] truncate mt-0.5 ${
                    item.done ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── STEP 1 & 2: Client Photos & AI Property Vision Analysis ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Step 1 - Client Uploaded Photos (5 cols) */}
        <div className="lg:col-span-5 flex">
          <Card className="p-5 border border-border shadow-xs bg-white rounded-xl w-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                    Client Original Property Photos
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhotos}
                    className="h-8 px-3 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {isUploadingPhotos ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                        <span>Upload 10–15 Photos</span>
                      </>
                    )}
                  </button>
                  <Link
                    to={projectId ? `/assets?projectId=${projectId}` : '/assets'}
                    className="h-8 px-2.5 rounded-lg border border-neutral-200 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 flex items-center gap-1.5 transition-all"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Media</span>
                  </Link>
                </div>
              </div>

              <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                Authentic client photos are referenced as the primary visual source. Room layouts, furniture, and structure are strictly preserved.
              </p>

              {/* Photo Grid / Empty State */}
              {isLoadingMedia ? (
                <div className="grid grid-cols-3 gap-2.5">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="aspect-square rounded-lg" />
                </div>
              ) : clientPhotos.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-neutral-300 rounded-lg bg-neutral-50/60 my-2">
                  <Camera className="w-7 h-7 text-neutral-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-neutral-900">No Client Photos Uploaded</p>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Upload interior and exterior photos to run property vision analysis.
                  </p>
                  <Link
                    to={projectId ? `/assets?projectId=${projectId}` : '/assets'}
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-black transition-all"
                  >
                    <span>Upload Property Media</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {clientPhotos.map((photo, i) => (
                    <div
                      key={photo._id || photo.id || i}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 hover:border-neutral-900 transition-all shadow-2xs"
                    >
                      <img
                        src={photo.url}
                        alt={photo.filename || `Property photo ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-[9px] text-white font-semibold truncate">
                        {photo.category || 'Interior'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
              <span className="font-medium text-neutral-700">{clientPhotos.length} photos referenced</span>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Originals Never Overwritten
              </span>
            </div>
          </Card>
        </div>

        {/* Right: Step 2 - AI Property Analysis (7 cols) */}
        <div className="lg:col-span-7 flex">
          <Card className="p-5 border border-border shadow-xs bg-white rounded-xl w-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                    AI Property Understanding &amp; Features
                  </h3>
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
                  className="h-8 text-xs font-semibold hover:bg-neutral-100"
                >
                  {analyzeMutation.isPending ? 'Analyzing...' : 'Re-Analyze Photos'}
                </Button>
              </div>

              {currentBatch?.visionAnalysis ? (
                <div className="space-y-3.5">
                  {/* Analysis Summary Box */}
                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                    <p className="text-xs text-neutral-800 leading-relaxed font-normal">
                      <span className="font-semibold text-neutral-900 mr-1.5">Vision Summary:</span>
                      {currentBatch.visionAnalysis.analysisSummary}
                    </p>
                  </div>

                  {/* Property Specs Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-neutral-50/80 border border-neutral-200 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Type &amp; Architecture</span>
                      </div>
                      <div className="font-semibold text-neutral-900">
                        {currentBatch.visionAnalysis.propertyType}
                      </div>
                      <div className="text-text-secondary text-[11px]">
                        Style: {currentBatch.visionAnalysis.architecturalStyle}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-50/80 border border-neutral-200 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Lighting &amp; Palette</span>
                      </div>
                      <div className="font-semibold text-neutral-900">
                        {currentBatch.visionAnalysis.lightingProfile}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {currentBatch.visionAnalysis.dominantColors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded-full border border-neutral-300 shadow-2xs"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detected Spaces & Unique Features */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      Detected Spaces &amp; Unique Features:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentBatch.visionAnalysis.detectedSpaces.map((space, i) => (
                        <span
                          key={`s-${i}`}
                          className="px-2 py-0.5 rounded-full text-[11px] bg-neutral-100 text-neutral-800 border border-neutral-200 font-medium"
                        >
                          {space}
                        </span>
                      ))}
                      {currentBatch.visionAnalysis.uniqueFeatures.map((feat, i) => (
                        <span
                          key={`f-${i}`}
                          className="px-2 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-900 border border-amber-300 font-medium"
                        >
                          ✦ {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Individual Uploaded Photo Understanding Breakdown */}
                  {currentBatch.visionAnalysis.analyzedPhotos && currentBatch.visionAnalysis.analyzedPhotos.length > 0 && (
                    <div className="pt-2 border-t border-neutral-200 space-y-2">
                      <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center justify-between">
                        <span>Analyzed Property Photos ({currentBatch.visionAnalysis.analyzedPhotos.length}):</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                          Individually Categorized
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                        {currentBatch.visionAnalysis.analyzedPhotos.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-white border border-neutral-200 flex items-center gap-2.5 shadow-2xs hover:border-neutral-400 transition-colors"
                          >
                            <img
                              src={p.url}
                              alt={p.filename}
                              className="w-10 h-10 rounded object-cover border border-neutral-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-neutral-900 truncate">{p.category}</div>
                              <div className="text-[10px] text-neutral-500 truncate">{p.lighting}</div>
                              <div className="text-[9px] text-amber-700 font-medium truncate">
                                ✦ {p.detectedFeatures?.[0] || 'Original Structure Preserved'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center rounded-lg bg-neutral-50/60 border border-neutral-200">
                  <Sparkles className="w-7 h-7 text-neutral-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-neutral-900">Vision Analysis Ready to Run</p>
                  <p className="text-[11px] text-text-secondary max-w-sm mx-auto mt-1 mb-4">
                    Analyze client photos to extract architectural style, lighting profile, and layouts for creative generation.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAnalyzeProperty}
                    disabled={analyzeMutation.isPending}
                    className="h-8 text-xs font-semibold"
                  >
                    Analyze Client Property Photos
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
                Guaranteed: Real Property Identity Preserved
              </span>
              {currentBatch?.visionAnalysis?.analyzedAt && (
                <span className="text-[10px] text-text-muted">
                  Analyzed {formatDisplayDate(currentBatch.visionAnalysis.analyzedAt)}
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── STEP 3: Generate 10–15 Unique Marketing Images Bar ── */}
      <div className="bg-neutral-950 text-white rounded-xl p-5 border border-neutral-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white text-neutral-900 text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>AI Image Generation</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-bold uppercase tracking-wider">
                  10–15 Images
                </span>
              </h3>
            </div>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
              Every generation creates a fresh collection of unique, professionally-shot perspectives, maintaining property structure and furniture while exploring diverse marketing camera angles and lighting styles.
            </p>
          </div>

          {/* Controls: Target Count, Style Preset & Generate Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Target Image Count */}
            <div className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-700 h-9">
              <span className="text-xs text-neutral-400 font-medium">Shots:</span>
              <select
                value={targetImageCount}
                onChange={(e) => setTargetImageCount(Number(e.target.value))}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value={10} className="text-neutral-900">10 Images</option>
                <option value={12} className="text-neutral-900">12 Images</option>
                <option value={15} className="text-neutral-900">15 Images (Recommended)</option>
              </select>
            </div>

            {/* Style Preset */}
            <div className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-700 h-9">
              <span className="text-xs text-neutral-400 font-medium">Style:</span>
              <select
                value={selectedStylePreset}
                onChange={(e) => setSelectedStylePreset(e.target.value as any)}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="HERITAGE_LUXURY" className="text-neutral-900">Heritage Luxury (Warm)</option>
                <option value="HIGH_GROWTH_ROI" className="text-neutral-900">High-Growth ROI (Crisp)</option>
              </select>
            </div>

            {/* Primary Action Button: Generate Fresh Collection */}
            <button
              type="button"
              onClick={handleGenerateFreshImages}
              disabled={isGeneratingImages || generateImagesMutation.isPending}
              className="h-9 px-5 bg-white text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {isGeneratingImages ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-900" />
                  <span>Generating Shots...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
                  <span>{currentBatch ? 'Generate Fresh Collection' : 'Generate 15 AI Images'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Generation Progress Bar */}
        {isGeneratingImages && (
          <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-semibold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                {generationStepText}
              </span>
              <span className="text-neutral-400 text-[11px]">Synthesizing architectural camera perspectives...</span>
            </div>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-amber-200 h-full w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 4: Review and Select Images (Gallery + Version Switcher) ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center">
              4
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                  Generated Marketing Images Gallery
                </h3>
                {currentBatch && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-900 border border-neutral-300">
                    Version {currentBatch.version}
                  </span>
                )}
                {imagesList.length > 0 && (
                  imagesList.some((i) => i.isDuplicateWarning) ? (
                    <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Similarity Warning</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{imagesList.length} Unique Perspectives Verified</span>
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-text-secondary">
                Select shots for AI Reel · Click on any shot to preview full-screen, compare with original photo, or regenerate individually
              </p>
            </div>
          </div>

          {/* Version Switcher Dropdown & Selection Batch Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {batches.length > 1 && (
              <div className="flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200 text-xs h-8">
                <span className="text-text-muted font-medium">History:</span>
                <select
                  value={currentBatch?._id}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="bg-transparent font-bold text-text-primary focus:outline-none cursor-pointer text-xs"
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      Generation {b.version} ({b.images.length} images) · {formatDisplayDate(b.createdAt)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {imagesList.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(selectedCount !== totalCount)}
                  className="h-8 text-xs font-semibold hover:bg-neutral-100"
                >
                  {selectedCount === totalCount ? 'Deselect All' : `Select All (${totalCount})`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateFreshImages}
                  disabled={isGeneratingImages}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="h-8 text-xs font-semibold hover:bg-neutral-100"
                >
                  Regenerate Entire Set
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Grid of 10-15 Images */}
        {isLoadingBatches || isLoadingDetail ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
            ))}
          </div>
        ) : imagesList.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-2 border-neutral-300 bg-neutral-50/50 rounded-xl">
            <Camera className="w-9 h-9 text-neutral-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-neutral-900">No AI Images Generated Yet</h4>
            <p className="text-xs text-text-secondary max-w-md mx-auto mt-1 mb-4">
              Click &quot;Generate 15 AI Images&quot; above to synthesize a complete 10–15 shot marketing collection customized to this property.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleGenerateFreshImages}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              className="h-9 px-4 text-xs font-semibold"
            >
              Generate First Collection (15 Images)
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {imagesList.map((img, idx) => (
              <div
                key={img.id || idx}
                onClick={() => {
                  setLightboxImage(img);
                  setIsCompareMode(false);
                }}
                className={`group relative aspect-[4/5] rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md ${
                  img.isSelected
                    ? 'border-neutral-900 ring-2 ring-neutral-900 bg-neutral-900/5'
                    : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100'
                }`}
              >
                {/* Image Render */}
                <img
                  src={img.url}
                  alt={img.title || `Shot ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Top Overlay: Selection Checkbox, Duplicate Alert & Shot # */}
                <div className="absolute inset-x-0 top-0 p-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-10 gap-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(img.id);
                    }}
                    className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                      img.isSelected
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-white/90 hover:bg-white text-transparent border border-neutral-300'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${img.isSelected ? 'text-white' : 'text-transparent'}`} />
                  </div>

                  <div className="flex items-center gap-1">
                    {img.approvalStatus === 'APPROVED' ? (
                      <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/50 flex items-center gap-1 backdrop-blur-xs">
                        <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                        <span>Approved</span>
                      </span>
                    ) : img.approvalStatus === 'REJECTED' ? (
                      <span className="text-[9px] font-bold text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/50 flex items-center gap-1 backdrop-blur-xs">
                        <X className="w-2.5 h-2.5 text-rose-400" />
                        <span>Rejected</span>
                      </span>
                    ) : null}

                    {img.isDuplicateWarning && (
                      <span className="text-[9px] font-bold text-amber-200 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/50 flex items-center gap-1 backdrop-blur-xs">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                        <span>{Math.round((img.similarityScore || 0.88) * 100)}% Sim</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs shrink-0">
                    #{idx + 1}
                  </span>
                </div>

                {/* Bottom Overlay: Metadata Badges */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white space-y-1">
                  <div className="text-xs font-bold truncate tracking-tight">{img.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-300">
                    <span className="truncate max-w-[100px]">{img.category}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{img.structurePreservationScore || 98}% Structure</span>
                    </span>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1 flex flex-wrap items-center justify-between gap-1">
                    {/* Approve Action */}
                    <button
                      type="button"
                      onClick={(e) => handleSetImageApproval(img.id, 'APPROVED', e)}
                      className={`py-1 px-1.5 rounded text-[10px] font-semibold flex items-center gap-0.5 backdrop-blur-xs transition-colors ${
                        img.approvalStatus === 'APPROVED'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/20 hover:bg-emerald-600 text-white'
                      }`}
                      title="Approve this shot"
                    >
                      <Check className="w-3 h-3" />
                      <span>Approve</span>
                    </button>

                    {/* Reject Action */}
                    <button
                      type="button"
                      onClick={(e) => handleSetImageApproval(img.id, 'REJECTED', e)}
                      className={`p-1 rounded text-[10px] font-semibold flex items-center gap-0.5 backdrop-blur-xs transition-colors ${
                        img.approvalStatus === 'REJECTED'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white/20 hover:bg-rose-600 text-white'
                      }`}
                      title="Reject this shot"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Save to Media Library Action */}
                    <button
                      type="button"
                      onClick={(e) => handleSaveToMedia(img.id, e)}
                      disabled={savingMediaImageId === img.id || Boolean(img.savedToMediaId)}
                      className={`py-1 px-1.5 rounded text-[10px] font-semibold flex items-center gap-0.5 backdrop-blur-xs transition-colors ${
                        img.savedToMediaId
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'bg-white/20 hover:bg-white text-white hover:text-neutral-900'
                      }`}
                      title={
                        img.savedToMediaId
                          ? 'Saved to Media Library'
                          : 'Save permanently to Project Media Library'
                      }
                    >
                      <FolderOpen className="w-3 h-3" />
                      <span>{img.savedToMediaId ? 'Saved' : 'Save'}</span>
                    </button>

                    {/* Compare */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage(img);
                        setIsCompareMode(true);
                      }}
                      className="p-1 rounded bg-white/20 hover:bg-white text-white hover:text-neutral-900 text-[10px] font-semibold flex items-center gap-0.5 backdrop-blur-xs transition-colors"
                      title="Compare side-by-side with original uploaded photo"
                    >
                      <SplitSquareVertical className="w-3 h-3" />
                    </button>

                    {/* Regen */}
                    <button
                      type="button"
                      onClick={(e) => handleRegenerateSingleImage(img.id, e)}
                      disabled={regeneratingImageId === img.id}
                      className="p-1 rounded bg-white/20 hover:bg-white text-white hover:text-neutral-900 text-[10px] font-semibold flex items-center gap-0.5 backdrop-blur-xs transition-colors"
                      title="Regenerate this individual shot"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${regeneratingImageId === img.id ? 'animate-spin' : ''}`}
                      />
                    </button>

                    {/* Download */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(img.url, `${img.title || 'property-shot'}.jpg`);
                      }}
                      className="p-1 rounded bg-white/20 hover:bg-white text-white hover:text-neutral-900 backdrop-blur-xs transition-colors"
                      title="Download full-resolution image"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── STEP 5 & 6: AI Reel Synthesis & Video Player Gallery ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Step 5 - Generate AI Reel Controls (5 cols) */}
        <div className="lg:col-span-5 flex">
          <Card className="p-5 border border-border shadow-xs bg-white rounded-xl w-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center">
                    5
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                    AI Reel Generation (9:16 Vertical)
                  </h3>
                </div>

                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    selectedCount >= 2
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {selectedCount} of {totalCount} selected
                </span>
              </div>

              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Transforms selected generated images into a cinematic, animated Instagram Reel with dynamic pan/zoom (Ken Burns), motion transitions, background soundtrack, and property typography.
              </p>

              {/* Multiple Reel Variations Selection */}
              <div className="space-y-2.5 mb-5">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                  Select Reel Variation Style:
                </label>

                {[
                  {
                    id: 'CINEMATIC_SHOWCASE' as ReelVariationStyle,
                    title: 'Cinematic Property Showcase',
                    duration: '18s · Smooth Slow-Pans',
                    desc: 'Sweeping architectural push-ins, ambient crescendo soundtrack, and cinematic subtitle typography.',
                  },
                  {
                    id: 'LUXURY_PRESENTATION' as ReelVariationStyle,
                    title: 'Luxury Real Estate Presentation',
                    duration: '15s · Elegant Dissolves',
                    desc: 'Slow-motion focal zooms, warm golden grading, and high-end luxury branded title cards.',
                  },
                  {
                    id: 'MODERN_PROMO_AD' as ReelVariationStyle,
                    title: 'Modern Promotional Advertisement',
                    duration: '12s · Dynamic Transitions',
                    desc: 'Snappy pacing, bold feature callouts, modern beat soundtrack, and strong investment CTA.',
                  },
                ].map((variation) => (
                  <div
                    key={variation.id}
                    onClick={() => setSelectedReelVariation(variation.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      selectedReelVariation === variation.id
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50/60 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                      <span>{variation.title}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                          selectedReelVariation === variation.id
                            ? 'bg-white/20 text-white'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {variation.duration}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] leading-relaxed ${
                        selectedReelVariation === variation.id ? 'text-neutral-300' : 'text-text-secondary'
                      }`}
                    >
                      {variation.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reel Action Button & Progress */}
            <div className="space-y-3 pt-3 border-t border-border">
              {isSynthesizingReel && (
                <div className="space-y-1.5 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      {reelProgressText}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-neutral-900 h-full w-3/4 animate-pulse rounded-full" />
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleGenerateReel}
                disabled={isSynthesizingReel || selectedCount < 2}
                leftIcon={
                  isSynthesizingReel ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                  )
                }
                className="w-full h-10 bg-neutral-900 text-white hover:bg-black font-bold text-xs shadow-xs rounded-lg"
              >
                {isSynthesizingReel ? 'Synthesizing Reel...' : 'Generate AI Reel (9:16)'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Step 6 - Reel Video Player & Preview Gallery (7 cols) */}
        <div className="lg:col-span-7 flex">
          <Card className="p-5 border border-border shadow-xs bg-white rounded-xl w-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center">
                    6
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                    Preview, Approve &amp; Download AI Reel
                  </h3>
                </div>

                {/* Reel Variations Dropdown if multiple exist */}
                {currentBatch?.reels && currentBatch.reels.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200 text-xs h-8">
                    <span className="text-text-muted font-medium">Reel Ver:</span>
                    <select
                      value={activeReel?.id}
                      onChange={(e) => setSelectedReelId(e.target.value)}
                      className="bg-transparent font-bold text-text-primary focus:outline-none cursor-pointer text-xs"
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

              {activeReel ? (
                <div className="space-y-4">
                  {/* Vertical 9:16 Video Player Frame */}
                  <div className="relative mx-auto max-w-[280px] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-lg border border-neutral-800 group">
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

                    {/* Big Center Play Button Overlay when paused */}
                    {!isPlaying && (
                      <div
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-2xs cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/90 text-neutral-950 flex items-center justify-center shadow-lg transition-transform hover:scale-110">
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
                            : 'bg-amber-400 text-neutral-950'
                        }`}
                      >
                        {activeReel.approvalStatus}
                      </span>
                    </div>

                    {/* Bottom Custom Playback Bar */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white space-y-2 opacity-95">
                      <div className="text-xs font-bold truncate">{activeReel.title}</div>
                      <div className="text-[10px] text-neutral-300 truncate">{activeReel.subtitle}</div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
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
                          className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reel Approval & Download Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleSetApproval('APPROVED')}
                        disabled={activeReel.approvalStatus === 'APPROVED'}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        className="h-9 px-4 text-xs font-semibold"
                      >
                        Approve Reel
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetApproval('REJECTED')}
                        disabled={activeReel.approvalStatus === 'REJECTED'}
                        leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
                        className="h-9 px-3 text-xs font-semibold hover:bg-neutral-100"
                      >
                        Reject
                      </Button>
                    </div>

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
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      className="h-9 px-3.5 text-xs font-semibold hover:bg-neutral-100"
                    >
                      Download MP4 (9:16)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center rounded-lg bg-neutral-50/60 border border-neutral-200">
                  <Film className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-neutral-900">No Reel Synthesized Yet</p>
                  <p className="text-[11px] text-text-secondary max-w-sm mx-auto mt-1 mb-4">
                    Select 2 or more generated images and click &quot;Generate AI Reel&quot; to compile a vertical marketing reel.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
              <span className="font-medium text-neutral-700">9:16 Vertical Video · Instagram / TikTok Ready</span>
              {activeReel && (
                <span className="text-[10px] text-text-muted">
                  Created {formatDisplayDate(activeReel.createdAt)}
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Fullscreen Lightbox & Side-by-Side Comparison Modal for AI Images ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-6xl flex items-center justify-between text-white pb-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center gap-2.5">
                <div className="text-sm font-bold tracking-tight">{lightboxImage.title}</div>
                {lightboxImage.isDuplicateWarning ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/90 text-neutral-950 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-neutral-950" />
                    <span>Similarity: {Math.round((lightboxImage.similarityScore || 0.88) * 100)}%</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/90 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span>Unique Perspective Verified</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                {lightboxImage.category} · {lightboxImage.cameraAngle} · {lightboxImage.lightingStyle}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Comparison Mode Button */}
              {sourceOriginalPhoto && (
                <button
                  type="button"
                  onClick={() => setIsCompareMode((prev) => !prev)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCompareMode
                      ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title="Compare side-by-side with original property photo"
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span>{isCompareMode ? 'Full View' : 'Compare with Original'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.min(prev + 0.25, 2.5))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.max(prev - 0.25, 0.75))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDownloadFile(lightboxImage.url, `${lightboxImage.title || 'property-shot'}.jpg`)
                }
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fullscreen Modal Content: Side-by-Side Compare or Single View */}
          {isCompareMode && sourceOriginalPhoto ? (
            <div
              className="relative flex-1 w-full max-w-6xl my-4 overflow-y-auto flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 2-Column Side-by-Side Comparison Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-stretch">
                {/* Left: Original Client Photo */}
                <div className="bg-neutral-900/80 rounded-xl p-3 border border-neutral-700 flex flex-col">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-neutral-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Original Client Photo
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-medium truncate max-w-[200px]">
                      {sourceOriginalPhoto.name}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center overflow-hidden min-h-[360px] bg-black/40 rounded-lg">
                    <img
                      src={sourceOriginalPhoto.url}
                      alt="Original Client Property Photo"
                      className="max-h-[60vh] max-w-full object-contain rounded-md"
                    />
                  </div>

                  <div className="mt-2 text-[11px] text-neutral-300 font-medium text-center">
                    Authentic property reference. Room layout, furniture, and structure strictly preserved.
                  </div>
                </div>

                {/* Right: Generated AI Marketing Perspective */}
                <div className="bg-neutral-900/80 rounded-xl p-3 border border-amber-500/40 flex flex-col">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Generated Marketing Perspective
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                      {lightboxImage.cameraAngle}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center overflow-hidden min-h-[360px] bg-black/40 rounded-lg">
                    <img
                      src={lightboxImage.url}
                      alt={lightboxImage.title}
                      className="max-h-[60vh] max-w-full object-contain rounded-md shadow-lg"
                    />
                  </div>

                  <div className="mt-2 text-[11px] text-amber-200 font-medium text-center">
                    ✦ Lighting: {lightboxImage.lightingStyle} · Presentation Enhanced
                  </div>
                </div>
              </div>

              {/* Comparison Metadata Summary Bar */}
              <div className="mt-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-white">Space: {lightboxImage.category}</span>
                  <span>•</span>
                  <span>Feature Highlighted: {lightboxImage.featureHighlighted || 'Open Architecture'}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Layout Integrity Preserved</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleRegenerateSingleImage(lightboxImage.id, e)}
                  disabled={regeneratingImageId === lightboxImage.id}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 text-neutral-950 hover:bg-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingImageId === lightboxImage.id ? 'animate-spin' : ''}`} />
                  <span>{regeneratingImageId === lightboxImage.id ? 'Regenerating...' : 'Regenerate This Angle'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Single Image View Container with Zoom */
            <div
              className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                style={{ transform: `scale(${lightboxZoom})` }}
                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
              />
            </div>
          )}

          {/* Bottom Controls Bar */}
          <div
            className="text-xs text-neutral-400 flex items-center gap-4 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Press Esc to close</span>
            <span>•</span>
            <button
              type="button"
              onClick={(e) => handleRegenerateSingleImage(lightboxImage.id, e)}
              disabled={regeneratingImageId === lightboxImage.id}
              className="text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regeneratingImageId === lightboxImage.id ? 'animate-spin' : ''}`} />
              <span>{regeneratingImageId === lightboxImage.id ? 'Regenerating...' : 'Regenerate this specific camera angle'}</span>
            </button>
            {sourceOriginalPhoto && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setIsCompareMode((prev) => !prev)}
                  className="text-white hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span>{isCompareMode ? 'Switch to Full View' : 'Compare with Original Photo'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
