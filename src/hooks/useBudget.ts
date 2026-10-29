import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface FrontendProjectAllocation {
  projectId: string;
  projectName: string;
  allocatedAmount: number;
  metaAds: number;
  googleAds: number;
  linkedinAds: number;
  directWhatsapp: number;
}

export interface BackendBudgetResponse {
  _id?: string;
  organizationId: string;
  month: number;
  year: number;
  overallCap: number;
  currency: string;
  projectAllocations: Array<{
    projectId: string;
    projectName: string;
    amount: number;
    metaAds?: number;
    googleAds?: number;
    linkedinAds?: number;
    directWhatsapp?: number;
  }>;
  isTemplate?: boolean;
}

export interface NormalizedBudget {
  overallCap: number;
  currency: string;
  month: number;
  year: number;
  allocations: FrontendProjectAllocation[];
  isTemplate?: boolean;
}

export function formatMonthToParam(monthStr: string): string {
  // If already in YYYY-MM format
  if (/^\d{4}-\d{1,2}$/.test(monthStr)) return monthStr;

  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const lower = monthStr.toLowerCase().trim();
  const matchedIdx = monthNames.findIndex((m) => lower.startsWith(m));
  const yearMatch = lower.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : '2026';

  if (matchedIdx !== -1) {
    const monthNum = String(matchedIdx + 1).padStart(2, '0');
    return `${year}-${monthNum}`;
  }

  return '2026-11';
}

export function useBudget(monthString: string) {
  const monthParam = formatMonthToParam(monthString);

  return useQuery({
    queryKey: ['budget', monthParam],
    queryFn: async (): Promise<NormalizedBudget> => {
      const res = await api.get<{ success: boolean; data: BackendBudgetResponse }>(
        `/budgets/${monthParam}`
      );
      const b = res.data.data;

      const allocations: FrontendProjectAllocation[] = (b.projectAllocations || []).map((p) => ({
        projectId: String(p.projectId),
        projectName: p.projectName || 'Project',
        allocatedAmount: p.amount ?? 0,
        metaAds: p.metaAds ?? Math.round((p.amount ?? 0) * 0.5),
        googleAds: p.googleAds ?? Math.round((p.amount ?? 0) * 0.35),
        linkedinAds: p.linkedinAds ?? Math.round((p.amount ?? 0) * 0.1),
        directWhatsapp:
          p.directWhatsapp ??
          Math.max(
            0,
            (p.amount ?? 0) -
              (Math.round((p.amount ?? 0) * 0.5) +
                Math.round((p.amount ?? 0) * 0.35) +
                Math.round((p.amount ?? 0) * 0.1))
          ),
      }));

      return {
        overallCap: b.overallCap,
        currency: b.currency || 'INR',
        month: b.month,
        year: b.year,
        allocations,
        isTemplate: b.isTemplate,
      };
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monthString,
      overallCap,
      allocations,
      currency = 'INR',
    }: {
      monthString: string;
      overallCap: number;
      allocations: FrontendProjectAllocation[];
      currency?: string;
    }) => {
      const monthParam = formatMonthToParam(monthString);
      const payload = {
        overallCap,
        currency,
        projectAllocations: allocations.map((a) => ({
          projectId: a.projectId,
          projectName: a.projectName,
          amount: a.allocatedAmount,
          metaAds: a.metaAds,
          googleAds: a.googleAds,
          linkedinAds: a.linkedinAds,
          directWhatsapp: a.directWhatsapp,
        })),
      };

      const res = await api.put<{ success: boolean; data: BackendBudgetResponse }>(
        `/budgets/${monthParam}`,
        payload
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      const monthParam = formatMonthToParam(variables.monthString);
      queryClient.invalidateQueries({ queryKey: ['budget', monthParam] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
