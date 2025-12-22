import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useConfigStore = create(
    persist(
        (set) => ({
            sheetUrl: '', // URL specific to the CSV export of the Google Sheet
            defaultMargin: 30, // Percentage
            vatRate: 21, // Percentage
            enableVatGlobal: false,

            setSheetUrl: (url) => set({ sheetUrl: url }),
            setDefaultMargin: (margin) => set({ defaultMargin: parseFloat(margin) }),
            setVatRate: (rate) => set({ vatRate: parseFloat(rate) }),
            setEnableVatGlobal: (enabled) => set({ enableVatGlobal: enabled }),
        }),
        {
            name: 'microhouse-config-storage',
        }
    )
);
