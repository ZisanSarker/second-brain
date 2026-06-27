'use client';

import { create } from 'zustand';
import type { User, Workspace } from '@second-brain/types';
import { authApi } from '@/lib/api/auth';
import { workspacesApi } from '@/lib/api/workspaces';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  currentWorkspace: null,
  workspaces: [],
  isLoading: true,
  isAuthenticated: false,

  loadFromStorage: () => {
    try {
      const userStr = localStorage.getItem('auth_user');
      const tokensStr = localStorage.getItem('auth_tokens');
      const wsStr = localStorage.getItem('current_workspace');

      const user = userStr ? JSON.parse(userStr) : null;
      const tokens = tokensStr ? JSON.parse(tokensStr) : null;
      const workspace = wsStr ? JSON.parse(wsStr) : null;

      set({
        user,
        accessToken: tokens?.accessToken ?? null,
        refreshToken: tokens?.refreshToken ?? null,
        currentWorkspace: workspace,
        isAuthenticated: !!user,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    localStorage.setItem(
      'auth_tokens',
      JSON.stringify({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      }),
    );
    set({
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      isAuthenticated: true,
    });
  },

  register: async (email, password, name) => {
    const res = await authApi.register({ email, password, name });
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    localStorage.setItem(
      'auth_tokens',
      JSON.stringify({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      }),
    );
    set({
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('current_workspace');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      currentWorkspace: null,
      workspaces: [],
      isAuthenticated: false,
    });
  },

  refreshAuth: async () => {
    const { refreshToken } = get();
    if (!refreshToken) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await authApi.refresh(refreshToken);
      localStorage.setItem(
        'auth_tokens',
        JSON.stringify({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        }),
      );
      set({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('current_workspace');
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  fetchWorkspaces: async () => {
    try {
      const workspaces = await workspacesApi.list();
      set({ workspaces });
      // Set current workspace if only one exists and none selected
      const { currentWorkspace } = get();
      if (!currentWorkspace && workspaces.length > 0) {
        set({ currentWorkspace: workspaces[0] });
        localStorage.setItem('current_workspace', JSON.stringify(workspaces[0]));
      }
    } catch {
      // Silently fail
    }
  },

  setCurrentWorkspace: (workspace) => {
    if (workspace) {
      localStorage.setItem('current_workspace', JSON.stringify(workspace));
    } else {
      localStorage.removeItem('current_workspace');
    }
    set({ currentWorkspace: workspace });
  },
}));
