import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface MetaConnectionStatus {
  connected: boolean;
  adapterMode: string;
  facebookPage: {
    connected: boolean;
    pageId: string;
    pageName: string;
    tokenPreview?: string;
  };
  instagramAccount: {
    connected: boolean;
    accountId: string;
    handle: string;
  };
  adAccount: {
    connected: boolean;
    accountId: string;
    name: string;
    currency: string;
  };
  systemUserActive: boolean;
  tokenExpiresAt?: string;
  disclaimer: string;
}

export interface PublishingLogItem {
  _id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'BOTH';
  metaPostId?: string;
  postUrl?: string;
  caption: string;
  status: 'PUBLISHED' | 'FAILED' | 'RETRYING';
  publishedAt: string;
  errorMessage?: string;
  retryCount: number;
  projectId?: { _id: string; name: string };
  planItemId?: { _id: string; title: string; scheduledAt?: string };
}

export interface CampaignItem {
  _id: string;
  name: string;
  objective: string;
  dailyBudget: number;
  totalSpend: number;
  status: 'ACTIVE' | 'PAUSED' | 'LEARNING' | 'COMPLETED';
  completedSteps: ('CAMPAIGN' | 'AD_SET' | 'CREATIVE' | 'AD')[];
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaCreativeId?: string;
  metaAdId?: string;
  needsAction: boolean;
  lastErrorStep?: string;
  lastErrorMessage?: string;
  projectId?: { _id: string; name: string };
  metrics: {
    impressions: number;
    clicks: number;
    leads: number;
    spend: number;
    cpl?: number;
    ctr?: string;
    roas?: string;
  };
}

export function useMetaStatus() {
  return useQuery({
    queryKey: ['meta-status'],
    queryFn: async () => {
      const res = await api.get('/meta/status');
      return res.data.data as MetaConnectionStatus;
    },
  });
}

export function useMetaConnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post('/meta/callback', { code });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-status'] });
    },
  });
}

export function useMetaDisconnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/meta/disconnect');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-status'] });
    },
  });
}

export function usePublishingLogs(filters?: { platform?: string; status?: string }) {
  return useQuery({
    queryKey: ['publishing-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.platform && filters.platform !== 'ALL') params.append('platform', filters.platform);
      if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);

      const res = await api.get(`/publishing/logs?${params.toString()}`);
      return res.data.data as PublishingLogItem[];
    },
  });
}

export function useRetryPublishingLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string) => {
      const res = await api.post(`/publishing/logs/${logId}/retry`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishing-logs'] });
    },
  });
}

export function useCampaigns(status?: string) {
  return useQuery({
    queryKey: ['campaigns', status],
    queryFn: async () => {
      const params = status && status !== 'ALL' ? `?status=${status}` : '';
      const res = await api.get(`/campaigns${params}`);
      return res.data.data as CampaignItem[];
    },
  });
}

export function useDeployCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      projectId: string;
      creativeId: string;
      planItemId?: string;
      name: string;
      dailyBudget: number;
      objective?: string;
      targeting?: Record<string, unknown>;
    }) => {
      const res = await api.post('/campaigns/deploy', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await api.post(`/campaigns/${campaignId}/resume`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, status }: { campaignId: string; status: 'ACTIVE' | 'PAUSED' }) => {
      const res = await api.patch(`/campaigns/${campaignId}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
