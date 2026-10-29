import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface BackendAudienceBrief {
  _id: string;
  id?: string;
  organizationId: string;
  projectId?: string;
  name: string;
  targetPersona: string;
  locations: string[];
  ageRange?: {
    min: number;
    max: number;
  };
  incomeBracket: string;
  interests: string[];
  housingAdPolicyAcknowledged: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Frontend compatibility aliases
  projectName?: string;
  objective?: 'AWARENESS' | 'LEAD_GEN' | 'SITE_VISIT' | 'INVESTOR_ACQUISITION';
  budgetAllocationShare?: string;
  keyAppealDrivers?: string[];
  housingAdComplianceNotice?: string;
}

export const normalizeAudienceBrief = (b: BackendAudienceBrief): BackendAudienceBrief => {
  return {
    ...b,
    id: b._id || b.id,
    projectName: b.name || b.projectName,
    objective: b.objective || 'LEAD_GEN',
    budgetAllocationShare: b.budgetAllocationShare || '35%',
    keyAppealDrivers: b.interests && b.interests.length > 0 ? b.interests : b.keyAppealDrivers || ['Prime Location', 'High ROI'],
    housingAdComplianceNotice:
      b.housingAdComplianceNotice ||
      'Housing Ad Special Category restrictions apply: Explicit age, gender, and familial status demographic targeting are restricted.',
  };
};

export function useAudienceBriefs(projectId?: string) {
  return useQuery({
    queryKey: ['audience-briefs', projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId && projectId !== 'ALL') params.append('projectId', projectId);
      const res = await api.get<{ success: boolean; data: BackendAudienceBrief[] }>(`/audience-briefs?${params.toString()}`);
      return (res.data.data || []).map(normalizeAudienceBrief);
    },
  });
}

export function useCreateAudienceBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<BackendAudienceBrief>) => {
      const body = {
        name: payload.name || payload.projectName || 'Audience Brief',
        targetPersona: payload.targetPersona || 'Prospective Homebuyer',
        locations: payload.locations || [],
        incomeBracket: payload.incomeBracket || 'High Net-Worth Individuals',
        interests: payload.interests || payload.keyAppealDrivers || [],
        housingAdPolicyAcknowledged: payload.housingAdPolicyAcknowledged ?? true,
        projectId: payload.projectId,
      };
      const res = await api.post<{ success: boolean; data: BackendAudienceBrief }>('/audience-briefs', body);
      return normalizeAudienceBrief(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audience-briefs'] });
    },
  });
}

export function useUpdateAudienceBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BackendAudienceBrief> }) => {
      const body = {
        name: data.name || data.projectName,
        targetPersona: data.targetPersona,
        locations: data.locations,
        incomeBracket: data.incomeBracket,
        interests: data.interests || data.keyAppealDrivers,
        housingAdPolicyAcknowledged: data.housingAdPolicyAcknowledged,
        projectId: data.projectId,
      };
      const res = await api.patch<{ success: boolean; data: BackendAudienceBrief }>(`/audience-briefs/${id}`, body);
      return normalizeAudienceBrief(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audience-briefs'] });
    },
  });
}

export function useDeleteAudienceBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<{ success: boolean; message: string }>(`/audience-briefs/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audience-briefs'] });
    },
  });
}
