import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type MediaAspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | 'OTHER';
export type MediaApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';
export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';
export type MediaCategory =
  | 'EXTERIOR'
  | 'INTERIOR'
  | 'ROOMS'
  | 'FLOOR_PLANS'
  | 'AMENITIES'
  | 'BROCHURE'
  | 'VIDEOS'
  | 'LOGO'
  | 'OTHER';

export interface BackendMediaAsset {
  _id: string;
  id?: string;
  organizationId: string;
  projectId?: string;
  unitId?: string;
  filename: string;
  storageKey: string;
  url: string;
  mimetype: string;
  sizeBytes: number;
  type?: MediaType;
  category?: MediaCategory;
  room?: string;
  actualOrIllustrative?: 'ACTUAL' | 'ILLUSTRATIVE';
  rightsConsent?: {
    confirmed: boolean;
    by?: string;
    at?: string;
  };
  isCover?: boolean;
  sortOrder?: number;
  thumbnailKey?: string;
  posterKey?: string;
  processingStatus?: 'uploaded' | 'processing' | 'ready' | 'no_poster' | 'failed';
  width?: number;
  height?: number;
  duration?: number;
  aspectRatio: MediaAspectRatio;
  tags: string[];
  roomType?: string;
  isApproved: boolean;
  approvalStatus: MediaApprovalStatus;
  createdAt: string;
  updatedAt: string;

  // Normalized frontend convenience accessors
  fileName?: string;
  fileSizeKb?: number;
  roomCategory?: string;
  uploadedAt?: string;
  isActual?: boolean;
  rightsConsentConfirmed?: boolean;
  fileUrl?: string;
  thumbnailUrl?: string;
}

export const normalizeMediaAsset = (m: BackendMediaAsset): BackendMediaAsset => {
  const mediaId = m._id || m.id || '';
  const fileUrl = `/api/v1/media/${mediaId}/file`;
  const thumbnailUrl = `/api/v1/media/${mediaId}/thumbnail`;

  let resolvedUrl = fileUrl;
  if (m.storageKey) {
    resolvedUrl = `/storage/${m.storageKey}`;
  } else if (m.url && !m.url.startsWith('/storage') && !m.url.startsWith('http')) {
    resolvedUrl = fileUrl;
  }

  const category = m.category || (m.type === 'VIDEO' ? 'VIDEOS' : m.type === 'DOCUMENT' ? 'BROCHURE' : 'EXTERIOR');

  return {
    ...m,
    id: mediaId,
    type: m.type || (m.mimetype?.startsWith('video/') ? 'VIDEO' : m.mimetype === 'application/pdf' ? 'DOCUMENT' : 'IMAGE'),
    category,
    fileName: m.filename || m.fileName || 'Asset',
    fileSizeKb: Math.round((m.sizeBytes || 0) / 1024),
    roomCategory: m.room || m.roomType || m.roomCategory || 'Exterior',
    approvalStatus: m.approvalStatus || (m.isApproved ? 'APPROVED' : 'PENDING'),
    isApproved: m.approvalStatus === 'APPROVED' || m.isApproved === true,
    url: resolvedUrl,
    fileUrl,
    thumbnailUrl,
    uploadedAt: m.createdAt
      ? new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Just now',
    isActual: m.actualOrIllustrative ? m.actualOrIllustrative === 'ACTUAL' : true,
    rightsConsentConfirmed: m.rightsConsent?.confirmed !== undefined ? m.rightsConsent.confirmed : true,
  };
};

export interface MediaFilters {
  projectId?: string;
  unitId?: string;
  category?: string;
  type?: string;
  tags?: string[];
  aspectRatio?: string;
  approvalStatus?: string;
  search?: string;
  consentedOnly?: boolean;
  page?: number;
  limit?: number;
}

