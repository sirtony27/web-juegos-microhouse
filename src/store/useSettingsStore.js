import { create } from 'zustand';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

// ... imports

export const useSettingsStore = create((set, get) => ({
    settings: {
        globalMargin: 30, // Default
        vatRate: 21,    // Default
        sheetUrl: '',
        enableVatGlobal: false,
        exchangeRate: 1200, // Default manual rate
        autoExchangeRate: false,
        autoExchangeSource: 'blue', // Default source
        lastExchangeUpdate: null
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
                    enableVatGlobal: false,
                    exchangeRate: 1200,
                    autoExchangeRate: false,
                    autoExchangeSource: 'blue',
                    lastExchangeUpdate: null
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
            console.log("Saving Settings to Firestore:", newSettings);
            const docRef = doc(db, "settings", "global");

            // Clean internal flags before saving
            const settingsToSave = { ...newSettings };
            delete settingsToSave._silent;

            // Use setDoc with merge: true to ensure we create/update fields without failing
            await setDoc(docRef, settingsToSave, { merge: true });

            set(state => ({
                settings: { ...state.settings, ...settingsToSave }
            }));
            // Only show toast if it comes from user interaction (not silent background update)
            if (!newSettings._silent) toast.success("Configuración actualizada");
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("Error al guardar configuración");
        }
    },

    syncExchangeRate: async (force = false) => {
        const { settings, updateSettings } = get();

        // If not auto and not forced, do nothing
        if (!settings.autoExchangeRate && !force) return;

        const source = settings.autoExchangeSource || 'blue';

        try {
            const res = await fetch(`https://dolarapi.com/v1/dolares/${source}`);
            const data = await res.json();

            if (data && data.venta) {
                const currentRate = parseFloat(settings.exchangeRate);
                const newRate = parseFloat(data.venta);

                // If rate changed or it's a forced check (initial sync might want to verify)
                // We update if difference is significant or simply if different to keep strict sync?
                // Given volatility, let's update if unequal.
                if (currentRate !== newRate) {
                    console.log(`[AutoSync] Updating Dollar ${source}: ${currentRate} -> ${newRate}`);

                    await updateSettings({
                        exchangeRate: newRate,
                        lastExchangeUpdate: new Date().toISOString(),
                        _silent: !force // Silent if background auto-sync, loud if forced by user? 
                        // Actually updates triggered by Dashboard mount should be semi-silent (maybe a toast is good)
                        // Let's rely on updateSettings logic.
                        // If triggered by Dashboard, we want the user to know ONLY if it changed.
                    });

                    // If it was a silent update (background), maybe sound a small toast?
                    // UpdateSettings only toasts if !_silent. 
                    // Let's explicitly toast here if we want to user to know "Hey, dollar updated!"
                    toast.success(`Dólar (${source}) actualizado: $${newRate}`);
                } else if (force) {
                    toast.info(`Dólar (${source}) sin cambios: $${newRate}`);
                }
            }
        } catch (error) {
            console.error("Error syncing dollar:", error);
            if (force) toast.error("Error al sincronizar dólar");
        }
    }
}));
