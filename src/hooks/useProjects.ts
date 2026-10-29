import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface BackendProject {
  _id: string;
  id?: string;
  organizationId: string;
  name: string;
  slug: string;
  category: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';
  subtype: string;
  status: 'DRAFT' | 'ACTIVE' | 'READY' | 'ready' | 'SOLD_OUT' | 'ARCHIVED';
  version?: number;
  submittedAt?: string;
  submittedBy?: string;
  reraNumber?: string;
  location?: {
    address: string;
    city: string;
    microMarket: string;
    state: string;
    pincode: string;
  };
  priceRange?: {
    min: number;
    max: number;
    display: string;
  };
  amenities: string[];
  coverImageUrl?: string;
  details?: Record<string, unknown>;
  ownerContacts?: Array<{
    name: string;
    phone: string;
    email?: string;
    role?: string;
  }>;
  privateDocuments?: Array<{
    title: string;
    url: string;
    documentType?: string;
  }>;
  privateNotes?: string;
  totalUnits?: number;
  createdAt: string;
  updatedAt: string;

  // Normalized convenience accessors for components
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  priceDisplay?: string;
  price?: number;
  isPlot?: boolean;
}

export const normalizeProject = (p: BackendProject): BackendProject => {
  const isPlot = Boolean(p.subtype?.toLowerCase().includes('plot') || p.subtype?.toLowerCase().includes('land'));
  return {
    ...p,
    id: p._id || p.id,
    address: p.location?.address || p.address || '',
    city: p.location?.city || p.city || '',
    state: p.location?.state || p.state || '',
    pincode: p.location?.pincode || p.pincode || '',
    priceDisplay: p.priceRange?.display || p.priceDisplay || (p.priceRange?.min ? `₹${p.priceRange.min.toLocaleString('en-IN')}` : 'Price on Request'),
    price: p.priceRange?.min || p.price || 0,
    isPlot,
  };
};

export interface ProjectFilters {
  category?: string;
  status?: string;
  search?: string;
}

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get<{ success: boolean; data: BackendProject[] }>(`/projects?${params.toString()}`);
      return (res.data.data || []).map(normalizeProject);
    },
  });
}

export function useProject(projectId?: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId || projectId === 'new') return null;
      const res = await api.get<{ success: boolean; data: BackendProject }>(`/projects/${projectId}`);
      return normalizeProject(res.data.data);
    },
    enabled: Boolean(projectId && projectId !== 'new'),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<BackendProject>) => {
      const res = await api.post<{ success: boolean; data: BackendProject }>('/projects', payload);
      return normalizeProject(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BackendProject> }) => {
      const res = await api.patch<{ success: boolean; data: BackendProject }>(`/projects/${id}`, data);
      return normalizeProject(res.data.data);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', updated.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<{ success: boolean; message: string }>(`/projects/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useSubmitProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, version }: { id: string; version?: number }) => {
      const res = await api.post<{ success: boolean; data: BackendProject; message: string }>(
        `/projects/${id}/submit`,
        version !== undefined ? { version } : {}
      );
      return {
        project: normalizeProject(res.data.data),
        message: res.data.message,
      };
    },
    onSuccess: ({ project }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    },
  });
}
