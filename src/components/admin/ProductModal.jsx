import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { useConsoleStore } from '../../store/useConsoleStore';
import { useSettingsStore } from '../../store/useSettingsStore';

const GENRES = [
    "Acción", "Aventura", "RPG", "FPS (Shooter)",
    "Deportes", "Carreras", "Pelea", "Estrategia",
    "Terror", "Simulación", "Infantil", "Mundo Abierto"
];

const ProductModal = ({ isOpen, onClose, productToEdit }) => {
    const { register, handleSubmit, reset, setValue, watch } = useForm();
    // Watch values for live preview
    const watchedValues = watch();

    // Live Price Calculation
    const getLivePrice = () => {
        const cost = parseFloat(watchedValues.costPrice) || 0;
        const margin = parseFloat(watchedValues.customMargin); // might be NaN
        const discount = parseFloat(watchedValues.discountPercentage) || 0;
        const manual = parseFloat(watchedValues.manualPrice) || 0;

        // We can't easily access global settings here without subscribing to the store directly
        // or passing them in. For now, let's assume global margin if custom is empty.
        // Actually, we can fetch them from the store hook.
        const { settings } = useSettingsStore(); // This hook usage inside render is fine in Zustand

        let basePrice = 0;
        if (manual > 0) {
            basePrice = manual;
        } else {
            const validMargin = (!isNaN(margin)) ? margin : (parseFloat(settings?.globalMargin) || 30);
            basePrice = cost * (1 + (validMargin / 100));

            if (settings?.enableVatGlobal) {
                basePrice = basePrice * (1 + (parseFloat(settings?.vatRate || 21) / 100));
            }
        }

        basePrice = Math.ceil(basePrice / 100) * 100;

        let finalPrice = basePrice;
        if (discount > 0) {
            finalPrice = basePrice * (1 - (discount / 100));
            finalPrice = Math.ceil(finalPrice / 100) * 100;
        }

        return { basePrice, finalPrice };
    };

    const livePrice = getLivePrice();
    const { addProduct, updateProduct } = useProductStore();
    const { consoles } = useConsoleStore();

    // Watch tags to handle visual state if needed, though we manage selection locally for UI then sync to form
    const [selectedGenres, setSelectedGenres] = useState([]);

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                // Populate form
                Object.keys(productToEdit).forEach(key => {
                    setValue(key, productToEdit[key]);
                });

                // Parse tags for local state
                if (Array.isArray(productToEdit.tags)) {
                    setSelectedGenres(productToEdit.tags);
                    setValue('tags', productToEdit.tags.join(',')); // Keep hidden input synced for safety if used
                } else if (typeof productToEdit.tags === 'string') {
                    const tagsArray = productToEdit.tags.split(',').map(t => t.trim()).filter(Boolean);
                    setSelectedGenres(tagsArray);
                    setValue('tags', productToEdit.tags);
                }
            } else {
                reset({
                    sku: '',
                    supplierName: '',
                    title: '',
                    price: '',
                    manualPrice: '',
                    stock: true,
                    console: consoles.find(c => c.active)?.id || '',
                    image: '',
                    trailerUrl: '',
                    customMargin: '',
                    discountPercentage: '',
                    tags: ''
                });
                setSelectedGenres([]);
            }
        }
    }, [isOpen, productToEdit, reset, setValue, consoles]);

    const toggleGenre = (genre) => {
        const newGenres = selectedGenres.includes(genre)
            ? selectedGenres.filter(g => g !== genre)
            : [...selectedGenres, genre];

        setSelectedGenres(newGenres);
        // Sync with form data (as comma separated string to match backend expectations roughly)
        // actually, let's store it properly in the form
    };

    const extractYoutubeId = (url) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : '';
    };

    const onSubmit = (data) => {
        // Process Data
        const processed = {
            ...data,
            // 'price' in DB is calculated. We use 'manualPrice' field for overrides.
            manualPrice: data.manualPrice ? parseFloat(data.manualPrice) : 0,
            customMargin: data.customMargin ? parseFloat(data.customMargin) : null,
            discountPercentage: data.discountPercentage ? parseFloat(data.discountPercentage) : 0,
            costPrice: data.costPrice ? parseFloat(data.costPrice) : 0,
            stock: data.stock === 'true' || data.stock === true,
            trailerId: extractYoutubeId(data.trailerUrl),
            // Use local state for tags to ensure pills selection is respected
            tags: selectedGenres
        };

        if (productToEdit) {
            updateProduct(productToEdit.id, processed);
        } else {
            addProduct({ ...processed, id: Date.now().toString() });
        }
        onClose();
    };

    if (!isOpen) return null;

    // Common input styles for consistency
    const inputClasses = "form-input text-sm"; // Use global form-input
    const labelClasses = "block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-brand-dark">
                            {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Completa los detalles del juego</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                        {/* LEFT COLUMN: Visuals & Core Info */}
                        <div className="space-y-6">

                            {/* Image Preview & Title Section */}
                            <div className="flex gap-6 items-start">
                                <div className="w-32 h-44 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm relative group">
                                    {watch('image') ? (
                                        <img src={watch('image')} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ImageIcon size={32} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-grow space-y-4">
                                    <div>
                                        <label className={labelClasses}>Título del Juego</label>
                                        <input {...register('title', { required: true })} className={inputClasses} placeholder="Ej: God of War Ragnarök" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Consola</label>
                                            <select {...register('console')} className={inputClasses}>
                                                {consoles.filter(c => c.active).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Stock</label>
                                            <select {...register('stock')} className={inputClasses}>
                                                <option value="true">Disponible</option>
                                                <option value="false">Agotado</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* URLs & Identifiers */}
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>SKU / Código</label>
                                        <input {...register('sku')} className={inputClasses} placeholder="Ej: PS5000118" />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Proveedor (Ref)</label>
                                        <input {...register('supplierName')} className={inputClasses} placeholder="Nombre interno" />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClasses}>URL Imagen</label>
                                    <div className="relative">
                                        <input {...register('image')} className={`${inputClasses} pl-8`} placeholder="https://..." />
                                        <ImageIcon size={14} className="absolute left-2.5 top-3 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClasses}>Trailer (YouTube)</label>
                                    <input {...register('trailerUrl')} className={inputClasses} placeholder="https://youtube.com/..." />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Pricing & Metadata */}
                        <div className="space-y-6">

                            {/* Pricing Card */}
                            <div className="bg-brand-bg/5 p-6 rounded-xl border border-brand-dark/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <span className="text-6xl font-bold text-brand-dark">$</span>
                                </div>

                                <h3 className="text-sm font-bold text-brand-dark mb-5 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Estrategia de Precios
                                </h3>

                                <div className="space-y-5">
                                    {/* Row 1: Cost & Margin */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Costo (Prov.)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                                                <input type="number" {...register('costPrice')} className={`${inputClasses} pl-7`} placeholder="0" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Margen (%)</label>
                                            <input type="number" step="0.1" {...register('customMargin')} className={inputClasses} placeholder="Global (30%)" />
                                        </div>
                                    </div>

                                    {/* Row 2: Manual Price & Discount */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Precio Manual</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                                                <input type="number" {...register('manualPrice')} className={`${inputClasses} pl-7 bg-yellow-50 border-yellow-200`} placeholder="Opcional" />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">Sobrescribe costo+margen</p>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Descuento (%)</label>
                                            <input type="number" step="1" {...register('discountPercentage')} className={inputClasses} placeholder="0" />
                                            <p className="text-[10px] text-gray-400 mt-1">Se aplica al final</p>
                                        </div>
                                    </div>

                                    {/* Preview Box */}
                                    <div className="mt-4 pt-4 border-t border-gray-200/50 flex flex-col gap-1 items-end">
                                        <div className="text-xs text-gray-500">Precio Final Calculado:</div>
                                        <div className="flex items-baseline gap-2">
                                            {watchedValues.discountPercentage > 0 && (
                                                <span className="text-sm text-gray-400 line-through decoration-1">
                                                    ${livePrice.basePrice.toLocaleString()}
                                                </span>
                                            )}
                                            <span className="text-2xl font-bold text-brand-dark">
                                                ${livePrice.finalPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Genres Pills */}
                            <div>
                                <label className={labelClasses}>Géneros (Etiquetas)</label>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-[180px] overflow-y-auto custom-scrollbar">
                                    <div className="flex flex-wrap gap-2">
                                        {GENRES.map(genre => (
                                            <button
                                                key={genre}
                                                type="button"
                                                onClick={() => toggleGenre(genre)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedGenres.includes(genre)
                                                    ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white'
                                                    }`}
                                            >
                                                {genre}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <input type="hidden" {...register('tags')} />
                            </div>

                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-xs text-gray-400 italic">
                        * Los cambios impactan inmediatamente en la tienda.
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors text-sm">
                            Cancelar
                        </button>
                        <button onClick={handleSubmit(onSubmit)} className="px-8 py-2.5 rounded-lg bg-brand-red text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20 text-sm flex items-center gap-2">
                            <Save size={18} /> Guardar Cambios
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductModal;
