import { useState, useRef, useMemo } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  useProjectMedia,
  usePatchMedia,
  useDeleteMedia,
  useBulkDeleteMedia,
  useReorderMedia,
  BackendMediaAsset,
  MediaCategory,
  PatchMediaData,
} from '../../hooks/useMedia';
import { BackendUnit } from '../../hooks/useUnits';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '../ui/Modal';
import { useToast } from '../ui/Toast';
import {
  UploadCloud,
  Image as ImageIcon,
  Video,
  FileText,
  Star,
  Trash2,
  Eye,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Info,
  X,
  Check,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Circle,
  UserCheck,
} from 'lucide-react';

interface InFlightUpload {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'error' | 'success';
  error?: string;
  cancelSource?: CancelTokenSource;
}

interface ProjectMediaSectionProps {
  projectId: string;
  units?: BackendUnit[];
  readOnly?: boolean;
}

const CATEGORY_TABS: Array<{ id: string; label: string }> = [
  { id: 'ALL', label: 'All Media' },
  { id: 'EXTERIOR', label: 'Exterior' },
  { id: 'INTERIOR', label: 'Interior' },
  { id: 'ROOMS', label: 'Rooms' },
  { id: 'FLOOR_PLANS', label: 'Floor Plans' },
  { id: 'AMENITIES', label: 'Amenities' },
  { id: 'BROCHURE', label: 'Brochure' },
  { id: 'VIDEOS', label: 'Videos' },
  { id: 'LOGO', label: 'Logo' },
];

