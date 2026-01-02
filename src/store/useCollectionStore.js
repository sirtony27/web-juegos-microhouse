import { create } from 'zustand';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

export const useCollectionStore = create((set, get) => ({
    collections: [],
    loading: false,

    fetchCollections: async () => {
        set({ loading: true });
        try {
            const querySnapshot = await getDocs(collection(db, "collections"));
            const collectionsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            // If empty, we could seed, but for now just empty array
            set({ collections: collectionsData, loading: false });
        } catch (error) {
            console.error("Error fetching collections:", error);
            // toast.error("Error al cargar colecciones"); 
            // Silent error better for public home page? Or maybe toast.
            set({ loading: false });
        }
    },

    addCollection: async (collectionData) => {
        try {
            const docRef = await addDoc(collection(db, "collections"), collectionData);

            set((state) => ({
                collections: [...state.collections, { ...collectionData, id: docRef.id }]
            }));
            toast.success('Colección creada');
        } catch (error) {
            console.error("Error adding collection:", error);
            toast.error("Error al guardar colección");
        }
    },

    deleteCollection: async (id) => {
        try {
            await deleteDoc(doc(db, "collections", id));
            set((state) => ({
                collections: state.collections.filter(c => c.id !== id)
            }));
            toast.success('Colección eliminada');
        } catch (error) {
            console.error("Error deleting collection:", error);
            toast.error("Error al eliminar");
        }
    }
}));
