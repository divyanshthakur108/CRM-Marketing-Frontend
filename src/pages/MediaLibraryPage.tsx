import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { StatusBadge } from '../components/ui/StatusBadge';
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
  Search,
  Copy,
  Check,
  Building2,
  Video,
  Layers,
  RotateCcw,
} from 'lucide-react';

export function MediaLibraryPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter States
  const initialProject = searchParams.get('projectId') || 'ALL';
  const [projectFilter, setProjectFilter] = useState(initialProject);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [ratioFilter, setRatioFilter] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // React Query Hooks
  const {
    data: assets = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMedia({
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

  // Delete Confirmation Modal State
  const [assetToDelete, setAssetToDelete] = useState<{ id: string; fileName: string } | null>(null);

  // Generate object preview URL for selected file
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

  // Project ID to Name lookup map
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => {
      if (p.id) map.set(p.id, p.name);
      if (p._id) map.set(p._id, p.name);
    });
    return map;
  }, [projects]);

  // Filtered Assets with Client-Side Search
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchProject = projectFilter === 'ALL' || asset.projectId === projectFilter;
      const matchCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
      const matchRatio = ratioFilter === 'ALL' || asset.aspectRatio === ratioFilter;
      const matchApproval = approvalFilter === 'ALL' || asset.approvalStatus === approvalFilter;

      let matchSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fname = (asset.fileName || '').toLowerCase();
        const room = (asset.roomCategory || '').toLowerCase();
        const proj = (projectMap.get(asset.projectId || '') || '').toLowerCase();
        matchSearch = fname.includes(q) || room.includes(q) || proj.includes(q);
      }

      return matchProject && matchCategory && matchRatio && matchApproval && matchSearch;
    });
  }, [assets, projectFilter, categoryFilter, ratioFilter, approvalFilter, searchQuery, projectMap]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = assets.length;
    const approved = assets.filter((a) => a.approvalStatus === 'APPROVED' || a.isApproved).length;
    const videos = assets.filter((a) => a.type === 'VIDEO' || a.mimetype?.includes('video')).length;
    const projectIds = new Set(assets.map((a) => a.projectId).filter(Boolean));
    return {
      total,
      approved,
      videos,
      projectsCount: projectIds.size,
    };
  }, [assets]);

  const hasActiveFilters =
    projectFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    ratioFilter !== 'ALL' ||
    approvalFilter !== 'ALL' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setProjectFilter('ALL');
    setCategoryFilter('ALL');
    setRatioFilter('ALL');
    setApprovalFilter('ALL');
    setSearchQuery('');
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
        message: `File "${file.name}" has an unsupported format. Supported formats: JPEG, PNG, WebP, GIF, SVG, AVIF, MP4, WebM, PDF.`,
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
      toast({
        title: 'Validation Error',
        message: 'Please select an image, video, or PDF file to upload.',
        type: 'error',
      });
      return;
    }
    if (!rightsConsent) {
      toast({
        title: 'Consent Required',
        message: 'You must confirm commercial marketing authorization for this property visual asset.',
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
        title: 'Asset Ingested',
        message: `${selectedFile.name} successfully stored and verified.`,
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

  const handleRequestDelete = (assetId?: string, filename?: string) => {
    if (!assetId) return;
    setAssetToDelete({ id: assetId, fileName: filename || 'this asset' });
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      await deleteMutation.mutateAsync(assetToDelete.id);
      toast({
        title: 'Asset Deleted',
        message: `"${assetToDelete.fileName}" permanently removed from vault.`,
        type: 'info',
      });
      setAssetToDelete(null);
    } catch (err: unknown) {
      toast({
        title: 'Delete Failed',
        message: err instanceof Error ? err.message : 'Could not delete asset',
        type: 'error',
      });
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

  const handleCopyUrl = (url?: string, assetId?: string) => {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(assetId || null);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'URL Copied',
      message: 'Asset link copied to clipboard.',
      type: 'info',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <Link to="/dashboard" className="hover:text-[#10B981] transition-colors">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span>Library</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#1F2937]">Media Assets</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Media Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20">
              {filteredAssets.length} Assets
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Centralized digital asset management: Rights-consented photography, floor plans, and catalog renders across real estate projects.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Refresh assets from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Strip Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Total Assets
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-[#1F2937] flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#10B981]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1F2937] tabular-nums mt-1">
            {metrics.total}
          </div>
          <span className="text-[11px] text-[#64748B]">In tenant vault</span>
        </div>

        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Approved for Ads
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#10B981] tabular-nums mt-1">
            {metrics.approved}
          </div>
          <span className="text-[11px] text-[#64748B]">Rights verified</span>
        </div>

        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Video &amp; Motion
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#EDE9FE] text-[#8B5CF6] flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1F2937] tabular-nums mt-1">
            {metrics.videos}
          </div>
          <span className="text-[11px] text-[#64748B]">Reels &amp; clips</span>
        </div>

        <div className="rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Projects Active
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1F2937] tabular-nums mt-1">
            {metrics.projectsCount}
          </div>
          <span className="text-[11px] text-[#64748B]">Catalogs covered</span>
        </div>
      </div>

      {/* 3. Error Banner */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-rose-900 text-sm">Failed to Retrieve Media Assets</p>
              <p className="text-rose-800/90 text-xs mt-0.5">
                {error instanceof Error ? error.message : 'Could not load tenant media assets from cloud storage.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Search & Multi-Filter Toolbar */}
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets by filename, room, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 text-xs pl-10 pr-9 rounded-xl border border-[#EDF0F2] bg-slate-50/50 text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10B981] focus:border-[#10B981] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2937] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors self-start md:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#EDF0F2]">
          {/* Project Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Project
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="EXTERIOR">Exterior Architecture</option>
              <option value="INTERIOR">Interior Spaces</option>
              <option value="ROOMS">Rooms &amp; Suites</option>
              <option value="FLOOR_PLANS">Floor Plans &amp; Blueprints</option>
              <option value="AMENITIES">Clubhouse &amp; Amenities</option>
              <option value="BROCHURE">Brochures (PDF)</option>
              <option value="VIDEOS">Motion &amp; Video</option>
              <option value="LOGO">Brand Logos</option>
            </select>
          </div>

          {/* Aspect Ratio Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Aspect Ratio
            </label>
            <select
              value={ratioFilter}
              onChange={(e) => setRatioFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
            >
              <option value="ALL">All Formats</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="4:5">4:5 Feed Portrait</option>
              <option value="1:1">1:1 Square</option>
              <option value="9:16">9:16 Reel Vertical</option>
              <option value="OTHER">Other / Original</option>
            </select>
          </div>

          {/* Approval Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Ad Approval
            </label>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
            >
              <option value="ALL">All Approvals</option>
              <option value="APPROVED">Approved for Ads</option>
              <option value="PENDING">Pending Review</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Main Asset Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-[#EDF0F2] bg-white p-3 space-y-3 animate-pulse shadow-xs"
            >
              <div className="aspect-[4/3] bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-10 h-10 text-slate-400" />}
          title="No Media Assets Found"
          description={
            assets.length === 0
              ? 'Your organization has not ingested visual assets yet. Click "Upload Media" to add photography, blueprints, or renders.'
              : 'No photography or assets match your selected filter criteria. Try resetting filters or choosing a different project.'
          }
          actionLabel={assets.length === 0 ? 'Upload First Asset' : 'Reset Filters'}
          onAction={assets.length === 0 ? () => setIsUploadOpen(true) : handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredAssets.map((asset) => {
            const projectName = projectMap.get(asset.projectId || '') || 'General Asset';
            const isVideo = asset.type === 'VIDEO' || asset.mimetype?.includes('video');
            const isPdf = asset.mimetype?.includes('pdf') || asset.type === 'DOCUMENT';
            const isFloorPlan = asset.category === 'FLOOR_PLANS' || asset.roomCategory === 'Floor Plan';

            return (
              <div
                key={asset.id}
                className="rounded-2xl border border-[#EDF0F2] bg-white overflow-hidden shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                {/* Media Thumbnail Container */}
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative border-b border-[#EDF0F2]">
                  {isPdf ? (
                    <div
                      onClick={() => setViewingAsset(asset)}
                      className="w-full h-full flex flex-col items-center justify-center p-4 text-[#64748B] bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <FileText className="w-9 h-9 text-rose-500 mb-1" />
                      <span className="text-sm font-bold text-[#1F2937]">PDF Document</span>
                      <span className="text-[11px] text-center mt-1 truncate max-w-full text-slate-400">
                        {asset.fileName}
                      </span>
                    </div>
                  ) : isVideo ? (
                    <div
                      className="w-full h-full relative cursor-pointer group"
                      onClick={() => setViewingAsset(asset)}
                    >
                      <video
                        src={asset.url}
                        className="w-full h-full object-cover"
                        controls={false}
                        muted
                      />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-white/90 text-[#1F2937] flex items-center justify-center shadow-md">
                          <Video className="w-5 h-5 text-[#10B981]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full h-full relative cursor-pointer"
                      onClick={() => setViewingAsset(asset)}
                    >
                      <img
                        src={asset.url}
                        alt={asset.fileName}
                        className={`w-full h-full transition-transform duration-300 ${
                          isFloorPlan
                            ? 'object-contain p-2 bg-slate-50'
                            : 'object-cover group-hover:scale-105'
                        }`}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.asset-fallback');
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                      <div className="asset-fallback hidden w-full h-full flex flex-col items-center justify-center p-3 text-slate-400 bg-slate-50 text-center">
                        <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                        <span className="text-xs truncate max-w-full font-medium text-[#1F2937]">
                          {asset.fileName}
                        </span>
                        <span className="text-[10px] text-slate-400">Preview Unavailable</span>
                      </div>
                    </div>
                  )}

                  {/* Top Left: Aspect Ratio Pill */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                    <span className="bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {asset.aspectRatio || '16:9'}
                    </span>
                    {asset.isCover && (
                      <span className="bg-[#10B981] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Cover
                      </span>
                    )}
                  </div>

                  {/* Top Right: Status Badge */}
                  <div className="absolute top-2.5 right-2.5 pointer-events-none">
                    <StatusBadge status={asset.approvalStatus || 'PENDING'} />
                  </div>
                </div>

                {/* Asset Metadata & Actions */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="font-bold text-xs truncate text-[#1F2937]"
                        title={asset.fileName}
                      >
                        {asset.fileName}
                      </p>
                    </div>

                    <p className="text-[11px] text-[#64748B] flex items-center gap-1.5 truncate">
                      <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate">{projectName}</span>
                    </p>

                    <p className="text-[11px] text-slate-400 tabular-nums">
                      {asset.roomCategory || 'Exterior'} &bull;{' '}
                      {formatFileSize((asset.fileSizeKb || 0) * 1024)}
                    </p>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="pt-2.5 border-t border-[#EDF0F2] flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#64748B]">
                      {/* Toggle Approval Button */}
                      <button
                        type="button"
                        onClick={() => toggleApproval(asset)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={
                          asset.approvalStatus === 'APPROVED'
                            ? 'Mark as Rejected'
                            : 'Mark as Approved'
                        }
                      >
                        {asset.approvalStatus === 'APPROVED' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {/* Full Preview Button */}
                      <button
                        type="button"
                        onClick={() => setViewingAsset(asset)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg hover:text-[#1F2937] transition-colors cursor-pointer"
                        title="View Full Resolution Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Copy URL */}
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(asset.url, asset.id)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg hover:text-[#1F2937] transition-colors cursor-pointer"
                        title="Copy Asset URL"
                      >
                        {copiedId === asset.id ? (
                          <Check className="w-4 h-4 text-[#10B981]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Download Link */}
                      <a
                        href={asset.url}
                        download={asset.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-slate-100 rounded-lg hover:text-[#1F2937] transition-colors cursor-pointer"
                        title="Download Original Asset"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Tags / Metadata Modal */}
                      <button
                        type="button"
                        onClick={() => handleOpenTagModal(asset)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EDF0F2] bg-slate-50 text-[11px] font-semibold text-[#1F2937] hover:bg-slate-100 transition-all cursor-pointer"
                        title="Edit space tags and approval status"
                      >
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>Tags</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRequestDelete(asset.id, asset.fileName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete asset from vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. UPLOAD MEDIA MODAL */}
      <Modal open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <ModalContent className="max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <ModalHeader>
            <ModalTitle className="text-lg font-bold text-[#1F2937]">
              Upload Media Asset
            </ModalTitle>
            <ModalDescription className="text-xs text-[#64748B]">
              Ingest high-resolution real estate photography, video tours, or PDF floor plans into your tenant asset vault.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-2">
            {/* File Selection Dropzone or Selected File Card */}
            {selectedFile ? (
              <div className="border border-[#EDF0F2] p-4 bg-slate-50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E8F7F1] text-[#10B981]">
                      Ready for Ingestion
                    </span>
                    <span className="text-xs text-[#64748B] tabular-nums font-semibold">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedFile}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="Remove File"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {previewUrl ? (
                  <div className="aspect-video w-full max-h-48 overflow-hidden rounded-xl border border-[#EDF0F2] bg-white flex items-center justify-center">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-[#EDF0F2] rounded-xl flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-[#10B981] shrink-0" />
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold truncate text-[#1F2937]">{selectedFile.name}</p>
                      <p className="text-[11px] text-[#64748B]">{selectedFile.type || 'Document File'}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="font-semibold truncate text-[#1F2937] max-w-[280px]" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="underline text-[#10B981] hover:text-[#059669] font-semibold cursor-pointer"
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
                className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#10B981] bg-emerald-50/50'
                    : 'border-[#EDF0F2] bg-slate-50/50 hover:border-[#10B981] hover:bg-slate-50'
                }`}
              >
                <div className="h-12 w-12 rounded-2xl bg-white text-[#10B981] flex items-center justify-center mx-auto mb-3 shadow-xs border border-slate-100">
                  <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                </div>
                <p className="text-sm font-bold text-[#1F2937]">
                  {isDragging ? 'Drop file here to upload' : 'Click or Drag high-res photography / PDF here'}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  Images (JPEG, PNG, WebP, SVG), Videos (MP4, WebM) or PDF blueprints up to 50MB
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

            {/* Project & Room Assignment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Assign Project
                </label>
                <select
                  value={uploadProject}
                  onChange={(e) => setUploadProject(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
                >
                  <option value="">General (No Project)</option>
                  {projects.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Room / Space Tag *
                </label>
                <select
                  value={uploadRoom}
                  onChange={(e) => setUploadRoom(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
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

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Aspect Classification
              </label>
              <select
                value={uploadRatio}
                onChange={(e) => setUploadRatio(e.target.value as MediaAspectRatio)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
              >
                <option value="16:9">16:9 Landscape</option>
                <option value="4:5">4:5 Feed Portrait</option>
                <option value="1:1">1:1 Square</option>
                <option value="9:16">9:16 Reel Vertical</option>
                <option value="OTHER">Other / Original</option>
              </select>
            </div>

            {/* Rights-Consent Checkbox */}
            <div className="border border-[#EDF0F2] p-3.5 rounded-2xl bg-slate-50 flex items-start gap-3">
              <input
                type="checkbox"
                id="rightsConsent"
                checked={rightsConsent}
                onChange={(e) => setRightsConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-[#EDF0F2] text-[#10B981] focus:ring-[#10B981] cursor-pointer"
              />
              <label
                htmlFor="rightsConsent"
                className="text-xs font-medium text-[#1F2937] select-none cursor-pointer leading-relaxed"
              >
                I confirm this organization holds commercial marketing rights, copyright permissions, and advertising release authorizations for this property visual asset.
              </label>
            </div>
          </div>

          <ModalFooter className="border-t border-[#EDF0F2] pt-4">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!rightsConsent || !selectedFile || uploadMutation.isPending}
              onClick={handleUploadSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${uploadMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{uploadMutation.isPending ? 'Uploading...' : 'Upload Asset'}</span>
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 7. TAG / METADATA EDIT MODAL */}
      <Modal open={Boolean(editingAsset)} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <ModalContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <ModalHeader>
            <ModalTitle className="text-lg font-bold text-[#1F2937]">
              Edit Asset Metadata Tags
            </ModalTitle>
            <ModalDescription className="text-xs text-[#64748B]">
              Assign space categories, room classifications, and marketing approval status.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-2">
            <div className="text-xs bg-slate-50 border border-[#EDF0F2] p-3 rounded-xl text-[#64748B]">
              File: <strong className="text-[#1F2937] font-bold">{editingAsset?.fileName}</strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Room / Space
                </label>
                <select
                  value={tagRoom}
                  onChange={(e) => setTagRoom(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
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
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Approval Status
                </label>
                <select
                  value={tagStatus}
                  onChange={(e) => setTagStatus(e.target.value as MediaApprovalStatus)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
                >
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <ModalFooter className="border-t border-[#EDF0F2] pt-4">
            <button
              type="button"
              onClick={() => setEditingAsset(null)}
              className="px-4 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={patchMutation.isPending}
              onClick={handleSaveTags}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className={`w-3.5 h-3.5 ${patchMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{patchMutation.isPending ? 'Saving...' : 'Save Metadata'}</span>
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 8. FULL ASSET PREVIEW MODAL */}
      <Modal open={Boolean(viewingAsset)} onOpenChange={(open) => !open && setViewingAsset(null)}>
        <ModalContent className="max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
          <ModalHeader>
            <div className="flex items-center justify-between gap-3">
              <ModalTitle className="text-lg font-bold text-[#1F2937] truncate">
                {viewingAsset?.fileName}
              </ModalTitle>
              <span className="text-xs text-[#64748B] tabular-nums shrink-0">
                {viewingAsset && formatFileSize((viewingAsset.fileSizeKb || 0) * 1024)}
              </span>
            </div>
            <ModalDescription className="text-xs text-[#64748B] flex items-center gap-2">
              <span>{viewingAsset?.roomCategory || 'Exterior'}</span>
              <span>&bull;</span>
              <span>Aspect: {viewingAsset?.aspectRatio || '16:9'}</span>
              <span>&bull;</span>
              <span>Status: {viewingAsset?.approvalStatus || 'APPROVED'}</span>
            </ModalDescription>
          </ModalHeader>

          {/* Media Player / Canvas Container */}
          <div className="py-2 flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden max-h-[65vh]">
            {viewingAsset?.mimetype?.includes('pdf') || viewingAsset?.type === 'DOCUMENT' ? (
              <div className="p-12 text-center text-white space-y-3">
                <FileText className="w-16 h-16 mx-auto text-rose-500" />
                <p className="text-sm font-bold">{viewingAsset.fileName}</p>
                <p className="text-xs text-slate-400">PDF Architectural Blueprint Document</p>
              </div>
            ) : viewingAsset?.mimetype?.includes('video') || viewingAsset?.type === 'VIDEO' ? (
              <video
                src={viewingAsset.url}
                controls
                className="max-h-[60vh] w-auto mx-auto"
                autoPlay
              />
            ) : viewingAsset ? (
              <img
                src={viewingAsset.url}
                alt={viewingAsset.fileName}
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
            ) : null}
          </div>

          <ModalFooter className="border-t border-[#EDF0F2] pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
              <span className="text-xs text-[#64748B] tabular-nums">
                Uploaded: {viewingAsset?.uploadedAt ? formatDisplayDate(viewingAsset.uploadedAt) : 'Recent'}
              </span>
              <div className="flex items-center gap-2">
                {viewingAsset && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(viewingAsset.url, viewingAsset.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Link</span>
                    </button>
                    <a
                      href={viewingAsset.url}
                      download={viewingAsset.fileName}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Download</span>
                    </a>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setViewingAsset(null)}
                  className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 9. DELETE ASSET CONFIRMATION MODAL */}
      <Modal open={Boolean(assetToDelete)} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <ModalContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <ModalTitle className="text-base font-bold text-[#1F2937]">
                  Delete Media Asset
                </ModalTitle>
                <ModalDescription className="text-xs text-[#64748B]">
                  Permanent vault removal confirmation
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>

          <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-800 space-y-1.5">
            <p>
              Are you sure you want to permanently delete{' '}
              <strong className="text-rose-950 font-bold break-all">"{assetToDelete?.fileName}"</strong>?
            </p>
            <p className="text-[11px] text-rose-700">
              This action cannot be undone. Any active ad campaigns referencing this storage asset will require updated creative visuals.
            </p>
          </div>

          <ModalFooter className="border-t border-[#EDF0F2] pt-4">
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => setAssetToDelete(null)}
              className="px-4 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={handleConfirmDelete}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className={`w-3.5 h-3.5 ${deleteMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{deleteMutation.isPending ? 'Deleting...' : 'Permanently Delete'}</span>
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
