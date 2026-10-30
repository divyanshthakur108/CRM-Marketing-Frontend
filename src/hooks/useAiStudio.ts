import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface AnalyzedSourcePhoto {
  assetId: string;
  url: string;
  filename: string;
  category: string;
  detectedFeatures: string[];
  lighting: string;
  perspective?: string;
}

export interface AiStudioImage {
  id: string;
  url: string;
  storageKey: string;
  title: string;
  category: string;
  cameraAngle: string;
  lightingStyle: string;
  aspectRatio: '4:5' | '1:1' | '9:16';
  isSelected: boolean;
  isRegenerated?: boolean;
  prompt?: string;
  generatedAt: string;
  sourceAssetId?: string;
  sourceAssetUrl?: string;
  featureHighlighted?: string;
  compositionType?: string;
  visualHash?: string;
  similarityScore?: number;
  isDuplicateWarning?: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVirtuallyStaged?: boolean;
  structurePreservationScore?: number;
  qualityScore?: number;
  provider?: string;
  savedToMediaId?: string;
}

export type ReelVariationStyle = 'CINEMATIC_SHOWCASE' | 'LUXURY_PRESENTATION' | 'MODERN_PROMO_AD';

export interface AiStudioReel {
  id: string;
  versionNumber: number;
  variationStyle: ReelVariationStyle;
  title: string;
  subtitle: string;
  videoUrl: string;
  posterFrameUrl: string;
  storageKey: string;
  durationSeconds: number;
  selectedImageIds: string[];
  musicTrack?: string;
  approvalStatus: 'DRAFT' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface PropertyVisionAnalysis {
  propertyType: string;
  architecturalStyle: string;
  dominantColors: string[];
  lightingProfile: string;
  roomLayouts: string[];
  detectedSpaces: string[];
  uniqueFeatures: string[];
  analysisSummary: string;
  analyzedAt: string;
  analyzedPhotos?: AnalyzedSourcePhoto[];
}

export interface AiStudioBatch {
  _id: string;
  organizationId: string;
  projectId: string;
  version: number;
  status: 'IDLE' | 'QUEUED' | 'ANALYZING' | 'GENERATING' | 'READY' | 'FAILED';
  progress?: number;
  currentStep?: string;
  jobId?: string;
  targetCount?: number;
  visionAnalysis?: PropertyVisionAnalysis;
  images: AiStudioImage[];
  reels: AiStudioReel[];
  sourceMediaAssetIds: string[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export function useAiStudioBatches(projectId: string | undefined) {
  return useQuery({
    queryKey: ['ai-studio-batches', projectId],
    queryFn: async (): Promise<AiStudioBatch[]> => {
      if (!projectId) return [];
      const res = await api.get<{ success: boolean; data: AiStudioBatch[] }>(
        `/ai/projects/${projectId}/studio-batches`
      );
      return res.data.data;
    },
    enabled: Boolean(projectId),
  });
}

export function useAiStudioBatch(batchId: string | null) {
  return useQuery({
    queryKey: ['ai-studio-batch', batchId],
    queryFn: async (): Promise<AiStudioBatch | null> => {
      if (!batchId) return null;
      const res = await api.get<{ success: boolean; data: AiStudioBatch }>(
        `/ai/studio-batches/${batchId}`
      );
      return res.data.data;
    },
    enabled: Boolean(batchId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (
        data &&
        (data.status === 'GENERATING' || data.status === 'ANALYZING' || data.status === 'QUEUED')
      ) {
        return 1500;
      }
      return false;
    },
  });
}

export function useAnalyzeProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string }): Promise<PropertyVisionAnalysis> => {
      const res = await api.post<{ success: boolean; data: PropertyVisionAnalysis }>(
        `/ai/projects/${projectId}/studio-analyze`
      );
      return res.data.data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batches', projectId] });
    },
  });
}

export function useGenerateStudioImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      targetCount = 15,
      stylePreset = 'HERITAGE_LUXURY',
    }: {
      projectId: string;
      targetCount?: number;
      stylePreset?: 'HERITAGE_LUXURY' | 'HIGH_GROWTH_ROI';
    }): Promise<AiStudioBatch> => {
      const res = await api.post<{ success: boolean; data: AiStudioBatch }>(
        `/ai/projects/${projectId}/studio-generate-images`,
        { targetCount, stylePreset }
      );
      return res.data.data;
    },
    onSuccess: (data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batches', projectId] });
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batch', data._id] });
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
    },
  });
}

export function useRegenerateStudioImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      batchId,
      imageId,
    }: {
      batchId: string;
      imageId: string;
    }): Promise<AiStudioImage> => {
      const res = await api.post<{ success: boolean; data: AiStudioImage }>(
        `/ai/studio-batches/${batchId}/regenerate-image`,
        { imageId }
      );
      return res.data.data;
    },
    onSuccess: (_, { batchId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batches'] });
    },
  });
}

export function useUpdateStudioSelection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      batchId,
      selectedImageIds,
    }: {
      batchId: string;
      selectedImageIds: string[];
    }): Promise<AiStudioBatch> => {
      const res = await api.patch<{ success: boolean; data: AiStudioBatch }>(
        `/ai/studio-batches/${batchId}/selection`,
        { selectedImageIds }
      );
      return res.data.data;
    },
    onSuccess: (_, { batchId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batches'] });
    },
  });
}

export function useGenerateStudioReel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      batchId,
      variationStyle,
      selectedImageIds,
    }: {
      batchId: string;
      variationStyle: ReelVariationStyle;
      selectedImageIds?: string[];
    }): Promise<AiStudioReel> => {
      const res = await api.post<{ success: boolean; data: AiStudioReel }>(
        `/ai/studio-batches/${batchId}/generate-reel`,
        { variationStyle, selectedImageIds }
      );
      return res.data.data;
    },
    onSuccess: (_, { batchId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batches'] });
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
    },
  });
}

export function useSetStudioReelApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      batchId,
      reelId,
      status,
    }: {
      batchId: string;
      reelId: string;
      status: 'APPROVED' | 'REJECTED';
    }): Promise<AiStudioReel> => {
      const res = await api.post<{ success: boolean; data: AiStudioReel }>(
        `/ai/studio-batches/${batchId}/reels/${reelId}/approval`,
        { status }
      );
      return res.data.data;
    },
    onSuccess: (_, { batchId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batches'] });
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
    },
  });
}

export function useUploadStudioPhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      files,
    }: {
      projectId: string;
      files: File[];
    }): Promise<any[]> => {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const res = await api.post<{ success: boolean; data: any[] }>(
        `/ai/projects/${projectId}/studio-upload-photos`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data.data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-media', projectId] });
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batches', projectId] });
    },
  });
}

export function useSetStudioImageApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      batchId,
      imageId,
      status,
    }: {
      batchId: string;
      imageId: string;
      status: 'APPROVED' | 'REJECTED';
    }): Promise<AiStudioImage> => {
      const res = await api.post<{ success: boolean; data: AiStudioImage }>(
        `/ai/studio-batches/${batchId}/images/${imageId}/approval`,
        { status }
      );
      return res.data.data;
    },
    onSuccess: (_, { batchId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batch', batchId] });
    },
  });
}

export function useSaveStudioImageToMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      batchId,
      imageId,
    }: {
      batchId: string;
      imageId: string;
    }): Promise<any> => {
      const res = await api.post<{ success: boolean; data: any }>(
        `/ai/studio-batches/${batchId}/images/${imageId}/save-to-media`
      );
      return res.data.data;
    },
    onSuccess: (_, { batchId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio-batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['project-media'] });
    },
  });
}
