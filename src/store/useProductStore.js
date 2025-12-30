import { create } from 'zustand';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import Papa from 'papaparse';
import { useConfigStore } from './useConfigStore'; // Still used for sheetUrl? No, moved to Settings Store
import { useSettingsStore } from './useSettingsStore'; // New Store
import { useConsoleStore } from './useConsoleStore';
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
    loading: true,

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
                product.manualPrice,
                product.currency
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
                currency: product.currency || 'ARS',
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
                merged.manualPrice,
                merged.currency
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

    // DANGER: Delete ALL Products
    deleteAllProducts: async (onProgress) => {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const total = querySnapshot.size;
            if (total === 0) {
                toast.info("No hay productos para eliminar.");
                return;
            }

            const BATCH_SIZE = 450;
            const chunks = [];
            const docs = querySnapshot.docs;

            for (let i = 0; i < total; i += BATCH_SIZE) {
                chunks.push(docs.slice(i, i + BATCH_SIZE));
            }

            let deletedCount = 0;

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(docSnap => {
                    batch.delete(docSnap.ref);
                });
                await batch.commit();
                deletedCount += chunk.length;
                if (onProgress) onProgress(deletedCount, total);
            }

            set({ products: [] });
            toast.success(`Se eliminaron ${deletedCount} productos correctamente.`);
        } catch (error) {
            console.error("Error deleting all products:", error);
            toast.error(getFriendlyErrorMessage(error, "eliminar todo el inventario"));
            throw error;
        }
    },

    // Helper: Fetch Raw Data from Sheet (Shared)
    fetchSheetData: async () => {
        // Ensure settings are loaded
        const { settings } = useSettingsStore.getState();
        let { sheetUrl } = settings;

        if (!sheetUrl) {
            await useSettingsStore.getState().fetchSettings();
            sheetUrl = useSettingsStore.getState().settings.sheetUrl;
        }

        if (!sheetUrl) throw new Error("Falta URL de Google Sheets");

        const response = await fetch(sheetUrl);
        if (!response.ok) throw new Error("Error al descargar CSV");
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: false,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (err) => reject(err)
            });
        });
    },

    // New: Check for missing products (Sheet vs DB)
    getMissingProducts: async () => {
        try {
            const sheetRows = await get().fetchSheetData();
            const currentProducts = get().products;

            // Map current EANs/SKUs for O(1) lookup
            const localEans = new Set(
                currentProducts
                    .map(p => p.sku?.toString().trim())
                    .filter(ean => ean)
            );

            const missing = [];

            sheetRows.forEach(row => {
                // A: EAN, B: Title, C: Category, D: Price
                const ean = row[0] ? row[0].toString().trim() : '';
                const name = row[1] ? row[1].toString().trim() : '';
                const category = row[2] ? row[2].toString().trim().toUpperCase() : ''; // Col C is index 2
                const price = row[3] ? row[3].toString().trim() : ''; // Col D is index 3

                // Validation: Must have EAN and Name. 
                // Ignore empty rows or header rows
                const isHeader = ean.toLowerCase() === 'ean' || name.toLowerCase().includes('titulo');

                if (ean && name && !isHeader && !localEans.has(ean)) {
                    // Map Category to Console ID
                    let consoleId = '';
                    if (category.includes('PS5')) consoleId = 'ps5';
                    else if (category.includes('PS4')) consoleId = 'ps4';
                    else if (category.includes('NSW2') || category.includes('SWITCH 2') || category.includes('SW2')) consoleId = 'nsw2';
                    else if (category.includes('NSW') || category.includes('SWITCH')) consoleId = 'nsw';

                    missing.push({
                        sku: ean, // EAN stored in sku field
                        name,
                        price,
                        console: consoleId,
                        categoryRaw: category
                    });
                }
            });

            return missing;
        } catch (error) {
            console.error("Error checking missing:", error);
            toast.error("Error al comparar con la hoja de cálculo");
            return [];
        }
    },

    // Sync Logic with Cloud Processing (Optimized)
    syncPricesFromSheet: async () => {
        // FORCE FETCH SETTINGS to ensure we have the latest URL
        await useSettingsStore.getState().fetchSettings();

        const { settings } = useSettingsStore.getState();
        console.log("Checking syncPricesFromSheet exchangeRate:", settings.exchangeRate);
        const { sheetUrl, globalMargin, vatRate, enableVatGlobal, exchangeRate } = settings;

        if (!sheetUrl) {
            toast.error("Falta URL. Ve a Configuración.");
            throw new Error("No hay URL de Google Sheets configurada. Ve a Configuración y guarda la URL.");
        }

        // Default rate to 1 if missing/invalid to prevent NaN
        const validExchangeRate = (exchangeRate && !isNaN(exchangeRate) && exchangeRate > 0) ? parseFloat(exchangeRate) : 1;
        // Log for debugging
        if (validExchangeRate === 1) console.warn("Exchange Rate is 1 (Default). USD conversion might be disabled or unconfigured.");

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
                        let updatedByEan = 0;
                        let failedCount = 0;
                        let totalUpdated = 0;

                        // 1. OPTIMIZATION: Indexing the CSV Data for O(1) Lookup
                        // eanMap: Key = EAN (clean), Value = Row Data
                        const eanMap = new Map();

                        sheetData.forEach(row => {
                            // A: EAN, B: Title, C: Category, D: Price
                            const rawEan = row[0] ? row[0].toString().trim() : '';
                            const isHeader = rawEan.toLowerCase() === 'ean';

                            if (rawEan && !isHeader) eanMap.set(rawEan, row);
                        });

                        // 2. Prepare Updates
                        const updatesToCommit = []; // Array of { docRef, data }
                        const updatedProductsState = [...get().products];

                        updatedProductsState.forEach((product, index) => {
                            let matchedRow = null;
                            let newCost = 0;

                            // 1. EAN Lookup (O(1)) - Using 'sku' field to store EAN
                            if (product.sku && product.sku.trim() !== '') {
                                const cleanEan = product.sku.trim();
                                if (eanMap.has(cleanEan)) {
                                    matchedRow = eanMap.get(cleanEan);
                                }
                            }

                            // Process Match
                            if (matchedRow) {
                                // Cleaning: Index 3 = Cost (Col D) [ASSUMED USD IN SHEET]
                                const rawPrice = matchedRow[3] ? matchedRow[3].toString() : '';
                                const cleanPrice = rawPrice.replace(/[$. ]/g, '').replace(',', '.').trim();
                                const csvPriceUSD = parseFloat(cleanPrice);

                                if (!isNaN(csvPriceUSD) && csvPriceUSD > 0) {
                                    // SMART INFERENCE: If price < 2000, assume USD (matches Bulk Import logic)
                                    const isUSD = csvPriceUSD < 2000;
                                    const currency = isUSD ? 'USD' : 'ARS';
                                    const costToStore = csvPriceUSD; // Store Raw Value

                                    updatedByEan++;

                                    // CALCULATE FINAL PRICE CENTRALIZED
                                    const margin = (product.customMargin !== undefined && product.customMargin !== null)
                                        ? parseFloat(product.customMargin)
                                        : parseFloat(globalMargin);

                                    const { basePrice, finalPrice } = calculateProductPrice(
                                        costToStore,
                                        margin,
                                        product.discountPercentage || 0,
                                        settings,
                                        product.manualPrice,
                                        currency // PASS CURRENCY!
                                    );

                                    // Add to batch operations queue
                                    const docRef = doc(db, "products", product.id);
                                    updatesToCommit.push({
                                        ref: docRef,
                                        data: {
                                            costPrice: costToStore,
                                            currency: currency, // Persist inferred currency
                                            price: finalPrice,
                                            basePrice: basePrice,
                                            stock: true, // Re-enable stock
                                            lastUpdated: new Date()
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
                            } else {
                                // NOT FOUND IN SHEET (Provider removed it) => SET STOCK = FALSE
                                // Only update if currently in stock to save writes/reads
                                if (product.stock === true) {
                                    const docRef = doc(db, "products", product.id);
                                    updatesToCommit.push({
                                        ref: docRef,
                                        data: {
                                            stock: false, // Mark as Out of Stock
                                            lastUpdated: new Date()
                                        }
                                    });

                                    updatedProductsState[index] = {
                                        ...product,
                                        stock: false
                                    };
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
                            updated: updatedByEan,
                            total: sheetData.length,
                            details: {
                                bySku: updatedByEan,
                                byName: 0, // Disabled name matching for EAN mode
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

    },

    // Bulk Import Action
    bulkImportProducts: async (productsToImport, onProgress) => {
        try {
            const { settings } = useSettingsStore.getState();
            const { globalMargin, enableVatGlobal, vatRate, exchangeRate } = settings;
            const collectionRef = collection(db, "products");

            const validExchangeRate = (exchangeRate && !isNaN(exchangeRate) && exchangeRate > 0) ? parseFloat(exchangeRate) : 1;

            let count = 0;
            const total = productsToImport.length;
            const CHUNK_SIZE = 450;

            // Process in chunks
            const chunks = [];
            for (let i = 0; i < total; i += CHUNK_SIZE) {
                chunks.push(productsToImport.slice(i, i + CHUNK_SIZE));
            }

            for (const chunk of chunks) {
                const currentBatch = writeBatch(db);

                chunk.forEach(product => {
                    const docRef = doc(collectionRef);

                    // 1. Calculate Price
                    const margin = product.customMargin || globalMargin;
                    const { basePrice, finalPrice } = calculateProductPrice(
                        product.costPrice,
                        margin,
                        product.discountPercentage || 0,
                        settings,
                        product.manualPrice,
                        product.currency || 'ARS'
                    );

                    // 2. Slug
                    const slug = slugify(product.title);

                    // 3. Prepare Data
                    const dataToSave = {
                        title: product.title,
                        supplierName: product.supplierName || product.title,
                        sku: product.sku || '',
                        costPrice: parseFloat(product.costPrice) || 0,
                        currency: product.currency || 'ARS',
                        price: finalPrice,
                        basePrice: basePrice,
                        manualPrice: product.manualPrice || '',
                        slug: slug,
                        stock: true,
                        console: product.console || '',
                        image: product.image || '',
                        trailerUrl: product.trailerUrl || '',
                        description: product.description || '',
                        tags: product.tags || [],
                        createdAt: new Date().toISOString(),
                        isHidden: false
                    };

                    Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

                    currentBatch.set(docRef, dataToSave);
                    count++;
                });

                await currentBatch.commit();

                // Report Progress
                if (onProgress) onProgress(count, total);
            }

            await get().fetchProducts();

            toast.success(`${count} productos importados correctamente`);
            return count;
        } catch (error) {
            console.error("Bulk Import Error:", error);
            toast.error("Error en importación masiva");
            throw error;
        }
    },

    recalculatePrices: async () => {
        const { fetchSettings, settings } = useSettingsStore.getState();
        set({ loading: true });
        try {
            // 1. Ensure latest settings
            await fetchSettings();
            // 2. Get all products (fresh)
            const querySnapshot = await getDocs(collection(db, "products"));
            const allProducts = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            const updates = [];

            allProducts.forEach(product => {
                const { basePrice, finalPrice } = calculateProductPrice(
                    product.costPrice,
                    product.customMargin,
                    product.discountPercentage,
                    settings, // Uses updated settings
                    product.manualPrice,
                    product.currency || 'ARS'
                );

                // Only update if changed
                if (product.price !== finalPrice || product.basePrice !== basePrice) {
                    updates.push({
                        id: product.id,
                        price: finalPrice,
                        basePrice: basePrice
                    });
                }
            });

            if (updates.length === 0) {
                toast.info("Precios ya actualizados.");
                set({ loading: false });
                return;
            }

            // 3. Batch Updates
            const BATCH_SIZE = 450;
            const chunks = [];
            for (let i = 0; i < updates.length; i += BATCH_SIZE) {
                chunks.push(updates.slice(i, i + BATCH_SIZE));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(update => {
                    const ref = doc(db, "products", update.id);
                    batch.update(ref, {
                        price: update.price,
                        basePrice: update.basePrice
                    });
                });
                await batch.commit();
            }

            // 4. Update local state
            await get().fetchProducts();
            toast.success(`Precios recalculados para ${updates.length} productos.`);

        } catch (error) {
            console.error(error);
            toast.error("Error recalculando precios globales");
        } finally {
            set({ loading: false });
        }
    }
}));
