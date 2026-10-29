import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PlanningStatus } from '../components/ui/StatusPill';

export interface BackendPlanItem {
  _id: string;
  organizationId: string;
  planId: string;
  projectId: string;
  projectName?: string;
  title: string;
  type: string;
  channel: string;
  scheduledDate: string;
  scheduledTime: string;
  scheduledAt?: string;
  timezone: string;
  version: number;
  isPaid: boolean;
  proposedBudget?: number;
  topic: string;
  creativeBrief: string;
  copySnippet?: string;
  previewUrl?: string;
  targetAudience?: string;
  ctaText?: string;
  approvalStatus: string;
  publishStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendPlan {
  _id: string;
  organizationId: string;
  projectId?: string;
  cycleName: string;
  month: number;
  year: number;
  version: number;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'SUBMITTED' | 'ACTIVE';
  itemsCount: number;
  allocatedBudget?: number;
  strategySummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendApprovalComment {
  _id?: string;
  authorId?: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface BackendApprovalRecord {
  _id: string;
  organizationId: string;
  entityType?: string;
  planId?: string;
  title?: string;
  status: string;
  comments: BackendApprovalComment[];
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface FrontendCalendarItem {
  id: string;
  organizationId: string;
  planId: string;
  projectId: string;
  projectName: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  timezone?: string;
  format: 'INSTAGRAM_REEL' | 'FACEBOOK_CAROUSEL' | 'WHATSAPP_BROADCAST' | 'LINKEDIN_POST' | 'YOUTUBE_SHORTS' | 'PRINT_FLYER';
  channelType: 'ORGANIC' | 'PAID';
  status: PlanningStatus;
  copySnippet: string;
  previewUrl: string;
  targetAudience: string;
  ctaText: string;
  version: number;
  isPaid: boolean;
  proposedBudget?: number;
  topic: string;
  creativeBrief: string;
}

export interface FrontendPlanReview {
  id: string;
  organizationId: string;
  cycleName: string;
  projectId: string;
  projectName: string;
  scheduledPeriod: string;
  totalCreatives: number;
  allocatedBudget: number;
  strategySummary: string;
  status: PlanningStatus;
  items: Array<{
    id: string;
    title: string;
    format: string;
    scheduledDate: string;
    channel: string;
    hook: string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    date: string;
    text: string;
  }>;
}

// Map backend publish & approval statuses to UI PlanningStatus
export function mapToPlanningStatus(publishStatus: string, approvalStatus: string): PlanningStatus {
  if (publishStatus === 'PAUSED') return 'Paused';
  if (publishStatus === 'PUBLISHED') return 'Published';
  if (publishStatus === 'CANCELLED' || publishStatus === 'FAILED') return 'Needs Action';
  if (approvalStatus === 'APPROVED') return 'Approved';
  if (approvalStatus === 'PENDING_APPROVAL') return 'In Review';
  if (approvalStatus === 'CHANGES_REQUESTED') return 'Needs Action';
  return 'Draft';
}

// Map backend format to UI format
export function mapFormat(backendType: string): FrontendCalendarItem['format'] {
  switch (backendType) {
    case 'REEL_9x16':
    case 'INSTAGRAM_REEL':
      return 'INSTAGRAM_REEL';
    case 'CAROUSEL':
    case 'FACEBOOK_CAROUSEL':
      return 'FACEBOOK_CAROUSEL';
    case 'WHATSAPP_BROADCAST':
      return 'WHATSAPP_BROADCAST';
    case 'YOUTUBE_SHORTS':
      return 'YOUTUBE_SHORTS';
    case 'POST_4x5':
    default:
      return 'FACEBOOK_CAROUSEL';
  }
}

export function normalizeCalendarItem(item: BackendPlanItem): FrontendCalendarItem {
  const dateStr = item.scheduledDate ? item.scheduledDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
  return {
    id: item._id,
    organizationId: item.organizationId,
    planId: item.planId,
    projectId: item.projectId,
    projectName: item.projectName || 'Project',
    title: item.title || item.topic,
    date: dateStr,
    time: item.scheduledTime || '18:00',
    timezone: item.timezone || 'Asia/Kolkata (IST)',
    format: mapFormat(item.type),
    channelType: item.isPaid ? 'PAID' : 'ORGANIC',
    status: mapToPlanningStatus(item.publishStatus, item.approvalStatus),
    copySnippet: item.copySnippet || '',
    previewUrl: item.previewUrl || '',
    targetAudience: item.targetAudience || 'Luxury Home Buyers',
    ctaText: item.ctaText || 'Learn More',
    version: item.version || 1,
    isPaid: Boolean(item.isPaid),
    proposedBudget: item.proposedBudget,
    topic: item.topic,
    creativeBrief: item.creativeBrief,
  };
}

// ----------------- Hooks -----------------

export function usePlanItems(month?: number, year?: number) {
  return useQuery({
    queryKey: ['plan-items', { month, year }],
    queryFn: async (): Promise<FrontendCalendarItem[]> => {
      const params: Record<string, string | number> = {};
      if (month) params.month = month;
      if (year) params.year = year;

      const res = await api.get<{ success: boolean; data: BackendPlanItem[] }>('/plan-items', {
        params,
      });

      return (res.data.data || []).map(normalizeCalendarItem);
    },
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async (): Promise<BackendPlan[]> => {
      const res = await api.get<{ success: boolean; data: BackendPlan[] }>('/plans');
      return res.data.data || [];
    },
  });
}

export function usePlanDetails(planId?: string) {
  return useQuery({
    queryKey: ['plan', planId],
    enabled: Boolean(planId),
    queryFn: async (): Promise<{
      plan: BackendPlan;
      items: BackendPlanItem[];
      approvals: BackendApprovalRecord[];
    }> => {
      const res = await api.get<{
        success: boolean;
        data: {
          plan: BackendPlan;
          items: BackendPlanItem[];
          approvals: BackendApprovalRecord[];
        };
      }>(`/plans/${planId}`);
      return res.data.data;
    },
  });
}

export function useGeneratePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      month,
      year,
      projectId,
      overrideExisting = false,
      cycleName,
    }: {
      month: string | number;
      year?: number;
      projectId?: string;
      overrideExisting?: boolean;
      cycleName?: string;
    }) => {
      const res = await api.post<{
        success: boolean;
        data: { plan: BackendPlan; items: BackendPlanItem[] };
      }>('/plans/generate', {
        month,
        year,
        projectId,
        overrideExisting,
        cycleName,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useReschedulePlanItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      scheduledDate,
      scheduledTime,
      timezone = 'Asia/Kolkata',
      version,
    }: {
      itemId: string;
      scheduledDate: string;
      scheduledTime?: string;
      timezone?: string;
      version?: number;
    }) => {
      const res = await api.patch<{ success: boolean; data: BackendPlanItem }>(
        `/plan-items/${itemId}/reschedule`,
        {
          scheduledDate,
          scheduledTime,
          timezone,
          version,
        }
      );
      return normalizeCalendarItem(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
    },
  });
}

export function usePausePlanItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.patch<{ success: boolean; data: BackendPlanItem }>(
        `/plan-items/${itemId}/pause`
      );
      return normalizeCalendarItem(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
    },
  });
}

export function useResumePlanItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.patch<{ success: boolean; data: BackendPlanItem }>(
        `/plan-items/${itemId}/resume`
      );
      return normalizeCalendarItem(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
    },
  });
}

export function useCancelPlanItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.patch<{ success: boolean; data: BackendPlanItem }>(
        `/plan-items/${itemId}/cancel`
      );
      return normalizeCalendarItem(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
    },
  });
}

export function useDeletePlanItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/plan-items/${itemId}`);
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useSubmitPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const res = await api.post<{ success: boolean; data: BackendPlan }>(
        `/plans/${planId}/submit`
      );
      return res.data.data;
    },
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useApprovePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, comments }: { planId: string; comments?: string }) => {
      const res = await api.post<{ success: boolean; data: BackendPlan }>(
        `/plans/${planId}/approve`,
        { comments }
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan', variables.planId] });
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useRequestChangesOnPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, comments }: { planId: string; comments: string }) => {
      const res = await api.post<{ success: boolean; data: BackendPlan }>(
        `/plans/${planId}/request-changes`,
        { comments }
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan', variables.planId] });
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}
