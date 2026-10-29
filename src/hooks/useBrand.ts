import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface BackendBrandProfile {
  _id?: string;
  organizationId: string;
  logoUrl?: string;
  watermarkUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tone: string;
  supportedLanguages: ('English' | 'Hindi' | 'Hinglish')[];
  defaultDisclaimer: string;
  createdAt?: string;
  updatedAt?: string;

  // Frontend compatibility aliases
  languages?: ('English' | 'Hindi' | 'Hinglish')[];
  disclaimer?: string;
}

export const normalizeBrandProfile = (b: BackendBrandProfile): BackendBrandProfile => {
  return {
    ...b,
    languages: b.supportedLanguages || b.languages || ['English'],
    disclaimer: b.defaultDisclaimer || b.disclaimer || '',
  };
};

export function useBrandProfile() {
  return useQuery({
    queryKey: ['brand-profile'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: BackendBrandProfile }>('/brand');
      return normalizeBrandProfile(res.data.data);
    },
  });
}

export function useUpdateBrandProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<BackendBrandProfile>) => {
      // Ensure backend field names are sent
      const body = {
        ...payload,
        supportedLanguages: payload.languages || payload.supportedLanguages,
        defaultDisclaimer: payload.disclaimer || payload.defaultDisclaimer,
      };
      const res = await api.put<{ success: boolean; data: BackendBrandProfile }>('/brand', body);
      return normalizeBrandProfile(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-profile'] });
    },
  });
}
