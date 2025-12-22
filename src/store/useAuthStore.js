import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            isAuthenticated: false,
            login: (password) => {
                if (password === 'admin123') {
                    set({ isAuthenticated: true });
                    return true;
                }
                return false;
            },
            logout: () => set({ isAuthenticated: false }),
        }),
        {
            name: 'microhouse-auth-storage',
            storage: createJSONStorage(() => sessionStorage), // Use sessionStorage instead of localStorage
        }
    )
);
