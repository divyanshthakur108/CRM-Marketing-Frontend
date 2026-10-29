import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show';

export interface BackendAppointment {
  _id: string;
  id?: string;
  organizationId: string;
  leadId?: string;
  projectId?: string;
  leadName: string;
  leadPhone: string;
  projectName: string;
  appointmentDate: string;
  timeSlot: string;
  status: AppointmentStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  gatePassCode?: string;
  notes?: string;
  feedbackRating?: number;
  feedbackNotes?: string;
  interestLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  nextAction?: string;
  nextActionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentFilters {
  status?: AppointmentStatus;
  assignedAgentId?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentsListResponse {
  appointments: BackendAppointment[];
  total: number;
  scheduledCount: number;
}

export interface SlotAvailability {
  timeSlot: string;
  isAvailable: boolean;
  bookedCount: number;
}

export function useAppointments(filters: AppointmentFilters = {}) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.assignedAgentId) params.append('assignedAgentId', filters.assignedAgentId);
      if (filters.date) params.append('date', filters.date);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const res = await api.get<{ success: boolean; data: AppointmentsListResponse }>(
        `/appointments?${params.toString()}`
      );
      return res.data.data;
    },
  });
}

export function useAvailability(date?: string, agentId?: string) {
  return useQuery({
    queryKey: ['appointments', 'availability', date, agentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (agentId) params.append('agentId', agentId);

      const res = await api.get<{ success: boolean; data: SlotAvailability[] }>(
        `/appointments/availability?${params.toString()}`
      );
      return res.data.data;
    },
    enabled: Boolean(date),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<BackendAppointment>) => {
      const res = await api.post<{ success: boolean; data: BackendAppointment }>(
        '/appointments',
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BackendAppointment> }) => {
      const res = await api.patch<{ success: boolean; data: BackendAppointment }>(
        `/appointments/${id}`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      feedback,
    }: {
      appointmentId: string;
      feedback: {
        feedbackRating: number;
        feedbackNotes: string;
        interestLevel: 'HIGH' | 'MEDIUM' | 'LOW';
        nextAction: string;
        nextActionDate?: string;
      };
    }) => {
      const res = await api.patch<{ success: boolean; data: BackendAppointment }>(
        `/appointments/${appointmentId}/feedback`,
        feedback
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
