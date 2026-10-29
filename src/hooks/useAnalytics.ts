import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface AnalyticsKpi {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  avgCpl: number;
  ctr: number;
  visitConversionRate: number;
}

export interface AnalyticsTimeseriesPoint {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
  status: 'SYNCED' | 'DELAYED' | 'MISSING';
}

export interface AnalyticsDataQuality {
  totalRecords: number;
  delayedCount: number;
  missingCount: number;
  lastSyncedAt: string;
}

export interface AnalyticsOverviewResponse {
  rangePreset: string;
  startDate: string;
  endDate: string;
  kpis: AnalyticsKpi;
  timeseries: AnalyticsTimeseriesPoint[];
  dataQuality: AnalyticsDataQuality;
}

export interface CampaignAnalyticsItem {
  id: string;
  name: string;
  projectName: string;
  totalSpend: number;
  leads: number;
  cpl: number;
  ctr: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
}

export interface ContentCreativeAnalyticsItem {
  format: string;
  cpl: number;
  highlight: string;
  description: string;
  conversionRate: string;
}

export interface LeadAnalyticsResponse {
  sourceAttribution: Array<{
    source: string;
    leads: number;
    percentage: number;
  }>;
  stageDistribution: Array<{
    stage: string;
    count: number;
  }>;
  conversionFunnel: {
    totalLeads: number;
    contacted: number;
    qualified: number;
    visitsDone: number;
    negotiation: number;
    won: number;
  };
  avgVelocityDays: number;
}

export function useAnalyticsOverview(rangePreset: string = '30D') {
  return useQuery({
    queryKey: ['analytics', 'overview', rangePreset],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: AnalyticsOverviewResponse }>(
        `/analytics/overview?rangePreset=${encodeURIComponent(rangePreset)}`
      );
      return res.data.data;
    },
  });
}

export function useAnalyticsCampaigns() {
  return useQuery({
    queryKey: ['analytics', 'campaigns'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: CampaignAnalyticsItem[] }>(
        '/analytics/campaigns'
      );
      return res.data.data;
    },
  });
}

export function useAnalyticsContent() {
  return useQuery({
    queryKey: ['analytics', 'content'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ContentCreativeAnalyticsItem[] }>(
        '/analytics/content'
      );
      return res.data.data;
    },
  });
}

export function useAnalyticsLeads() {
  return useQuery({
    queryKey: ['analytics', 'leads'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: LeadAnalyticsResponse }>(
        '/analytics/leads'
      );
      return res.data.data;
    },
  });
}

export function useSyncAnalytics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (days: number = 30) => {
      const res = await api.post<{ success: boolean; data: { syncedCount: number; message: string } }>(
        '/analytics/sync',
        { days }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