export function ProjectMediaSection({ projectId, units = [], readOnly = false }: ProjectMediaSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('ALL');
  const [inFlightUploads, setInFlightUploads] = useState<InFlightUpload[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [viewingAsset, setViewingAsset] = useState<BackendMediaAsset | null>(null);

  // Soft-delete conflict modal state (409)
  const [conflictModalAsset, setConflictModalAsset] = useState<{
    asset: BackendMediaAsset;
    inUse: { creatives?: Array<{ id: string; name: string }>; campaigns?: Array<{ id: string; name: string }> };
  } | null>(null);

  // Hooks
  const queryClient = useQueryClient();
  const { data: mediaList = [], isLoading, refetch } = useProjectMedia(projectId);
  const patchMutation = usePatchMedia();
  const deleteMutation = useDeleteMedia();
  const bulkDeleteMutation = useBulkDeleteMedia();
  const reorderMutation = useReorderMedia();

  const hasApprovedCover = useMemo(() => {
    return mediaList.some((m) => m.isCover && (m.isApproved || m.approvalStatus === 'APPROVED'));
  }, [mediaList]);

  // AI Content Creation Readiness Analysis (GDPL / ACE Infra regional standards)
  const aiReadiness = useMemo(() => {
    const hasHero = mediaList.some(
      (m) =>
        m.isCover ||
        m.category === 'EXTERIOR' ||
        /facade|elevation|exterior|front|drone/i.test(m.room || '') ||
        /facade|elevation|exterior|hero/i.test(m.fileName || '')
    );

    const hasLiving = mediaList.some(
      (m) =>
        /living|hall|drawing|lounge/i.test(m.room || '') ||
        (m.category === 'INTERIOR' && !/bed|kitchen|bath/i.test(m.room || '')) ||
        /living|hall|drawing/i.test(m.fileName || '')
    );

    const hasBedroom = mediaList.some(
      (m) =>
        /bed|suite|master/i.test(m.room || '') ||
        (m.category === 'ROOMS' && !/bath/i.test(m.room || '')) ||
        /bed|suite/i.test(m.fileName || '')
    );

    const hasKitchen = mediaList.some(
      (m) =>
        /kitchen|dining|pantry/i.test(m.room || '') ||
        /kitchen|dining/i.test(m.fileName || '')
    );

    const hasBalconyOrAmenity = mediaList.some(
      (m) =>
        /balcony|terrace|deck|view|amenity|club|gym|pool/i.test(m.room || '') ||
        m.category === 'AMENITIES' ||
        /balcony|amenity|club/i.test(m.fileName || '')
    );

    const hasPresenterAvatar = mediaList.some(
      (m) =>
        /presenter|anchor|host|avatar|speaker|face/i.test(m.room || '') ||
        /presenter|host|avatar/i.test(m.fileName || '') ||
        (m.category === 'LOGO' && /host|presenter|avatar/i.test(m.fileName || ''))
    );

    const slots = [
      {
        id: 'hero',
        label: 'Hero Facade / Elevation',
        description: 'Crucial for 4:5 Showcase & Act 1 Hook',
        ready: hasHero,
        required: true,
      },
      {
        id: 'living',
        label: 'Living Room / Drawing Hall',
        description: 'Act 2 spatial walkthrough & top-right thumbnail',
        ready: hasLiving,
        required: true,
      },
      {
        id: 'bedroom',
        label: 'Master Bedroom / Suite',
        description: 'Act 3 private comfort & mid-right thumbnail',
        ready: hasBedroom,
        required: true,
      },
      {
        id: 'kitchen',
        label: 'Modular Kitchen / Dining',
        description: 'Act 3 daily luxury & lower-right thumbnail',
        ready: hasKitchen,
        required: true,
      },
      {
        id: 'amenity',
        label: 'Balcony / Amenity / Club',
        description: 'Act 4 high-life view & urgency CTA scene',
        ready: hasBalconyOrAmenity,
        required: true,
      },
      {
        id: 'presenter',
        label: 'Presenter Avatar / Host Photo',
        description: 'Verified Host anchor badge on 9:16 vertical walkthrough',
        ready: hasPresenterAvatar,
        required: false,
      },
    ];

    const coreSlots = slots.filter((s) => s.required);
    const completedCore = coreSlots.filter((s) => s.ready).length;
    const percentage = Math.round((completedCore / coreSlots.length) * 100);

    return {
      slots,
      percentage,
      isFullyReady: percentage === 100,
      hasPresenterAvatar,
      missingLabels: coreSlots.filter((s) => !s.ready).map((s) => s.label),
    };
  }, [mediaList]);

  // Filter media by active category tab
  const filteredMedia = useMemo(() => {
    if (activeCategoryTab === 'ALL') return mediaList;
    return mediaList.filter((m) => {
      if (activeCategoryTab === 'VIDEOS') return m.type === 'VIDEO' || m.category === 'VIDEOS';
      if (activeCategoryTab === 'BROCHURE') return m.type === 'DOCUMENT' || m.category === 'BROCHURE';
      return m.category === activeCategoryTab;
    });
  }, [mediaList, activeCategoryTab]);

  // Upload handler for single or multiple files
  const handleFilesSelected = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newUploads: InFlightUpload[] = fileArray.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      progress: 0,
      status: 'uploading',
    }));

    setInFlightUploads((prev) => [...prev, ...newUploads]);

    // Upload each file independently
    newUploads.forEach((uploadItem) => {
      uploadSingleFile(uploadItem);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadSingleFile = async (uploadItem: InFlightUpload) => {
    const cancelSource = axios.CancelToken.source();

    setInFlightUploads((prev) =>
      prev.map((item) =>
        item.id === uploadItem.id ? { ...item, cancelSource, status: 'uploading', progress: 0, error: undefined } : item
      )
    );

    const formData = new FormData();
    formData.append('file', uploadItem.file);
    formData.append('projectId', projectId);

    // Initial default category inference
    let defaultCategory: MediaCategory = 'EXTERIOR';
    if (uploadItem.file.type.startsWith('video/')) {
      defaultCategory = 'VIDEOS';
    } else if (uploadItem.file.type === 'application/pdf') {
      defaultCategory = 'BROCHURE';
    } else if (activeCategoryTab !== 'ALL' && activeCategoryTab !== 'VIDEOS' && activeCategoryTab !== 'BROCHURE') {
      defaultCategory = activeCategoryTab as MediaCategory;
    }

    formData.append('category', defaultCategory);
    formData.append('actualOrIllustrative', 'ACTUAL');
    formData.append('rightsConsent', 'true');

    try {
      const response = await axios.post('/api/v1/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
        cancelToken: cancelSource.token,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setInFlightUploads((prev) =>
              prev.map((item) => (item.id === uploadItem.id ? { ...item, progress: pct } : item))
            );
          }
        },
      });

      if (response.data?.success) {
        // Remove from in-flight list after a short delay and refresh list
        setInFlightUploads((prev) => prev.filter((item) => item.id !== uploadItem.id));
        queryClient.invalidateQueries({ queryKey: ['media'] });
        refetch();
        toast({
          title: 'Upload Complete',
          message: `${uploadItem.file.name} saved successfully`,
          type: 'success',
        });
      }
    } catch (err: unknown) {
      if (axios.isCancel(err)) {
        setInFlightUploads((prev) => prev.filter((item) => item.id !== uploadItem.id));
        return;
      }

      let errorMsg = 'Failed to upload media file';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        errorMsg = err.response.data.error.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      setInFlightUploads((prev) =>
        prev.map((item) =>
          item.id === uploadItem.id ? { ...item, status: 'error', error: errorMsg } : item
        )
      );

      toast({
        title: 'Upload Failed',
        message: errorMsg,
        type: 'error',
      });
    }
  };

  const handleCancelUpload = (uploadId: string) => {
    const item = inFlightUploads.find((u) => u.id === uploadId);
    if (item?.cancelSource) {
      item.cancelSource.cancel('Upload cancelled by user');
    }
    setInFlightUploads((prev) => prev.filter((u) => u.id !== uploadId));
  };

  const handleRetryUpload = (uploadItem: InFlightUpload) => {
    uploadSingleFile(uploadItem);
  };

  // Set Cover Image
  const handleSetCover = async (asset: BackendMediaAsset) => {
    if (readOnly) return;
    try {
      await patchMutation.mutateAsync({
        id: asset._id || asset.id!,
        data: { isCover: true },
      });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      refetch();
      toast({
        title: 'Cover Image Set',
        message: `${asset.fileName} is now the primary project cover`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Action Failed',
        message: err instanceof Error ? err.message : 'Could not set cover image',
        type: 'error',
      });
    }
  };

  // Reordering media assets
  const handleMoveMedia = async (index: number, direction: 'UP' | 'DOWN') => {
    if (readOnly) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    const newMediaList = [...mediaList];
    const temp = newMediaList[index];
    newMediaList[index] = newMediaList[targetIndex];
    newMediaList[targetIndex] = temp;

    const mediaIds = newMediaList.map((m) => m._id || m.id!);
    try {
      await reorderMutation.mutateAsync({ projectId, mediaIds });
      refetch();
    } catch (err: unknown) {
      toast({
        title: 'Reorder Failed',
        message: err instanceof Error ? err.message : 'Could not update order',
        type: 'error',
      });
    }
  };

  // Tag updates: Category, Room, Unit, Actual/Illustrative, Consent
  const handleUpdateTags = async (asset: BackendMediaAsset, updates: PatchMediaData) => {
    if (readOnly) return;
    try {
      await patchMutation.mutateAsync({
        id: asset._id || asset.id!,
        data: updates,
      });
      refetch();
      toast({
        title: 'Tags Updated',
        message: `Saved tags for ${asset.fileName}`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Update Failed',
        message: err instanceof Error ? err.message : 'Failed to update metadata',
        type: 'error',
      });
    }
  };

  // Deletion handling with soft-check (409)
  const handleDeleteAsset = async (asset: BackendMediaAsset, force = false) => {
    if (readOnly) return;
    try {
      await deleteMutation.mutateAsync({ id: asset._id || asset.id!, force });
      setConflictModalAsset(null);
      refetch();
      toast({
        title: 'Media Deleted',
        message: `${asset.fileName} removed from project vault`,
        type: 'info',
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        // Media is in use by creative or campaign
        const conflictData = err.response.data?.inUse || {};
        setConflictModalAsset({ asset, inUse: conflictData });
      } else {
        toast({
          title: 'Delete Failed',
          message: err instanceof Error ? err.message : 'Could not delete media asset',
          type: 'error',
        });
      }
    }
  };

  // Bulk Deletion
  const handleBulkDelete = async () => {
    if (readOnly || selectedAssetIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedAssetIds.length} selected asset(s)?`
      )
    ) {
      return;
    }

    try {
      await bulkDeleteMutation.mutateAsync({ ids: selectedAssetIds });
      setSelectedAssetIds([]);
      refetch();
      toast({
        title: 'Bulk Delete Complete',
        message: `Removed ${selectedAssetIds.length} assets`,
        type: 'info',
      });
    } catch (err: unknown) {
      toast({
        title: 'Bulk Delete Failed',
        message: err instanceof Error ? err.message : 'Failed to delete some assets',
        type: 'error',
      });
    }
  };

  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filteredMedia.map((m) => m._id || m.id!).filter(Boolean);
    const areAllFilteredSelected =
      allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedAssetIds.includes(id));

    if (areAllFilteredSelected) {
      setSelectedAssetIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedAssetIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  return (
    <div className="space-y-6">
      {/* Informational Guidance Box */}
      <div className="p-4 border border-[#E5E5E5] bg-[#F5F5F5] rounded-[10px] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#0A0A0A] shrink-0 mt-0.5" />
        <div className="text-[13px] space-y-1">
          <p className="font-semibold text-[#0A0A0A]">Real photos keep AI content accurate</p>
          <p className="text-[#525252] leading-relaxed">
            Upload actual site photographs, elevations, sample flat interiors, and official brochures.
            Media tagged with a specific unit type is strictly reserved for that unit&apos;s collateral and will never mix facts.
          </p>
        </div>
      </div>

      {/* Cover Image Requirement Callout */}
      {hasApprovedCover ? (
        <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] rounded-[10px] text-[13px] flex items-center gap-2">
          <Check className="w-4 h-4 text-[#15803D] shrink-0" />
          <span className="font-medium">Cover photo is active and approved. Ready for marketing submission.</span>
        </div>
      ) : (
        <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] rounded-[10px] text-[13px] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-[13px] text-[#B45309]">
              Cover image required before final submission
            </p>
            <p className="text-[#92400E] leading-relaxed">
              At least one approved photo must be designated as the <strong>Cover Image</strong> with rights consent confirmed to mark this project as ready.
            </p>
          </div>
        </div>
      )}

      {/* AI Content Creation Readiness Checklist (GDPL / ACE Infra standard) */}
      <div className="p-4 sm:p-5 border border-[#E5E5E5] bg-white rounded-[12px] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#0A0A0A] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[14px] font-semibold text-[#0A0A0A]">
                  AI Studio Readiness Checklist
                </h4>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    aiReadiness.isFullyReady
                      ? 'bg-[#DCFCE7] text-[#15803D]'
                      : 'bg-[#FEF3C7] text-[#B45309]'
                  }`}
                >
                  {aiReadiness.percentage}% Ready
                </span>
                {aiReadiness.hasPresenterAvatar && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E0E7FF] text-[#4338CA] flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Host Badge Attached
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#737373] mt-0.5">
                Required for Dual-Style Showcase Posters (GDPL / ACE Infra) &amp; 4-Act Presenter Walkthrough Videos
              </p>
            </div>
          </div>

          {/* Mini Progress Bar */}
          <div className="w-full sm:w-48 space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-[#737373]">
              <span>Core Slots Filled</span>
              <span>{aiReadiness.slots.filter((s) => s.required && s.ready).length} of 5</span>
            </div>
            <div className="w-full bg-[#E5E5E5] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  aiReadiness.isFullyReady ? 'bg-[#15803D]' : 'bg-[#0A0A0A]'
                }`}
                style={{ width: `${aiReadiness.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 6 Slots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {aiReadiness.slots.map((slot) => (
            <div
              key={slot.id}
              className={`p-3 rounded-[8px] border transition-colors flex items-start gap-2.5 ${
                slot.ready
                  ? 'bg-[#F0FDF4]/60 border-[#BBF7D0]'
                  : slot.required
                  ? 'bg-[#FAFAFA] border-[#E5E5E5]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {slot.ready ? (
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                ) : (
                  <Circle className="w-4 h-4 text-[#A3A3A3]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[12px] font-semibold truncate ${
                      slot.ready ? 'text-[#15803D]' : 'text-[#0A0A0A]'
                    }`}
                  >
                    {slot.label}
                  </span>
                  {!slot.required && (
                    <span className="text-[10px] text-[#737373] bg-[#E5E5E5] px-1.5 py-0.2 rounded font-normal shrink-0">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#737373] leading-tight mt-0.5">
                  {slot.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actionable Prompt if incomplete */}
        {!aiReadiness.isFullyReady && (
          <div className="text-[12px] text-[#737373] bg-[#F5F5F5] rounded-[8px] p-2.5 flex items-center justify-between">
            <span>
              💡 <strong>Next step:</strong> Upload or tag room photos for{' '}
              <span className="text-[#0A0A0A] font-medium">
                {aiReadiness.missingLabels.join(', ')}
              </span>{' '}
              to reach 100% video &amp; poster studio fidelity.
            </span>
          </div>
        )}
      </div>

      {/* Upload Drop Zone & Limits Display */}
      {!readOnly && (
        <div className="border border-dashed border-[#E5E5E5] hover:border-[#0A0A0A] rounded-[10px] transition-colors p-6 sm:p-8 bg-white flex flex-col items-center justify-center text-center">
          <UploadCloud className="w-10 h-10 text-[#737373] mb-3" />
          <h3 className="text-[16px] font-semibold text-[#0A0A0A] mb-1">
            Drag and drop photos, videos, or brochures
          </h3>
          <p className="text-[13px] text-[#737373] mb-4 max-w-md">
            Upload multiple files at once. Each asset is verified and stored in secure cloud storage.
          </p>

          {/* Limits Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5] rounded-[6px]">
              <ImageIcon className="w-3.5 h-3.5" /> Images: JPG, PNG, WebP (Max 10 MB)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5] rounded-[6px]">
              <Video className="w-3.5 h-3.5" /> Videos: MP4, MOV, WebM (Max 200 MB)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5] rounded-[6px]">
              <FileText className="w-3.5 h-3.5" /> Brochures: PDF (Max 20 MB)
            </span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,application/pdf"
            onChange={(e) => {
              if (e.target.files) handleFilesSelected(e.target.files);
            }}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse files
          </Button>
        </div>
      )}

      {/* In-Flight Uploads Progress List */}
      {inFlightUploads.length > 0 && (
        <div className="space-y-2 border border-[#E5E5E5] p-4 bg-[#FAFAFA] rounded-[10px]">
          <div className="flex items-center justify-between text-[13px] font-semibold text-[#0A0A0A] mb-2">
            <span>Uploading files ({inFlightUploads.length})</span>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#737373]" />
          </div>

          <div className="space-y-2">
            {inFlightUploads.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E5E5E5] rounded-[8px] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.file.type.startsWith('video/') ? (
                    <Video className="w-4 h-4 text-[#737373] shrink-0" />
                  ) : item.file.type === 'application/pdf' ? (
                    <FileText className="w-4 h-4 text-[#737373] shrink-0" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-[#737373] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-[#0A0A0A] truncate max-w-[200px] sm:max-w-[300px]">
                      {item.file.name}
                    </p>
                    <p className="text-[12px] text-[#737373]">
                      {(item.file.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                      {item.status === 'uploading' ? `${item.progress}%` : item.status}
                    </p>
                  </div>
                </div>

                {/* Progress bar or error message */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {item.status === 'uploading' && (
                    <div className="w-full sm:w-32 bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0A0A0A] h-full transition-all duration-200"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {item.status === 'error' && (
                    <span className="text-[12px] text-[#B91C1C] font-medium truncate max-w-xs">
                      {item.error || 'Upload error'}
                    </span>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === 'error' ? (
                      <button
                        type="button"
                        onClick={() => handleRetryUpload(item)}
                        className="p-1.5 text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-[6px]"
                        title="Retry"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleCancelUpload(item.id)}
                      className="p-1.5 text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-[6px]"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] pb-3">
        {/* Horizontal scroll category tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.id === 'ALL'
                ? mediaList.length
                : tab.id === 'VIDEOS'
                ? mediaList.filter((m) => m.type === 'VIDEO' || m.category === 'VIDEOS').length
                : tab.id === 'BROCHURE'
                ? mediaList.filter((m) => m.type === 'DOCUMENT' || m.category === 'BROCHURE').length
                : mediaList.filter((m) => m.category === tab.id).length;

            const isActive = activeCategoryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategoryTab(tab.id)}
                className={`px-3 py-1.5 text-[13px] font-medium whitespace-nowrap rounded-[8px] transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#0A0A0A] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] bg-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[12px] px-1.5 py-0.2 rounded-full tabular-nums font-semibold ${
                    isActive ? 'bg-[#262626] text-white' : 'bg-[#E5E5E5] text-[#525252]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bulk select / action controls */}
        {filteredMedia.length > 0 && !readOnly && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-[13px] text-[#525252] hover:text-[#0A0A0A] font-medium cursor-pointer"
            >
              {filteredMedia.length > 0 &&
              filteredMedia.every((m) => selectedAssetIds.includes(m._id || m.id!))
                ? 'Deselect all'
                : 'Select all'}
            </button>

            {selectedAssetIds.length > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 text-[12px] flex items-center gap-1.5 px-3"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedAssetIds.length})</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Media Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="aspect-[4/3] bg-[#F5F5F5] rounded-[10px] animate-pulse border border-[#E5E5E5]" />
          <div className="aspect-[4/3] bg-[#F5F5F5] rounded-[10px] animate-pulse border border-[#E5E5E5]" />
          <div className="aspect-[4/3] bg-[#F5F5F5] rounded-[10px] animate-pulse border border-[#E5E5E5]" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-10 h-10 text-[#737373]" />}
          title={`No ${activeCategoryTab === 'ALL' ? 'media' : activeCategoryTab.toLowerCase()} uploaded yet`}
          description="Real photos and videos keep AI content accurate and presentation-ready. Upload high-res images, drone captures, or floor plans."
          actionLabel={readOnly ? undefined : 'Upload media'}
          onAction={readOnly ? undefined : () => fileInputRef.current?.click()}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMedia.map((asset, index) => {
            const isSelected = selectedAssetIds.includes(asset._id || asset.id!);
            const isCover = Boolean(asset.isCover);
            const hasConsent = Boolean(asset.rightsConsent?.confirmed);

            return (
              <div
                key={asset._id || asset.id}
                className={`border bg-white rounded-[10px] shadow-card overflow-hidden flex flex-col justify-between transition-all ${
                  isCover
                    ? 'border-[#0A0A0A] ring-1 ring-[#0A0A0A]'
                    : isSelected
                    ? 'border-[#0A0A0A] bg-[#FAFAFA]'
                    : 'border-[#E5E5E5] hover:border-[#A3A3A3]'
                }`}
              >
                {/* Media Preview Box */}
                <div className="aspect-[16/10] bg-[#F5F5F5] relative overflow-hidden group border-b border-[#E5E5E5]">
                  {asset.type === 'VIDEO' ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-black">
                      <video
                        src={asset.fileUrl || asset.url}
                        poster={asset.thumbnailUrl}
                        className="w-full h-full object-cover"
                        controls={false}
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow">
                          <Video className="w-5 h-5 text-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : asset.type === 'DOCUMENT' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#F5F5F5] text-[#525252]">
                      <FileText className="w-10 h-10 text-[#737373] mb-2" />
                      <span className="text-[13px] font-semibold text-[#0A0A0A]">
                        Brochure PDF
                      </span>
                      <span className="text-[12px] text-[#737373] mt-1 truncate max-w-full">
                        {asset.fileName}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={asset.thumbnailUrl || asset.fileUrl || asset.url}
                      alt={asset.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to full fileUrl if thumbnail fails
                        if (asset.fileUrl && e.currentTarget.src !== asset.fileUrl) {
                          e.currentTarget.src = asset.fileUrl;
                        }
                      }}
                    />
                  )}

                  {/* Badges on preview */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 pointer-events-none">
                    {isCover && (
                      <span className="bg-[#0A0A0A] text-white text-[12px] font-medium px-2 py-0.5 rounded-[4px] flex items-center gap-1 shadow-xs">
                        <Star className="w-3 h-3 fill-white" /> Cover
                      </span>
                    )}
                    <span className="bg-white/95 text-[#0A0A0A] border border-[#E5E5E5] text-[12px] font-medium px-2 py-0.5 rounded-[4px] shadow-xs">
                      {asset.category || 'EXTERIOR'}
                    </span>
                  </div>

                  {/* Top Right Checkbox & Quick View */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingAsset(asset)}
                      className="p-1.5 bg-white/95 hover:bg-white text-[#0A0A0A] border border-[#E5E5E5] rounded-[6px] shadow-xs transition-colors cursor-pointer"
                      title="Preview in full size"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {!readOnly && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectAsset(asset._id || asset.id!)}
                        className="w-4 h-4 text-[#0A0A0A] border-[#E5E5E5] rounded-[4px] focus:ring-2 focus:ring-[#0A0A0A] cursor-pointer bg-white"
                        title="Select for bulk action"
                      />
                    )}
                  </div>
                </div>

                {/* Details & Metadata Tags */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Filename & size */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold text-[#0A0A0A] truncate" title={asset.fileName}>
                        {asset.fileName}
                      </p>
                      <span className="text-[12px] text-[#737373] whitespace-nowrap tabular-nums">
                        {asset.fileSizeKb ? `${(asset.fileSizeKb / 1024).toFixed(1)} MB` : ''}
                      </span>
                    </div>

                    {/* Metadata fields (only if not read-only) */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1 text-[13px]">
                      {/* Category selector */}
                      <div>
                        <label className="block text-[12px] font-medium text-[#737373] mb-1">
                          Category <span className="text-[#B91C1C]">*</span>
                        </label>
                        <select
                          disabled={readOnly}
                          value={asset.category || 'EXTERIOR'}
                          onChange={(e) =>
                            handleUpdateTags(asset, { category: e.target.value as MediaCategory })
                          }
                          className="w-full h-9 px-2.5 border border-[#E5E5E5] rounded-[8px] text-[13px] bg-white text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                        >
                          <option value="EXTERIOR">Exterior</option>
                          <option value="INTERIOR">Interior</option>
                          <option value="ROOMS">Rooms</option>
                          <option value="FLOOR_PLANS">Floor Plans</option>
                          <option value="AMENITIES">Amenities</option>
                          <option value="BROCHURE">Brochure</option>
                          <option value="VIDEOS">Videos</option>
                          <option value="LOGO">Logo</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      {/* Unit Tag selector */}
                      <div>
                        <label className="block text-[12px] font-medium text-[#737373] mb-1">
                          Unit Tag
                        </label>
                        <select
                          disabled={readOnly}
                          value={asset.unitId || ''}
                          onChange={(e) =>
                            handleUpdateTags(asset, { unitId: e.target.value ? e.target.value : (null as unknown as string) })
                          }
                          className="w-full h-9 px-2.5 border border-[#E5E5E5] rounded-[8px] text-[13px] bg-white text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] truncate"
                        >
                          <option value="">Project-wide</option>
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.unitNumber} ({u.unitType})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Room tag & Actual vs Illustrative */}
                    <div className="grid grid-cols-2 gap-2.5 text-[13px]">
                      <div>
                        <label className="block text-[12px] font-medium text-[#737373] mb-1">
                          Room / Location
                        </label>
                        <input
                          type="text"
                          disabled={readOnly}
                          placeholder="e.g. Master Bedroom"
                          defaultValue={asset.room || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (asset.room || '')) {
                              handleUpdateTags(asset, { room: e.target.value, roomType: e.target.value });
                            }
                          }}
                          className="w-full h-9 px-2.5 border border-[#E5E5E5] rounded-[8px] text-[13px] bg-white text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[#737373] mb-1">
                          Source Type
                        </label>
                        <select
                          disabled={readOnly}
                          value={asset.actualOrIllustrative || 'ACTUAL'}
                          onChange={(e) =>
                            handleUpdateTags(asset, {
                              actualOrIllustrative: e.target.value as 'ACTUAL' | 'ILLUSTRATIVE',
                            })
                          }
                          className="w-full h-9 px-2.5 border border-[#E5E5E5] rounded-[8px] text-[13px] bg-white text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                        >
                          <option value="ACTUAL">Actual Photo</option>
                          <option value="ILLUSTRATIVE">Illustrative Render</option>
                        </select>
                      </div>
                    </div>

                    {/* Rights Consent Checkbox */}
                    <div className="pt-2 border-t border-[#E5E5E5]">
                      <label className="flex items-start gap-2 cursor-pointer text-[12px] text-[#525252] select-none">
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={hasConsent}
                          onChange={(e) =>
                            handleUpdateTags(asset, { rightsConsent: e.target.checked })
                          }
                          className="mt-0.5 w-4 h-4 text-[#0A0A0A] border-[#E5E5E5] rounded-[4px] focus:ring-2 focus:ring-[#0A0A0A] cursor-pointer"
                        />
                        <span>
                          I have the right to use this media for marketing.{' '}
                          {!hasConsent && (
                            <span className="text-[#B91C1C] font-medium block text-[12px] mt-0.5">
                              Cannot be approved for AI or ads without consent.
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Action Bar (Set Cover, Reorder, Delete) */}
                  {!readOnly && (
                    <div className="pt-2.5 border-t border-[#E5E5E5] flex items-center justify-between text-[12px]">
                      {/* Set Cover Button */}
                      {asset.type === 'IMAGE' && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(asset)}
                          className={`flex items-center gap-1.5 font-medium text-[12px] transition-colors cursor-pointer ${
                            isCover ? 'text-[#0A0A0A] font-semibold' : 'text-[#737373] hover:text-[#0A0A0A]'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isCover ? 'fill-[#0A0A0A] text-[#0A0A0A]' : 'text-[#737373]'}`} />
                          <span>{isCover ? 'Cover photo' : 'Set as cover'}</span>
                        </button>
                      )}

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveMedia(index, 'UP')}
                          className="p-1.5 text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-[6px] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === filteredMedia.length - 1}
                          onClick={() => handleMoveMedia(index, 'DOWN')}
                          className="p-1.5 text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] rounded-[6px] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset)}
                          className="p-1.5 text-[#737373] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-[6px] transition-colors ml-1"
                          title="Delete asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {viewingAsset && (
        <Modal open={Boolean(viewingAsset)} onOpenChange={(open) => !open && setViewingAsset(null)}>
          <ModalContent className="max-w-4xl p-0 overflow-hidden bg-white border border-[#E5E5E5] rounded-[10px] shadow-dialog">
            <ModalHeader className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
              <div>
                <ModalTitle className="text-[16px] font-semibold text-[#0A0A0A]">
                  {viewingAsset.fileName}
                </ModalTitle>
                <ModalDescription className="text-[13px] text-[#737373]">
                  {viewingAsset.category} • {viewingAsset.aspectRatio} • {viewingAsset.actualOrIllustrative}
                </ModalDescription>
              </div>
            </ModalHeader>

            <div className="p-4 max-h-[75vh] flex items-center justify-center bg-[#0A0A0A] overflow-auto">
              {viewingAsset.type === 'VIDEO' ? (
                <video
                  src={viewingAsset.fileUrl || viewingAsset.url}
                  poster={viewingAsset.thumbnailUrl}
                  controls
                  autoPlay
                  className="max-h-[70vh] max-w-full rounded-[6px]"
                />
              ) : viewingAsset.type === 'DOCUMENT' ? (
                <div className="text-center p-8 text-white space-y-4">
                  <FileText className="w-16 h-16 mx-auto text-[#737373]" />
                  <p className="text-[14px] font-medium">{viewingAsset.fileName}</p>
                  <a
                    href={viewingAsset.fileUrl || viewingAsset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0A0A0A] font-medium text-[13px] rounded-[8px] hover:bg-[#F5F5F5] transition-colors"
                  >
                    Open PDF in new window
                  </a>
                </div>
              ) : (
                <img
                  src={viewingAsset.fileUrl || viewingAsset.url}
                  alt={viewingAsset.fileName}
                  className="max-h-[70vh] max-w-full object-contain rounded-[6px]"
                />
              )}
            </div>

            <ModalFooter className="p-3.5 border-t border-[#E5E5E5] bg-[#FAFAFA] flex justify-between items-center">
              <span className="text-[13px] text-[#525252]">
                {viewingAsset.rightsConsent?.confirmed
                  ? '✓ Verified rights consent'
                  : '⚠ Missing rights consent'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingAsset(null)}
              >
                Close preview
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* 409 Soft-Check Conflict Dialog */}
      {conflictModalAsset && (
        <Modal
          open={Boolean(conflictModalAsset)}
          onOpenChange={(open) => !open && setConflictModalAsset(null)}
        >
          <ModalContent className="max-w-md border border-[#E5E5E5] rounded-[10px] shadow-dialog">
            <ModalHeader>
              <div className="w-10 h-10 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
              </div>
              <ModalTitle className="text-[16px] font-semibold text-[#0A0A0A]">
                Asset is currently in use
              </ModalTitle>
              <ModalDescription className="text-[13px] text-[#525252]">
                This media file is actively attached to promotional creatives or ad campaigns.
                Deleting it could cause broken image references.
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-3 py-2 text-[13px]">
              {conflictModalAsset.inUse.creatives && conflictModalAsset.inUse.creatives.length > 0 && (
                <div>
                  <p className="font-semibold text-[#0A0A0A] mb-1">Referencing creatives:</p>
                  <ul className="list-disc pl-5 text-[#525252] space-y-0.5">
                    {conflictModalAsset.inUse.creatives.map((c) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {conflictModalAsset.inUse.campaigns && conflictModalAsset.inUse.campaigns.length > 0 && (
                <div>
                  <p className="font-semibold text-[#0A0A0A] mb-1">Referencing campaigns:</p>
                  <ul className="list-disc pl-5 text-[#525252] space-y-0.5">
                    {conflictModalAsset.inUse.campaigns.map((c) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <ModalFooter className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConflictModalAsset(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteAsset(conflictModalAsset.asset, true)}
              >
                Force delete and unlink
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
