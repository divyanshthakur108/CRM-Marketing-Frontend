import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface BackendUnit {
  _id: string;
  id?: string;
  organizationId: string;
  projectId: string;
  unitNumber: string;
  unitType: string;
  floor?: number;
  tower?: string;
  carpetAreaSqFt: number;
  superBuiltUpAreaSqFt?: number;
  price: number;
  priceDisplay?: string;
  status: 'AVAILABLE' | 'BLOCKED' | 'SOLD';
  attributes?: Record<string, unknown>;
  changeHistory?: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
    timestamp: string;
    reason?: string;
  }>;
  createdAt: string;
  updatedAt: string;

  // Normalized frontend convenience accessors
  name?: string;
  type?: string;
  areaSqFt?: number;
  isAvailable?: boolean;
  bhk?: string;
  bathrooms?: number;
}

export const normalizeUnit = (u: BackendUnit): BackendUnit => {
  const attrs = (u.attributes || {}) as Record<string, unknown>;
  return {
    ...u,
    id: u._id || u.id,
    name: u.unitNumber,
    type: u.unitType,
    areaSqFt: u.carpetAreaSqFt,
    isAvailable: u.status === 'AVAILABLE',
    bhk: (attrs.bhk as string) || (u.unitType.includes('BHK') ? u.unitType.split(' ')[0] : undefined),
    bathrooms: attrs.bathrooms ? Number(attrs.bathrooms) : undefined,
    priceDisplay: u.priceDisplay || (u.price ? `₹${u.price.toLocaleString('en-IN')}` : 'Price on Request'),
  };
};

export function useUnits(projectId?: string) {
  return useQuery({
    queryKey: ['units', projectId],
    queryFn: async () => {
      if (!projectId || projectId === 'new') return [];
      const res = await api.get<{ success: boolean; data: BackendUnit[] }>(`/projects/${projectId}/units`);
      return (res.data.data || []).map(normalizeUnit);
    },
    enabled: Boolean(projectId && projectId !== 'new'),
  });
}

export function useCreateUnit(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<BackendUnit>) => {
      if (!projectId) throw new Error('Project ID required to add unit');
      const res = await api.post<{ success: boolean; data: BackendUnit }>(`/projects/${projectId}/units`, payload);
      return normalizeUnit(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateUnit(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ unitId, data }: { unitId: string; data: Partial<BackendUnit> & { changeReason?: string } }) => {
      if (!projectId) throw new Error('Project ID required');
      const res = await api.patch<{ success: boolean; data: BackendUnit }>(`/projects/${projectId}/units/${unitId}`, data);
      return normalizeUnit(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteUnit(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unitId: string) => {
      if (!projectId) throw new Error('Project ID required');
      const res = await api.delete<{ success: boolean; message: string }>(`/projects/${projectId}/units/${unitId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
