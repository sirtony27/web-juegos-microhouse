import { create } from 'zustand';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

export const useConsoleStore = create((set, get) => ({
    consoles: [],
    loading: false,

    fetchConsoles: async () => {
        set({ loading: true });
        try {
            const querySnapshot = await getDocs(collection(db, "consoles"));
            const consolesData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            // Should filter or sort if needed
            set({ consoles: consolesData, loading: false });
        } catch (error) {
            console.error("Error fetching consoles:", error);
            toast.error("Error al cargar consolas");
            set({ loading: false });
        }
    },

    addConsole: async (name, iconUrl = '') => {
        try {
            // Simplified ID checks or backend auto-ID. 
            // Prompt implied "addDoc" which generates Auto-ID usually, 
            // but previous store used custom slugs as IDs (ps5, switch).
            // For stability with current design (active console filters), manual ID preference logic?
            // Actually prompt said "addConsole (addDoc)". I will follow prompt standard Firestore auto-ID 
            // BUT UI expects certain IDs for filtering?
            // "id: name.toLowerCase()..." was used.
            // Let's use custom ID if possible or just adapt UI to use generated IDs.
            // Given the existing UI filters by 'ps5'/'ps4', usage of custom IDs 'ps5' is critical for icon mapping in Home.jsx.
            // I'll try to stick to "setDoc" with custom ID or use "addDoc" and let ID be random?
            // User prompt said simply: "Implement fetchConsoles, addConsole (addDoc), deleteConsole (deleteDoc)."
            // Using addDoc generates random IDs. This breaks `Home.jsx` hardcoded icons (getConsoleDetails switch case).
            // I will implement "add" logic but using setDoc with generated slug ID to preserve keeping readable IDs if possible, 
            // OR I'll assume users know they will get random IDs.
            // Wait, standard Firestore is addDoc. I'll use addDoc but store a "slug" field?
            // Simpler: Just use addDoc. The UI in Home.jsx fallback to Generic icon if ID doesn't match ps5/ps4.

            // Correction: The prompt specifically said "addConsole (addDoc)". I will trust the prompt.
            // Ideally I should refactor Home.jsx to not rely on hardcoded IDs, but for now I'll just adhere to Firestore migration.

            const newConsole = { name, iconUrl, active: true };
            const docRef = await addDoc(collection(db, "consoles"), newConsole);

            // Modify local state
            set((state) => ({
                consoles: [...state.consoles, { ...newConsole, id: docRef.id }]
            }));
            toast.success("Consola agregada");
        } catch (error) {
            console.error("Error adding console:", error);
            toast.error("Error al agregar consola");
        }
    },

    updateConsole: async (id, updates) => {
        try {
            const consoleRef = doc(db, "consoles", id);
            await updateDoc(consoleRef, updates);

            set((state) => ({
                consoles: state.consoles.map(c => c.id === id ? { ...c, ...updates } : c)
            }));
            toast.success("Consola actualizada");
        } catch (error) {
            console.error("Error updating console:", error);
            toast.error("Error al actualizar consola");
        }
    },

    deleteConsole: async (id) => {
        try {
            await deleteDoc(doc(db, "consoles", id));
            set((state) => ({
                consoles: state.consoles.filter(c => c.id !== id)
            }));
            toast.success("Consola eliminada");
        } catch (error) {
            console.error("Error deleting console:", error);
            toast.error("Error al eliminar consola");
        }
    },

    toggleConsole: async (id) => {
        try {
            const consoleItem = get().consoles.find(c => c.id === id);
            if (!consoleItem) return;

            const newStatus = !consoleItem.active;
            const consoleRef = doc(db, "consoles", id);
            await updateDoc(consoleRef, { active: newStatus });

            set((state) => ({
                consoles: state.consoles.map(c =>
                    c.id === id ? { ...c, active: newStatus } : c
                )
            }));
        } catch (error) {
            console.error("Error toggling console:", error);
            toast.error("Error al cambiar estado");
        }
    }
}));
