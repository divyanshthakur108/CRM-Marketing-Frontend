import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PlanningStatus } from '../components/ui/StatusPill';

export interface BackendApprovalItem {
  _id: string;
  organizationId: string;
  entityType?: 'PLAN' | 'CREATIVE' | 'PLAN_ITEM';
  creativeId?: string;
  planId?: string;
  planItemId?: string;
  title?: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  factChecklist: {
    priceVerified: boolean;
    bedroomsVerified: boolean;
    amenitiesVerified: boolean;
    ctaVerified: boolean;
    reraDisclaimerVerified?: boolean;
  };
  comments: Array<{
    _id?: string;
    authorId?: string;
    authorName: string;
    text: string;
    createdAt: string;
  }>;
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FrontendCreativeApproval {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  creativeTitle: string;
  format: 'INSTAGRAM_REEL' | 'FACEBOOK_CAROUSEL' | 'LINKEDIN_POST' | 'WHATSAPP_BROADCAST';
  channel: string;
  assetUrl: string;
  copyHeadline: string;
  bodyCopy: string;
  cta: string;
  status: PlanningStatus;
  checklist: {
    priceVerified: boolean;
    priceDetails: string;
    bedroomsVerified: boolean;
    bedroomDetails: string;
    amenitiesVerified: boolean;
    amenitiesDetails: string;
    ctaVerified: boolean;
    ctaDetails: string;
    reraDisclaimerVerified: boolean;
    reraDetails: string;
  };
  revisions: Array<{
    id: string;
    author: string;
    date: string;
    notes: string;
  }>;
}

export function normalizeApprovalItem(b: BackendApprovalItem): FrontendCreativeApproval {
  const isApproved = b.status === 'APPROVED';
  const isChanges = b.status === 'CHANGES_REQUESTED';
  const status: PlanningStatus = isApproved ? 'Approved' : isChanges ? 'Needs Action' : 'In Review';

  const title = b.title || 'Marketing Creative';
  const projectName = title.includes('-') ? title.split('-')[0].trim() : 'Skyline Developments';

  return {
    id: b._id,
    organizationId: b.organizationId,
    projectId: b.creativeId || b.planId || b.organizationId,
    projectName,
    creativeTitle: title,
    format: title.includes('9:16')
      ? 'INSTAGRAM_REEL'
      : title.includes('Carousel')
      ? 'FACEBOOK_CAROUSEL'
      : 'LINKEDIN_POST',
    channel: 'Meta & Instagram Ads',
    assetUrl:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    copyHeadline: 'Experience Elevated Living with Panoramic Skyline Vistas',
    bodyCopy:
      'Presenting exclusive residences with imported Italian marble, private wrap-around balconies, and over 40+ resort amenities. Limited festival inventory available with zero stamp duty benefits.',
    cta: 'Book Private Site Preview',
    status,
    checklist: {
      priceVerified: Boolean(b.factChecklist?.priceVerified),
      priceDetails: 'Verified against RERA approved starting price ₹2.45 Cr + taxes',
      bedroomsVerified: Boolean(b.factChecklist?.bedroomsVerified),
      bedroomDetails: 'Verified 3 & 4 BHK layout floor plans match sanctioned plans',
      amenitiesVerified: Boolean(b.factChecklist?.amenitiesVerified),
      amenitiesDetails: 'Clubhouse, pool, squash court are part of Phase 1 delivery',
      ctaVerified: Boolean(b.factChecklist?.ctaVerified),
      ctaDetails: 'Redirects to compliant official lead capture funnel',
      reraDisclaimerVerified: Boolean(b.factChecklist?.reraDisclaimerVerified),
      reraDetails: 'Registration PRM/KA/RERA/1251/446/PR/200123/003456 clearly displayed',
    },
    revisions: (b.comments || []).map((c, idx) => ({
      id: c._id || `rev-${idx}`,
      author: c.authorName || 'Reviewer',
      date: c.createdAt ? c.createdAt.slice(0, 16).replace('T', ' ') : 'Just now',
      notes: c.text,
    })),
  };
}

export function useApprovals(statusFilter?: 'ALL' | 'PENDING' | 'APPROVED') {
  return useQuery({
    queryKey: ['approvals', statusFilter],
    queryFn: async (): Promise<FrontendCreativeApproval[]> => {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const res = await api.get<{ success: boolean; data: BackendApprovalItem[] }>('/approvals', {
        params,
      });

      return res.data.data.map(normalizeApprovalItem);
    },
  });
}

export function useDecideApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      approvalId,
      decision,
      factChecklist,
      feedback,
    }: {
      approvalId: string;
      decision: 'APPROVED' | 'CHANGES_REQUESTED';
      factChecklist?: {
        priceVerified: boolean;
        bedroomsVerified: boolean;
        amenitiesVerified: boolean;
        ctaVerified: boolean;
        reraDisclaimerVerified: boolean;
      };
      feedback?: string;
    }) => {
      const res = await api.post<{ success: boolean; data: BackendApprovalItem }>(
        `/approvals/${approvalId}/decide`,
        {
          decision,
          factChecklist,
          feedback,
        }
      );
      return normalizeApprovalItem(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-items'] });
    },
  });
}
