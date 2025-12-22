import { create } from 'zustand';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export const useSettingsStore = create((set) => ({
    settings: {
        globalMargin: 30, // Default
        vatRate: 21,    // Default
        sheetUrl: '',
        enableVatGlobal: false
    },
    loading: false,

    fetchSettings: async () => {
        set({ loading: true });
        try {
            const docRef = doc(db, "settings", "global");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                set({ settings: docSnap.data(), loading: false });
            } else {
                // Initialize defaults if not exists
                const defaultSettings = {
                    globalMargin: 30,
                    vatRate: 21,
                    sheetUrl: '',
                    enableVatGlobal: false
                };
                await setDoc(docRef, defaultSettings);
                set({ settings: defaultSettings, loading: false });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Error al cargar configuración");
            set({ loading: false });
        }
    },

    updateSettings: async (newSettings) => {
        try {
            const docRef = doc(db, "settings", "global");
            await updateDoc(docRef, newSettings);
            set({ settings: newSettings });
            toast.success("Configuración actualizada");
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("Error al guardar configuración");
        }
    }
}));
