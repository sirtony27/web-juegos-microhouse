import { create } from 'zustand';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import Papa from 'papaparse';
import { useConfigStore } from './useConfigStore'; // Still used for sheetUrl? No, moved to Settings Store
import { useSettingsStore } from './useSettingsStore'; // New Store
import { toast } from 'sonner';
import { calculateProductPrice } from '../utils/pricingUtils';


// Helper for slugs
const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
};

// Helper for Friendly Error Messages
const getFriendlyErrorMessage = (error, context) => {
    console.error(`Error in ${context}:`, error);

    // Firebase Error Codes Map
    const errorMessages = {
        'permission-denied': 'No tienes permisos para realizar esta acción.',
        'unavailable': 'Sin conexión a internet. Verificá tu red.',
        'not-found': 'El documento solicitado no existe.',
        'already-exists': 'El documento ya existe.',
        'data-loss': 'Hubo una pérdida de datos irrecuperable.',
        'resource-exhausted': 'Se excedió la cuota de uso del sistema.'
    };

    if (error.code && errorMessages[error.code]) {
        return errorMessages[error.code];
    }

    // Fallback for generic errors
    return error.message || `Ocurrió un error inesperado al ${context}.`;
};

export const useProductStore = create((set, get) => ({
    products: [],
    loading: false,

    fetchProducts: async () => {
        set({ loading: true });
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const productsData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                // Inject generated slug if missing for immediate backward compatibility
                return {
                    ...data,
                    id: doc.id,
                    slug: data.slug || slugify(data.title || '')
                };
            });
            set({ products: productsData, loading: false });
        } catch (error) {
            toast.error(getFriendlyErrorMessage(error, "cargar productos"));
            set({ loading: false });
        }
    },

    addProduct: async (product) => {
        try {
            const { settings } = useSettingsStore.getState();
            // Calculate prices before saving
            const { basePrice, finalPrice } = calculateProductPrice(
                product.costPrice,
                product.customMargin,
                product.discountPercentage,
                settings,
                product.manualPrice
            );

            // Generate slug
            const slug = product.slug || slugify(product.title);

            const { id, manualPrice, ...data } = product; // Remove temp fields

            // Clean undefined values
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== undefined)
            );

            const docRef = await addDoc(collection(db, "products"), {
                ...cleanData,
                price: finalPrice,
                basePrice: basePrice,
                slug,
                manualPrice, // Persist manual override
                supplierName: data.supplierName || data.title,
                sku: data.sku || '',
                costPrice: parseFloat(data.costPrice) || 0,
                createdAt: new Date().toISOString()
            });

            const newProduct = {
                ...cleanData,
                id: docRef.id,
                price: finalPrice,
                basePrice,
                slug,
                manualPrice,
                costPrice: parseFloat(data.costPrice) || 0
            };

            set(state => ({ products: [...state.products, newProduct] }));
            toast.success("Producto agregado correctamente");
        } catch (error) {
            toast.error(getFriendlyErrorMessage(error, "agregar el producto"));
        }
    },

    updateProduct: async (id, updates) => {
        try {
            const { settings } = useSettingsStore.getState();

            // Get current product to merge logic
            const currentProduct = get().products.find(p => p.id === id);
            if (!currentProduct) {
                toast.error("Producto no encontrado localmente.");
                return;
            }

            const merged = { ...currentProduct, ...updates };

            const { basePrice, finalPrice } = calculateProductPrice(
                merged.costPrice,
                merged.customMargin,
                merged.discountPercentage,
                settings,
                merged.manualPrice
            );

            // Update slug if title changed, unless slug is manually provided? 
            // For now, auto-update slug if title changes to keep it fresh
            let slug = updates.slug || currentProduct.slug;
            if (updates.title && updates.title !== currentProduct.title) {
                slug = slugify(updates.title);
            }
            if (!slug) slug = slugify(merged.title);

            const { id: _, ...dataToSave } = updates; // Exclude ID from update data

            const updateData = {
                ...dataToSave,
                price: finalPrice,
                basePrice: basePrice,
                slug
            };

            const docRef = doc(db, "products", id);
            await updateDoc(docRef, updateData);

            set(state => ({
                products: state.products.map(p => (p.id === id ? { ...p, ...updateData } : p))
            }));

            toast.success("Producto actualizado correctamente");
        } catch (error) {
            toast.error(getFriendlyErrorMessage(error, "actualizar el producto"));
        }
    },

    toggleVisibility: async (id) => {
        try {
            const product = get().products.find(p => p.id === id);
            if (!product) return;

            const newStatus = !product.isHidden;
            await updateDoc(doc(db, "products", id), { isHidden: newStatus });

            set((state) => ({
                products: state.products.map(p => p.id === id ? { ...p, isHidden: newStatus } : p)
            }));
        } catch (error) {
            toast.error(getFriendlyErrorMessage(error, "cambiar la visibilidad"));
        }
    },

    deleteProduct: async (id) => {
        try {
            await deleteDoc(doc(db, "products", id));
            set((state) => ({
                products: state.products.filter(p => p.id !== id)
            }));
            toast.success("Producto eliminado");
        } catch (error) {
            toast.error(getFriendlyErrorMessage(error, "eliminar el producto"));
        }
    },

    // Sync Logic with Cloud Processing (Optimized)
    syncPricesFromSheet: async () => {
        // FORCE FETCH SETTINGS to ensure we have the latest URL
        await useSettingsStore.getState().fetchSettings();

        const { settings } = useSettingsStore.getState();
        const { sheetUrl, globalMargin, vatRate, enableVatGlobal } = settings;

        if (!sheetUrl) {
            toast.error("Falta URL. Ve a Configuración.");
            throw new Error("No hay URL de Google Sheets configurada. Ve a Configuración y guarda la URL.");
        }

        try {
            const response = await fetch(sheetUrl);
            if (!response.ok) throw new Error(`Error ${response.status}: No se pudo descargar el CSV`);
            const csvText = await response.text();

            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: false,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        const sheetData = results.data;
                        let updatedBySku = 0;
                        let updatedByName = 0;
                        let failedCount = 0;
                        let totalUpdated = 0;

                        // 1. OPTIMIZATION: Indexing the CSV Data for O(1) Lookup
                        // skuMap: Key = SKU (clean), Value = Row Data
                        // nameMap: Key = Name (lowercase), Value = Row Data
                        const skuMap = new Map();
                        const nameMap = new Map();

                        sheetData.forEach(row => {
                            const rawSku = row[0] ? row[0].toString().trim() : '';
                            const rawName = row[1] ? row[1].toString().trim().toLowerCase() : '';

                            if (rawSku) skuMap.set(rawSku, row);
                            if (rawName && !nameMap.has(rawName)) nameMap.set(rawName, row);
                        });

                        // 2. Prepare Updates
                        const updatesToCommit = []; // Array of { docRef, data }
                        const updatedProductsState = [...get().products];

                        updatedProductsState.forEach((product, index) => {
                            let matchedRow = null;
                            let matchType = null;
                            let newCost = 0;
                            let newFinalPrice = 0;

                            // 1. SKU Lookup (O(1))
                            if (product.sku && product.sku.trim() !== '') {
                                const cleanSku = product.sku.trim();
                                if (skuMap.has(cleanSku)) {
                                    matchedRow = skuMap.get(cleanSku);
                                    matchType = 'SKU';
                                }
                            }

                            // 2. Name Lookup (O(1)) - Fallback
                            if (!matchedRow) {
                                const searchName = (product.supplierName || product.title || '').trim().toLowerCase();
                                if (nameMap.has(searchName)) {
                                    matchedRow = nameMap.get(searchName);
                                    matchType = 'NAME';
                                }
                            }

                            // Process Match
                            if (matchedRow) {
                                // Cleaning: Index 2 = Cost
                                const rawPrice = matchedRow[2] ? matchedRow[2].toString() : '';
                                const cleanPrice = rawPrice.replace(/[$. ]/g, '').replace(',', '.').trim();
                                const csvPrice = parseFloat(cleanPrice);

                                if (!isNaN(csvPrice) && csvPrice > 0) {
                                    newCost = csvPrice;

                                    if (matchType === 'SKU') updatedBySku++;
                                    if (matchType === 'NAME') updatedByName++;

                                    // CALCULATE FINAL PRICE
                                    const margin = (product.customMargin !== undefined && product.customMargin !== null)
                                        ? parseFloat(product.customMargin)
                                        : parseFloat(globalMargin);

                                    let basePrice = newCost * (1 + (margin / 100));

                                    // Apply VAT if enabled
                                    const applyVat = product.applyVat ?? enableVatGlobal;
                                    if (applyVat) {
                                        basePrice = basePrice * (1 + (parseFloat(vatRate) / 100));
                                    }

                                    // Round Base Price
                                    basePrice = Math.ceil(basePrice / 100) * 100;

                                    // Apply Discount if exists
                                    let finalPrice = basePrice;
                                    if (product.discountPercentage && product.discountPercentage > 0) {
                                        const discountFactor = 1 - (parseFloat(product.discountPercentage) / 100);
                                        finalPrice = basePrice * discountFactor;
                                        // Round again after discount
                                        finalPrice = Math.ceil(finalPrice / 100) * 100;
                                    }

                                    // Add to batch operations queue
                                    const docRef = doc(db, "products", product.id);
                                    updatesToCommit.push({
                                        ref: docRef,
                                        data: {
                                            costPrice: newCost,
                                            price: finalPrice, // This is the effective selling price
                                            basePrice: basePrice // We store the price BEFORE discount to show strikethrough
                                        }
                                    });

                                    // Update local state copy
                                    updatedProductsState[index] = {
                                        ...product,
                                        costPrice: newCost,
                                        price: finalPrice,
                                        basePrice: basePrice
                                    };
                                } else {
                                    failedCount++; // Found but invalid price
                                }
                            }
                        });

                        // 3. BATCH CHUNKING MECHANISM
                        // Firestore limit is 500 writes per batch. We use 450 to be safe.
                        const BATCH_SIZE = 450;
                        const totalBatches = Math.ceil(updatesToCommit.length / BATCH_SIZE);

                        // Execute batches sequentially
                        for (let i = 0; i < totalBatches; i++) {
                            const batch = writeBatch(db);
                            const chunk = updatesToCommit.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

                            chunk.forEach(update => {
                                batch.update(update.ref, update.data);
                            });

                            await batch.commit();
                            totalUpdated += chunk.length;
                        }

                        // Update local state ONCE after all batches succeed
                        if (totalUpdated > 0) {
                            set({ products: updatedProductsState });
                        }

                        // [NEW] Persist Last Sync Time
                        const syncTime = new Date().toISOString();
                        const settingsRef = doc(db, "settings", "global");
                        // We use setDoc with merge to be safe, or updateDoc
                        updateDoc(settingsRef, { lastSync: syncTime }).catch(err => console.error("Error saving sync time:", err));
                        // Update local settings store slightly to reflect this? 
                        // It's fine, next fetch will get it.

                        resolve({
                            updated: updatedBySku + updatedByName,
                            total: sheetData.length,
                            details: {
                                bySku: updatedBySku,
                                byName: updatedByName,
                                failed: failedCount
                            }
                        });
                    },
                    error: (err) => reject(err)
                });
            });

        } catch (error) {
            console.error("Sync Error:", error);
            throw error;
        }
    }
}));
