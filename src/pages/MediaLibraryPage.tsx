import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  useMedia,
  useUploadMedia,
  usePatchMedia,
  useDeleteMedia,
  BackendMediaAsset,
  MediaAspectRatio,
  MediaApprovalStatus,
} from '../hooks/useMedia';
import { useProjects } from '../hooks/useProjects';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { formatFileSize, formatDisplayDate } from '../lib/formatters';
import {
  UploadCloud,
  Image as ImageIcon,
  AlertCircle,
  Tag,
  RefreshCw,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  FileText,
} from 'lucide-react';

export function MediaLibraryPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialProject = searchParams.get('projectId') || 'ALL';
  const [projectFilter, setProjectFilter] = useState(initialProject);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [ratioFilter, setRatioFilter] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL');

  // React Query Hooks
  const { data: assets = [], isLoading, isError, error, refetch, isFetching } = useMedia({
    projectId: projectFilter,
    category: categoryFilter,
    aspectRatio: ratioFilter,
    approvalStatus: approvalFilter,
  });

  const { data: projects = [] } = useProjects();
  const uploadMutation = useUploadMedia();
  const patchMutation = usePatchMedia();
  const deleteMutation = useDeleteMedia();

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProject, setUploadProject] = useState('');
  const [uploadRoom, setUploadRoom] = useState('Façade');
  const [uploadRatio, setUploadRatio] = useState<MediaAspectRatio>('16:9');
  const [rightsConsent, setRightsConsent] = useState(false);

  // Full Screen Preview Modal State
  const [viewingAsset, setViewingAsset] = useState<BackendMediaAsset | null>(null);

  // Tag Asset Modal State
  const [editingAsset, setEditingAsset] = useState<BackendMediaAsset | null>(null);
  const [tagRoom, setTagRoom] = useState('Living Room');
  const [tagStatus, setTagStatus] = useState<MediaApprovalStatus>('APPROVED');

  // Generate object preview URL for selected image file
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchProject = projectFilter === 'ALL' || asset.projectId === projectFilter;
      const matchCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
      const matchRatio = ratioFilter === 'ALL' || asset.aspectRatio === ratioFilter;
      const matchApproval = approvalFilter === 'ALL' || asset.approvalStatus === approvalFilter;
      return matchProject && matchCategory && matchRatio && matchApproval;
    });
  }, [assets, projectFilter, categoryFilter, ratioFilter, approvalFilter]);

  const handleResetFilters = () => {
    setProjectFilter('ALL');
    setCategoryFilter('ALL');
    setRatioFilter('ALL');
    setApprovalFilter('ALL');
  };

  const processSelectedFile = (file: File) => {
    const validMimes = new Set([
      'image/jpeg',
      'image/jpg',
      'image/pjpeg',
      'image/png',
      'image/x-png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/avif',
      'image/bmp',
      'image/tiff',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/pdf',
    ]);
    const validExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'bmp', 'tiff', 'mp4', 'webm', 'mov', 'pdf'];

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const isMimeOk =
      validMimes.has(file.type.toLowerCase()) ||
      file.type.startsWith('image/') ||
      file.type.startsWith('video/') ||
      file.type === 'application/pdf';
    const isExtOk = validExts.includes(fileExt);

    if (!isMimeOk && !isExtOk) {
      toast({
        title: 'Unsupported File Format',
        message: `File "${file.name}" has an unsupported format. Supported: JPEG, PNG, WebP, GIF, SVG, AVIF, MP4, WebM, PDF.`,
        type: 'error',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        message: `Selected file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed is 50MB.`,
        type: 'error',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast({ title: 'Validation Error', message: 'Please select an image or media file to upload', type: 'error' });
      return;
    }
    if (!rightsConsent) {
      toast({
        title: 'Consent Required',
        message: 'You must confirm commercial marketing authorization for this property visual asset',
        type: 'error',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (uploadProject && uploadProject !== 'ALL') {
      formData.append('projectId', uploadProject);
    }
    formData.append('roomType', uploadRoom);
    formData.append('aspectRatio', uploadRatio);
    formData.append('approvalStatus', 'APPROVED');

    try {
      await uploadMutation.mutateAsync(formData);
      toast({
        title: 'Media Asset Ingested',
        message: `${selectedFile.name} successfully stored and verified`,
        type: 'success',
      });
      setIsUploadOpen(false);
      handleClearSelectedFile();
      setRightsConsent(false);
    } catch (err: unknown) {
      let errorMessage = 'Could not upload media asset';
      if (axios.isAxiosError(err)) {
        errorMessage =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast({
        title: 'Upload Failed',
        message: errorMessage,
        type: 'error',
      });
    }
  };

  const handleOpenTagModal = (asset: BackendMediaAsset) => {
    setEditingAsset(asset);
    setTagRoom(asset.roomCategory || 'Living Room');
    setTagStatus(asset.approvalStatus || 'APPROVED');
  };

  const handleSaveTags = async () => {
    if (!editingAsset) return;

    try {
      await patchMutation.mutateAsync({
        id: editingAsset.id!,
        data: {
          roomType: tagRoom,
          approvalStatus: tagStatus,
          isApproved: tagStatus === 'APPROVED',
        },
      });

      toast({
        title: 'Metadata Updated',
        message: `Tags saved for ${editingAsset.fileName}`,
        type: 'success',
      });
      setEditingAsset(null);
    } catch (err: unknown) {
      toast({
        title: 'Update Failed',
        message: err instanceof Error ? err.message : 'Could not update metadata',
        type: 'error',
      });
    }
  };

  const handleDelete = async (assetId?: string, filename?: string) => {
    if (!assetId) return;
    if (confirm(`Are you sure you want to delete ${filename || 'this asset'}?`)) {
      try {
        await deleteMutation.mutateAsync(assetId);
        toast({ title: 'Asset Deleted', message: 'Media permanently removed from vault', type: 'info' });
      } catch (err: unknown) {
        toast({
          title: 'Delete Failed',
          message: err instanceof Error ? err.message : 'Could not delete asset',
          type: 'error',
        });
      }
    }
  };

  const toggleApproval = async (asset: BackendMediaAsset) => {
    const nextStatus = asset.approvalStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED';
    try {
      await patchMutation.mutateAsync({
        id: asset.id!,
        data: {
          approvalStatus: nextStatus,
          isApproved: nextStatus === 'APPROVED',
        },
      });
      toast({
        title: 'Approval Status Changed',
        message: `${asset.fileName} is now ${nextStatus}`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Status Update Failed',
        message: err instanceof Error ? err.message : 'Could not toggle approval status',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Media Library"
        description="Tenant asset vault with rights-consented photography, floor plans, and catalog renders."
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
            >
              Upload Media
            </Button>
          </div>
        }
      />

      {/* Error Banner */}
      {isError && (
        <div className="border border-border p-4 bg-status-danger-bg rounded-card flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-text-primary">
                Failed to Retrieve Media Assets
              </h4>
              <p className="text-meta text-status-danger mt-0.5">
                {error instanceof Error ? error.message : 'Could not load tenant media assets.'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="p-4 bg-surface">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Project Filter */}
          <div>
            <label className="block text-meta font-medium text-text-secondary mb-1">
              Filter by Project
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 font-normal"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-meta font-medium text-text-secondary mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 font-normal"
            >
              <option value="ALL">All Categories</option>
              <option value="EXTERIOR">Exterior</option>
              <option value="INTERIOR">Interior</option>
              <option value="ROOMS">Rooms</option>
              <option value="FLOOR_PLANS">Floor Plans</option>
              <option value="AMENITIES">Amenities</option>
              <option value="BROCHURE">Brochures (PDF)</option>
              <option value="VIDEOS">Videos</option>
              <option value="LOGO">Logo</option>
            </select>
          </div>

          {/* Ratio Filter */}
          <div>
            <label className="block text-meta font-medium text-text-secondary mb-1">
              Aspect Ratio
            </label>
            <select
              value={ratioFilter}
              onChange={(e) => setRatioFilter(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 font-normal"
            >
              <option value="ALL">All Formats</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="4:5">4:5 Feed Portrait</option>
              <option value="1:1">1:1 Square</option>
              <option value="9:16">9:16 Vertical Reel</option>
              <option value="OTHER">Other / Original</option>
            </select>
          </div>

          {/* Approval Status Filter */}
          <div>
            <label className="block text-meta font-medium text-text-secondary mb-1">
              Approval Status
            </label>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 font-normal"
            >
              <option value="ALL">All Approvals</option>
              <option value="APPROVED">Approved for Ads</option>
              <option value="PENDING">Pending Review</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Asset Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Skeleton className="aspect-square w-full rounded-card" />
          <Skeleton className="aspect-square w-full rounded-card" />
          <Skeleton className="aspect-square w-full rounded-card" />
          <Skeleton className="aspect-square w-full rounded-card" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-10 h-10 text-text-muted" />}
          title="No Media Assets Found"
          description={
            assets.length === 0
              ? 'Your organization has not uploaded visual assets yet. Click "Upload Media" to ingest photography or blueprints.'
              : 'No photography or renders match your selected filter criteria.'
          }
          actionLabel={assets.length === 0 ? 'Upload First Asset' : 'Reset Filters'}
          onAction={assets.length === 0 ? () => setIsUploadOpen(true) : handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className="p-0 overflow-hidden hover:border-neutral-300 transition-all flex flex-col justify-between group"
            >
              {/* Media Thumbnail Container */}
              <div className="aspect-[4/3] bg-neutral-100 overflow-hidden relative border-b border-border">
                {asset.mimetype?.includes('pdf') ? (
                  <div
                    onClick={() => setViewingAsset(asset)}
                    className="w-full h-full flex flex-col items-center justify-center p-4 text-text-secondary bg-neutral-100 cursor-pointer hover:bg-neutral-200 transition-colors"
                  >
                    <FileText className="w-8 h-8 text-text-muted mb-1" />
                    <span className="text-xl font-semibold text-text-primary">PDF</span>
                    <span className="text-meta text-center mt-1 truncate max-w-full">{asset.fileName}</span>
                  </div>
                ) : asset.mimetype?.includes('video') ? (
                  <div className="w-full h-full relative cursor-pointer" onClick={() => setViewingAsset(asset)}>
                    <video
                      src={asset.url}
                      className="w-full h-full object-cover"
                      controls={false}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full relative cursor-pointer" onClick={() => setViewingAsset(asset)}>
                    <img
                      src={asset.url}
                      alt={asset.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.asset-fallback');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                    <div className="asset-fallback hidden w-full h-full flex flex-col items-center justify-center p-3 text-text-muted bg-neutral-100 text-center">
                      <ImageIcon className="w-8 h-8 mb-1 text-text-muted" />
                      <span className="text-meta truncate max-w-full font-medium">{asset.fileName}</span>
                      <span className="text-[11px] text-text-muted">Preview Unavailable</span>
                    </div>
                  </div>
                )}

                {/* Aspect Ratio Badge Top Left */}
                <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
                  <span className="bg-primary text-white text-[11px] font-medium px-1.5 py-0.5 rounded-[4px]">
                    {asset.aspectRatio}
                  </span>
                </div>

                {/* Approval Badge Top Right */}
                <div className="absolute top-2 right-2 pointer-events-none">
                  <StatusBadge status={asset.approvalStatus || 'pending'} />
                </div>
              </div>

              {/* Asset Meta Info */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-medium text-sm truncate text-text-primary" title={asset.fileName}>
                    {asset.fileName}
                  </p>
                  <p className="text-meta text-text-muted mt-0.5 tabular-nums">
                    {asset.roomCategory} &bull; {formatFileSize((asset.fileSizeKb || 0) * 1024)}
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => toggleApproval(asset)}
                      className="p-1 hover:bg-neutral-100 rounded-[6px] text-text-secondary hover:text-text-primary transition-colors"
                      title={asset.approvalStatus === 'APPROVED' ? 'Mark as Rejected' : 'Mark as Approved'}
                    >
                      {asset.approvalStatus === 'APPROVED' ? (
                        <CheckCircle2 className="w-4 h-4 text-status-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-text-muted" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingAsset(asset)}
                      className="p-1 hover:bg-neutral-100 rounded-[6px] text-text-secondary hover:text-text-primary transition-colors"
                      title="View Full Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={asset.url}
                      download={asset.fileName}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:bg-neutral-100 rounded-[6px] text-text-secondary hover:text-text-primary transition-colors"
                      title="Download Original"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-meta"
                      onClick={() => handleOpenTagModal(asset)}
                      leftIcon={<Tag className="w-3.5 h-3.5" />}
                    >
                      Tags
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-text-muted hover:text-status-danger p-1"
                      onClick={() => handleDelete(asset.id, asset.fileName)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* REAL UPLOAD MODAL */}
      <Modal open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <ModalTitle>Upload Real Media Asset</ModalTitle>
            <ModalDescription>
              Authenticated tenant storage with safe verified ingestion and multi-ratio tagging.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-2">
            {/* Real File Input Drag & Drop Zone or Selected File Preview */}
            {selectedFile ? (
              <div className="border border-border p-4 bg-surface-hover rounded-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-meta font-medium px-2 py-0.5 rounded-[4px] bg-neutral-200 text-text-primary">
                      Selected File
                    </span>
                    <span className="text-meta text-text-muted tabular-nums">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedFile}
                    className="text-text-muted hover:text-status-danger p-1"
                    title="Remove File"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {previewUrl ? (
                  <div className="aspect-video w-full max-h-48 overflow-hidden rounded-[8px] border border-border bg-white flex items-center justify-center">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-border rounded-[8px] flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-text-muted shrink-0" />
                    <div className="truncate flex-1">
                      <p className="text-sm font-medium truncate text-text-primary">{selectedFile.name}</p>
                      <p className="text-meta text-text-muted">{selectedFile.type || 'Document'}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium truncate text-text-primary max-w-[280px]" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-meta underline text-text-secondary hover:text-text-primary font-medium"
                  >
                    Change File
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed rounded-card p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-neutral-100'
                    : 'border-border bg-surface-hover hover:border-neutral-400'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                <p className="text-sm font-semibold text-text-primary">
                  {isDragging ? 'Drop file here to upload' : 'Click or Drag high-res photography / PDF here'}
                </p>
                <p className="text-meta text-text-secondary mt-1">
                  Images (JPEG, PNG, WebP, GIF, SVG, AVIF), Videos (MP4, WebM) or PDFs up to 50MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-meta font-medium text-text-secondary mb-1">
                  Assign Project
                </label>
                <select
                  value={uploadProject}
                  onChange={(e) => setUploadProject(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 font-normal"
                >
                  <option value="">General (No Project)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-meta font-medium text-text-secondary mb-1">
                  Room / Space Tag *
                </label>
                <select
                  value={uploadRoom}
                  onChange={(e) => setUploadRoom(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 font-normal"
                >
                  <option value="Façade">Façade / Exterior</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Master Bed">Master Bed</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Balcony">Balcony</option>
                  <option value="Amenities">Amenities</option>
                  <option value="Floor Plan">Floor Plan / Blueprint</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-meta font-medium text-text-secondary mb-1">
                  Aspect Classification
                </label>
                <select
                  value={uploadRatio}
                  onChange={(e) => setUploadRatio(e.target.value as MediaAspectRatio)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 font-normal"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="4:5">4:5 Feed Portrait</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="9:16">9:16 Reel Vertical</option>
                  <option value="OTHER">Other / Original</option>
                </select>
              </div>
            </div>

            {/* MANDATORY RIGHTS-CONSENT CHECKBOX */}
            <div className="border border-border p-3 rounded-card bg-surface-hover flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="rightsConsent"
                checked={rightsConsent}
                onChange={(e) => setRightsConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded-[4px] border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-1"
              />
              <label htmlFor="rightsConsent" className="text-meta font-medium text-text-primary select-none cursor-pointer">
                I confirm this organization holds commercial marketing rights and release authorizations for this property visual asset.
              </label>
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" size="md" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!rightsConsent || !selectedFile}
              isLoading={uploadMutation.isPending}
              onClick={handleUploadSubmit}
            >
              Upload Asset
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* TAG FORM MODAL */}
      <Modal open={Boolean(editingAsset)} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit Asset Metadata Tags</ModalTitle>
            <ModalDescription>
              Assign space categories and marketing approval status.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-2">
            <div className="text-meta bg-surface-hover border border-border p-2.5 rounded-[8px] text-text-secondary">
              File: <strong className="text-text-primary">{editingAsset?.fileName}</strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-meta font-medium text-text-secondary mb-1">
                  Room / Space
                </label>
                <select
                  value={tagRoom}
                  onChange={(e) => setTagRoom(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 font-normal"
                >
                  <option value="Façade">Façade / Exterior</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Master Bed">Master Bed</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Balcony">Balcony</option>
                  <option value="Amenities">Amenities</option>
                  <option value="Floor Plan">Floor Plan</option>
                </select>
              </div>

              <div>
                <label className="block text-meta font-medium text-text-secondary mb-1">
                  Approval Status
                </label>
                <select
                  value={tagStatus}
                  onChange={(e) => setTagStatus(e.target.value as MediaApprovalStatus)}
                  className="w-full h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 font-normal"
                >
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" size="md" onClick={() => setEditingAsset(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={patchMutation.isPending}
              onClick={handleSaveTags}
            >
              Save Metadata
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* FULL ASSET VIEW MODAL */}
      <Modal open={Boolean(viewingAsset)} onOpenChange={(open) => !open && setViewingAsset(null)}>
        <ModalContent className="max-w-3xl">
          <ModalHeader>
            <ModalTitle className="truncate">{viewingAsset?.fileName}</ModalTitle>
            <ModalDescription>
              {viewingAsset?.roomCategory} &bull; {viewingAsset && formatFileSize((viewingAsset.fileSizeKb || 0) * 1024)} &bull; Aspect: {viewingAsset?.aspectRatio} &bull; Status: {viewingAsset?.approvalStatus}
            </ModalDescription>
          </ModalHeader>

          <div className="py-2 flex items-center justify-center bg-black rounded-[8px] overflow-hidden max-h-[70vh]">
            {viewingAsset?.mimetype?.includes('pdf') ? (
              <div className="p-12 text-center text-white">
                <FileText className="w-16 h-16 mx-auto mb-3 text-neutral-400" />
                <p className="text-sm font-semibold">{viewingAsset.fileName}</p>
                <p className="text-meta text-neutral-400 mt-1">PDF Architectural Document</p>
              </div>
            ) : viewingAsset?.mimetype?.includes('video') ? (
              <video src={viewingAsset.url} controls className="max-h-[65vh] w-auto mx-auto" autoPlay />
            ) : viewingAsset ? (
              <img
                src={viewingAsset.url}
                alt={viewingAsset.fileName}
                className="max-h-[65vh] w-auto object-contain mx-auto"
              />
            ) : null}
          </div>

          <ModalFooter>
            <div className="flex items-center justify-between w-full">
              <span className="text-meta text-text-muted tabular-nums">
                Uploaded: {viewingAsset?.uploadedAt ? formatDisplayDate(viewingAsset.uploadedAt) : 'Recent'}
              </span>
              <div className="flex items-center space-x-2">
                {viewingAsset && (
                  <a
                    href={viewingAsset.url}
                    download={viewingAsset.fileName}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                      Download Original
                    </Button>
                  </a>
                )}
                <Button variant="primary" size="sm" onClick={() => setViewingAsset(null)}>
                  Close
                </Button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
