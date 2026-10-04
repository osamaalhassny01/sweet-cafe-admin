import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  apiKey: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  loginWithApiKey: (apiKey: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      apiKey: null,
      user: null,
      login: (token, user) => set({ token, user, apiKey: null }),
      loginWithApiKey: (apiKey) => set({ apiKey, token: null, user: null }),
      logout: () => set({ token: null, user: null, apiKey: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
