import { create } from 'zustand';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

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
    syncingExchange: false,

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
            toast.error("Error al cargar configuración", { id: 'settings-fetch-error' });
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
            if (!newSettings._silent) toast.success("Configuración actualizada", { id: 'settings-update-success' });
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("Error al guardar configuración", { id: 'settings-update-error' });
        }
    },

    syncExchangeRate: async (force = false) => {
        const { settings, updateSettings, syncingExchange } = get();

        // Prevent parallel syncs
        if (syncingExchange && !force) return;

        // If not auto and not forced, do nothing
        if (!settings.autoExchangeRate && !force) return;

        set({ syncingExchange: true });

        const source = settings.autoExchangeSource || 'blue';

        try {
            const res = await fetch(`https://dolarapi.com/v1/dolares/${source}`);
            const data = await res.json();

            if (data && data.venta) {
                const currentRate = parseFloat(settings.exchangeRate);
                const newRate = parseFloat(data.venta);

                // If rate changed or it's a forced check (initial sync might want to verify)
                if (currentRate !== newRate) {
                    console.log(`[AutoSync] Updating Dollar ${source}: ${currentRate} -> ${newRate}`);

                    await updateSettings({
                        exchangeRate: newRate,
                        lastExchangeUpdate: new Date().toISOString(),
                        _silent: !force
                    });

                    toast.success(`Dólar (${source}) actualizado: $${newRate}`, { id: 'dollar-update-success' });
                } else if (force) {
                    toast.info(`Dólar (${source}) sin cambios: $${newRate}`, { id: 'dollar-update-info' });
                }
            }
        } catch (error) {
            console.error("Error syncing dollar:", error);
            if (force) toast.error("Error al sincronizar dólar", { id: 'dollar-sync-error' });
        } finally {
            set({ syncingExchange: false });
        }
    }
}));