export function useMedia(filters: MediaFilters = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['media', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.projectId && filters.projectId !== 'ALL') params.append('projectId', filters.projectId);
      if (filters.unitId && filters.unitId !== 'ALL') params.append('unitId', filters.unitId);
      if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
      if (filters.type && filters.type !== 'ALL') params.append('type', filters.type);
      if (filters.aspectRatio && filters.aspectRatio !== 'ALL') params.append('aspectRatio', filters.aspectRatio);
      if (filters.approvalStatus && filters.approvalStatus !== 'ALL') params.append('approvalStatus', filters.approvalStatus);
      if (filters.search) params.append('search', filters.search);
      if (filters.consentedOnly) params.append('consentedOnly', 'true');
      if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const res = await api.get<{ success: boolean; data: BackendMediaAsset[] }>(`/media?${params.toString()}`);
      return (res.data.data || []).map(normalizeMediaAsset);
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Standard typed hook to access media scoped to a project across any module
 * (Assets page, Creation studio, Campaigns, WhatsApp brochure sharing, etc.)
 */
export function useProjectMedia(projectId?: string, filters: Omit<MediaFilters, 'projectId'> = {}) {
  const isEnabled = Boolean(projectId && projectId.trim() !== '' && projectId !== 'new');
  const query = useMedia(
    {
      ...filters,
      projectId: isEnabled ? projectId : undefined,
    },
    { enabled: isEnabled }
  );

  const mediaList = isEnabled ? (query.data || []) : [];
  const coverImage = mediaList.find((m) => m.isCover && (m.isApproved || m.approvalStatus === 'APPROVED')) ||
    mediaList.find((m) => m.isCover);
  const approvedMedia = mediaList.filter((m) => m.isApproved && m.rightsConsentConfirmed);
  const images = mediaList.filter((m) => m.type === 'IMAGE');
  const videos = mediaList.filter((m) => m.type === 'VIDEO');
  const brochures = mediaList.filter((m) => m.type === 'DOCUMENT');

  return {
    ...query,
    data: mediaList,
    media: mediaList,
    coverImage,
    approvedMedia,
    images,
    videos,
    brochures,
  };
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post<{ success: boolean; data: BackendMediaAsset }>('/media', formData);
      return normalizeMediaAsset(res.data.data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      const projectId = variables.get('projectId');
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-media', projectId] });
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
    },
  });
}

export type PatchMediaData = Partial<Omit<BackendMediaAsset, 'rightsConsent'>> & {
  rightsConsent?: boolean | { confirmed: boolean; by?: string; at?: string };
};

export function usePatchMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PatchMediaData }) => {
      const res = await api.patch<{ success: boolean; data: BackendMediaAsset }>(`/media/${id}`, data);
      return normalizeMediaAsset(res.data.data);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      if (updated.projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-media', updated.projectId] });
        queryClient.invalidateQueries({ queryKey: ['project', updated.projectId] });
      }
    },
  });
}

export function useSetCoverMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const res = await api.patch<{ success: boolean; data: BackendMediaAsset }>(`/media/${id}`, {
        isCover: true,
      });
      return { asset: normalizeMediaAsset(res.data.data), projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['project-media', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useReorderMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, mediaIds }: { projectId: string; mediaIds: string[] }) => {
      const res = await api.post<{ success: boolean; message: string }>('/media/reorder', {
        projectId,
        mediaIds,
      });
      return res.data;
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['project-media', projectId] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (arg: string | { id: string; force?: boolean }) => {
      const id = typeof arg === 'string' ? arg : arg.id;
      const force = typeof arg === 'object' ? Boolean(arg.force) : false;
      const res = await api.delete<{ success: boolean; message: string; inUse?: unknown }>(
        `/media/${id}${force ? '?force=true' : ''}`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useBulkDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, force = false }: { ids: string[]; force?: boolean }) => {
      const results = await Promise.allSettled(
        ids.map((id) => api.delete(`/media/${id}${force ? '?force=true' : ''}`))
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} of ${ids.length} files`);
      }
      return { deletedCount: ids.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
