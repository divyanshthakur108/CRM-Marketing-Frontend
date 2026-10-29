import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface BackendCreativeHistory {
  version: number;
  headline: string;
  caption: string;
  hashtags: string[];
  renderedAssetUrl?: string;
  approvalStatus?: string;
  factCheckPassed?: boolean;
  factCheckIssues?: string[];
  revisionNotes?: string;
  generatedAt: string;
}

export interface BackendCreativeItem {
  _id: string;
  organizationId: string;
  planItemId?: string;
  projectId?: {
    _id: string;
    name: string;
    category: string;
    location?: { city?: string; microMarket?: string };
    coverImageUrl?: string;
  } | string;
  format: '1:1' | '4:5' | '9:16';
  type?: 'POSTER' | 'REEL';
  unitId?: string;
  files?: Array<{ ratio: '1:1' | '4:5' | '9:16'; storageKey: string; url: string; sizeBytes: number }>;
  sourceAssetIds?: string[];
  factsSnapshot?: {
    projectName?: string;
    unitType?: string;
    price?: string;
    location?: string;
    contactPhone?: string;
    cta?: string;
    [key: string]: unknown;
  };
  generatedBy?: 'template' | 'ai';
  isIllustrative?: boolean;
  occasion?: string;
  extensionType?: 'NONE' | 'AI_CONTINUATION';
  cost?: number;
  errorMessage?: string;
  renderedAssetUrl?: string;
  posterFrameUrl?: string;
  headline: string;
  caption: string;
  hashtags: string[];
  language: 'English' | 'Hindi' | 'Hinglish';
  status: 'GENERATING' | 'GENERATED' | 'FAILED' | 'APPROVED';
  approvalStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED' | 'ready_for_review' | 'stale' | 'failed';
  version: number;
  factCheckPassed: boolean;
  factCheckIssues: string[];
  reReviewRequired: boolean;
  revisionNotes?: string;
  history: BackendCreativeHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateCreativeInput {
  planItemId: string;
  aspectRatio?: '1:1' | '4:5' | '9:16';
  language?: 'English' | 'Hindi' | 'Hinglish';
  customPrompt?: string;
  tone?: string;
}

export interface RequestRevisionInput {
  creativeId: string;
  revisionNotes: string;
}

export interface GenerateCopyInput {
  projectName: string;
  category?: string;
  location?: string;
  tone?: string;
  language?: 'English' | 'Hindi' | 'Hinglish';
}

export interface GenerateImageInput {
  prompt: string;
  aspectRatio?: '1:1' | '4:5' | '9:16';
  projectName?: string;
}

export function useCreatives(filters?: {
  projectId?: string;
  planItemId?: string;
  status?: string;
  approvalStatus?: string;
}) {
  return useQuery({
    queryKey: ['creatives', filters],
    queryFn: async (): Promise<BackendCreativeItem[]> => {
      const res = await api.get<{ success: boolean; data: BackendCreativeItem[] }>('/ai/creatives', {
        params: filters,
      });
      return res.data.data;
    },
  });
}

export function useCreative(id: string | null) {
  return useQuery({
    queryKey: ['creative', id],
    queryFn: async (): Promise<BackendCreativeItem | null> => {
      if (!id) return null;
      const res = await api.get<{ success: boolean; data: BackendCreativeItem }>(`/ai/creatives/${id}`);
      return res.data.data;
    },
    enabled: Boolean(id),
  });
}

export function useGenerateCreative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GenerateCreativeInput): Promise<BackendCreativeItem> => {
      const res = await api.post<{ success: boolean; data: BackendCreativeItem }>(
        '/ai/creatives/generate',
        input
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
    },
  });
}

export function useRequestRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      creativeId,
      revisionNotes,
    }: RequestRevisionInput): Promise<BackendCreativeItem> => {
      const res = await api.post<{ success: boolean; data: BackendCreativeItem }>(
        `/ai/creatives/${creativeId}/revision`,
        { revisionNotes }
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['creative', variables.creativeId] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
    },
  });
}

export function useGenerateCopy() {
  return useMutation({
    mutationFn: async (input: GenerateCopyInput) => {
      const res = await api.post('/ai/generate-copy', input);
      return res.data.data;
    },
  });
}

export function useGenerateImage() {
  return useMutation({
    mutationFn: async (input: GenerateImageInput) => {
      const res = await api.post('/ai/generate-image', input);
      return res.data.data;
    },
  });
}

