import { create } from 'zustand';
import axios from 'axios';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  isPlatformAdmin?: boolean;
  onboardingStatus?: string;
}

export interface UserOrganization {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  organizations: UserOrganization[];

  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setOrganizations: (orgs: UserOrganization[]) => void;
  updateUserOnboardingStatus: (status: string) => void;

  login: (email: string, password: string, organizationId?: string) => Promise<AuthUser>;
  googleLogin: (email?: string, name?: string) => Promise<AuthUser>;
  signup: (payload: {
    name: string;
    email: string;
    organizationName: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true, // starts loading while verifying session
  user: null,
  accessToken: null,
  organizations: [],

  setAccessToken: (token: string | null) => {
    set({ accessToken: token });
  },

  setUser: (user: AuthUser | null) => {
    set({ user, isAuthenticated: !!user });
  },

  setOrganizations: (organizations: UserOrganization[]) => {
    set({ organizations });
  },

  updateUserOnboardingStatus: (status: string) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, onboardingStatus: status } });
    }
  },

  login: async (email: string, password: string, organizationId?: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        '/api/v1/auth/login',
        { email, password, organizationId },
        { withCredentials: true }
      );

      const { user, accessToken, organizations } = response.data.data;

      set({
        isAuthenticated: true,
        isLoading: false,
        user,
        accessToken,
        organizations: organizations || [],
      });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  googleLogin: async (email?: string, name?: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        '/api/v1/auth/google',
        { email, name },
        { withCredentials: true }
      );

      const { user, accessToken, organizations } = response.data.data;

      set({
        isAuthenticated: true,
        isLoading: false,
        user,
        accessToken,
        organizations: organizations || [],
      });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (payload) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        '/api/v1/auth/signup',
        payload,
        { withCredentials: true }
      );

      const { user, accessToken, organizations } = response.data.data;

      set({
        isAuthenticated: true,
        isLoading: false,
        user,
        accessToken,
        organizations: organizations || [],
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await axios.post('/api/v1/auth/logout', {}, { withCredentials: true });
    } catch {
      // Ignore network errors on logout
    } finally {
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
        organizations: [],
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Try refresh first to obtain an in-memory access token via httpOnly cookie
      const refreshRes = await axios.post(
        '/api/v1/auth/refresh',
        {},
        { withCredentials: true }
      );

      const newAccessToken = refreshRes.data?.data?.accessToken;
      if (newAccessToken) {
        set({ accessToken: newAccessToken });

        // Retrieve full profile from /auth/me
        const meRes = await axios.get('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${newAccessToken}` },
          withCredentials: true,
        });

        const userData = meRes.data?.data?.user;

        const orgs =
          meRes.data?.data?.memberships?.map(
            (m: { organizationId: string; organizationName: string; role: string; status: string }) => ({
              id: m.organizationId,
              name: m.organizationName,
              role: m.role,
              status: m.status,
            })
          ) || [];

        set({
          isAuthenticated: true,
          isLoading: false,
          user: userData,
          organizations: orgs,
        });
        return;
      }
    } catch {
      // Session expired or unauthenticated
    }

    set({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      accessToken: null,
    });
  },

  switchOrganization: async (orgId: string) => {
    const { accessToken } = get();
    if (!accessToken) return;

    try {
      const meRes = await axios.get('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-organization-id': orgId,
        },
        withCredentials: true,
      });

      const userData = meRes.data?.data?.user;
      set({
        user: userData,
      });
    } catch (err) {
      console.error('Failed to switch organization context', err);
    }
  },
}));
