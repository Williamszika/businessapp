import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { PATRON_ID } from '@/data/seed';
import type { CurrentUser, Employee } from '@/types';

interface AuthState {
  user: CurrentUser | null;
  _hydrated: boolean;
  setHydrated: (v: boolean) => void;
  loginAsPatron: (name?: string) => void;
  loginAsEmployee: (employee: Employee) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      _hydrated: false,
      setHydrated: (v) => set({ _hydrated: v }),

      loginAsPatron: (name) =>
        set({
          user: {
            id: PATRON_ID,
            name: name?.trim() || 'Direction ZKA',
            role: 'patron',
            position: 'Propriétaire',
          },
        }),

      loginAsEmployee: (employee) =>
        set({
          user: {
            id: employee.id,
            name: employee.name,
            role: 'employe',
            employeeId: employee.id,
            position: employee.position,
          },
        }),

      logout: () => set({ user: null }),
    }),
    {
      name: 'zka-auth-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