export function useApproveCreative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      creativeId,
      checklist,
    }: {
      creativeId: string;
      checklist: {
        projectName: boolean;
        unitType: boolean;
        price: boolean;
        location: boolean;
        amenities: boolean;
        contactDetails: boolean;
      };
    }): Promise<BackendCreativeItem> => {
      const res = await api.post<{ success: boolean; data: BackendCreativeItem }>(
        `/ai/creatives/${creativeId}/approve`,
        { factChecklist: checklist, checklist }
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['creative', variables.creativeId] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useRequestCreativeChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      creativeId,
      comment,
    }: {
      creativeId: string;
      comment: string;
    }): Promise<BackendCreativeItem> => {
      const res = await api.post<{ success: boolean; data: BackendCreativeItem }>(
        `/ai/creatives/${creativeId}/request-changes`,
        { comment }
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['creative', variables.creativeId] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useRejectCreative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      creativeId,
      reason,
    }: {
      creativeId: string;
      reason?: string;
    }): Promise<BackendCreativeItem> => {
      const res = await api.post<{ success: boolean; data: BackendCreativeItem }>(
        `/ai/creatives/${creativeId}/reject`,
        { reason }
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['creative', variables.creativeId] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useRegenerateCreative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (creativeId: string): Promise<BackendCreativeItem> => {
      const res = await api.post<{ success: boolean; data: BackendCreativeItem }>(
        `/ai/creatives/${creativeId}/regenerate`
      );
      return res.data.data;
    },
    onSuccess: (_, creativeId) => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['creative', creativeId] });
    },
  });
}

export function useManualGenerateCreatives() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await api.post<{ success: boolean; data: { enqueued: number; jobs: string[] } }>(
        `/ai/projects/${projectId}/generate-creatives`
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useAiHealth() {
  return useQuery({
    queryKey: ['ai-health'],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: {
          configured: boolean;
          provider: string;
          imageModel: string;
          videoModel: string;
          costPerImageUsd: number;
          costPerVideoSecondUsd: number;
          dailyCapUsd: number;
          maxVideoSecondsPerReel: number;
        };
      }>('/ai/health');
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useEstimateCost() {
  return useMutation({
    mutationFn: async (params: { clipCount?: number; secondsPerClip?: number; imageCount?: number }) => {
      const res = await api.post<{
        success: boolean;
        data: {
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
        };
      }>('/ai/estimate-cost', params);
      return res.data.data;
    },
  });
}

export function useGenerateProjectCreatives() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      mode = 'template',
      selectedAssetIds,
    }: {
      projectId: string;
      mode?: 'template' | 'ai_motion';
      selectedAssetIds?: string[];
    }) => {
      const res = await api.post(`/ai/projects/${projectId}/generate-creatives`, {
        mode,
        selectedAssetIds,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['ai-health'] });
    },
  });
}

export function useEnhancePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaAssetId, prompt }: { mediaAssetId: string; prompt?: string }) => {
      const res = await api.post<{
        success: boolean;
        data: {
          originalUrl: string;
          enhancedUrl: string;
          mediaAssetId: string;
          isIllustrative: boolean;
          costUsd: number;
        };
      }>('/ai/enhance-photo', { mediaAssetId, prompt });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export interface OccasionPreset {
  key: string;
  name: string;
  badge: string;
  greetingHeadline: string;
  subGreeting: string;
  tagline: string;
  accentColors: [string, string, string];
  backgroundColors: [string, string, string];
  defaultOffer: string;
  iconSvgSymbol: string;
}

export function useOccasions() {
  return useQuery({
    queryKey: ['occasions'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: OccasionPreset[] }>('/ai/occasions');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useExtendVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      mediaAssetId,
      customPrompt,
    }: {
      projectId: string;
      mediaAssetId: string;
      customPrompt?: string;
    }) => {
      const res = await api.post(`/ai/projects/${projectId}/extend-video`, {
        mediaAssetId,
        customPrompt,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useGenerateOccasion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      occasion,
      customOffer,
      customHeadline,
    }: {
      projectId: string;
      occasion: string;
      customOffer?: string;
      customHeadline?: string;
    }) => {
      const res = await api.post(`/ai/projects/${projectId}/generate-occasion`, {
        occasion,
        customOffer,
        customHeadline,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}


