import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Visit scheduled'
  | 'Visit done'
  | 'Negotiation'
  | 'Won/Lost';

export type LeadSource = 'META_AD' | 'WHATSAPP' | 'DIRECT' | 'PORTAL' | 'MANUAL';

export interface BackendLead {
  _id: string;
  id?: string;
  organizationId: string;
  dedupeKey: string;
  name: string;
  phone: string;
  email?: string;
  projectId?: string;
  projectName?: string;
  budget?: number;
  budgetDisplay?: string;
  stage: LeadStage;
  assignedTo?: string;
  assignedAgentName?: string;
  source: LeadSource;
  metaLeadId?: string;
  lastContactedAt?: string;
  notes?: string;
  consentGiven: boolean;
  consentTimestamp?: string;
  consentSource?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadTimelineEvent {
  _id: string;
  id?: string;
  organizationId: string;
  leadId: string;
  authorId?: string;
  authorName: string;
  type:
    | 'STAGE_PROGRESSION'
    | 'CALL_LOG'
    | 'AGENT_NOTE'
    | 'WHATSAPP_MESSAGE'
    | 'SITE_VISIT_BOOKED'
    | 'INBOUND_SUBMISSION'
    | 'ASSIGNMENT';
  summary: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface LeadFilters {
  stage?: LeadStage | 'ALL';
  projectId?: string;
  assignedTo?: string;
  source?: LeadSource | 'ALL';
  search?: string;
  page?: number;
  limit?: number;
}

export interface LeadsListResponse {
  leads: BackendLead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stageCounts: Record<LeadStage, number>;
}

export interface LeadDetailResponse {
  lead: BackendLead;
  timeline: LeadTimelineEvent[];
}

export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.stage && filters.stage !== 'ALL') params.append('stage', filters.stage);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters.source && filters.source !== 'ALL') params.append('source', filters.source);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const res = await api.get<{ success: boolean; data: LeadsListResponse }>(
        `/leads?${params.toString()}`
      );
      return res.data.data;
    },
  });
}

export function useLead(leadId?: string | null) {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const res = await api.get<{ success: boolean; data: LeadDetailResponse }>(`/leads/${leadId}`);
      return res.data.data;
    },
    enabled: Boolean(leadId),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<BackendLead>) => {
      const res = await api.post<{ success: boolean; data: BackendLead }>('/leads', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BackendLead> }) => {
      const res = await api.patch<{ success: boolean; data: BackendLead }>(`/leads/${id}`, data);
      return res.data.data;
    },
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', updatedLead._id] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useAddTimelineEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      entry,
    }: {
      leadId: string;
      entry: {
        type: LeadTimelineEvent['type'];
        summary: string;
        details?: Record<string, unknown>;
      };
    }) => {
      const res = await api.post<{ success: boolean; data: LeadTimelineEvent }>(
        `/leads/${leadId}/timeline`,
        entry
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<{ success: boolean; message: string }>(`/leads/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
