import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Image as ImageIcon, Search, Loader, Wand2, CheckCircle2 } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { useConsoleStore } from '../../store/useConsoleStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { searchGame, getGameDetails } from '../../services/gameService';

const GENRES = [
    "Acción", "Aventura", "RPG", "FPS (Shooter)",
    "Deportes", "Carreras", "Pelea", "Estrategia",
    "Terror", "Simulación", "Infantil", "Mundo Abierto"
];

const GENRE_TRANSLATION = {
    'Action': 'Acción',
    'Adventure': 'Aventura',
    'Role-playing (RPG)': 'RPG',
    'Shooter': 'FPS (Shooter)',
    'Sport': 'Deportes',
    'Racing': 'Carreras',
    'Fighting': 'Pelea',
    'Strategy': 'Estrategia',
    'Real Time Strategy (RTS)': 'Estrategia',
    'Turn-based strategy (TBS)': 'Estrategia',
    'Simulator': 'Simulación',
    'Puzzle': 'Infantil', // Approximation
    'Platform': 'Aventura',
    'Hack and slash/Beat \'em up': 'Acción',
    'Visual Novel': 'Aventura',
    'Indie': 'Indie'
};

const ProductModal = ({ isOpen, onClose, productToEdit, onSuccess }) => {
    const { register, handleSubmit, reset, setValue, watch, getValues } = useForm();
    const { settings } = useSettingsStore();
    // Watch values for live preview
    const watchedValues = watch();

    // Currency State for Input Helper
    const [currency, setCurrency] = useState('ARS');

    // Live Price Calculation
    const getLivePrice = () => {
        const cost = parseFloat(watchedValues.costPrice) || 0;
        const margin = parseFloat(watchedValues.customMargin); // might be NaN
        const discount = parseFloat(watchedValues.discountPercentage) || 0;
        const manual = parseFloat(watchedValues.manualPrice) || 0;

        const exRate = parseFloat(settings?.exchangeRate) || 1200;

        let breakdown = {
            currency: currency,
            exchangeRate: exRate,
            costInput: cost,
            costARS: cost,
            marginPercent: (!isNaN(margin)) ? margin : (parseFloat(settings?.globalMargin) || 30),
            marginVal: 0,
            vatVal: 0,
            manualUsed: false,
            basePrice: 0,
            basePriceRounded: 0,
            discountVal: 0,
            final: 0
        };

        // Convert if needed
        if (currency === 'USD') {
            breakdown.costARS = cost * exRate;
        }

        let baseCalculation = 0;

        if (manual > 0) {
            baseCalculation = manual;
            breakdown.manualUsed = true;
            breakdown.basePrice = manual;
        } else {
            const marginAmount = breakdown.costARS * (breakdown.marginPercent / 100);
            baseCalculation = breakdown.costARS + marginAmount;
            breakdown.marginVal = marginAmount;

            if (settings?.enableVatGlobal) {
                const vatAmount = baseCalculation * (parseFloat(settings?.vatRate || 21) / 100);
                baseCalculation += vatAmount;
                breakdown.vatVal = vatAmount;
            }
            breakdown.basePrice = baseCalculation;
        }

        // Rounding logic matches previous behavior
        const roundedBase = Math.ceil(baseCalculation / 100) * 100;
        breakdown.basePriceRounded = roundedBase;

        // Discount
        let finalPrice = roundedBase;
        if (discount > 0) {
            const discountAmount = roundedBase * (discount / 100);
            finalPrice = roundedBase - discountAmount;
            breakdown.discountVal = discountAmount;
        }

        finalPrice = Math.ceil(finalPrice / 100) * 100;
        breakdown.final = finalPrice;

        return breakdown;
    };

    const livePrice = getLivePrice();
    const { addProduct, updateProduct } = useProductStore();
    const { consoles } = useConsoleStore();

    // Watch tags to handle visual state if needed, though we manage selection locally for UI then sync to form
    const [selectedGenres, setSelectedGenres] = useState([]);

    // Curation State
    const [curationSearch, setCurationSearch] = useState('');
    const [curationResults, setCurationResults] = useState([]);
    const [isCurationLoading, setIsCurationLoading] = useState(false);
    const [showCuration, setShowCuration] = useState(false);

    const handleCurateSearch = async (e) => {
        e.preventDefault();
        if (!curationSearch.trim()) return;

        setIsCurationLoading(true);
        try {
            const results = await searchGame(curationSearch);
            setCurationResults(results || []);
        } catch (error) {
            console.error("Curation search error:", error);
        } finally {
            setIsCurationLoading(false);
        }
    };

    const applyCuration = async (gameId) => {
        setIsCurationLoading(true);
        try {
            const details = await getGameDetails(gameId);
            if (details) {
                // Apply Translation
                const translatedGenres = (details.genres || []).map(g => GENRE_TRANSLATION[g] || g);

                // Update Form
                setValue('title', details.name || details.title || watch('title'));

                const selectedResult = curationResults.find(r => r.id === gameId);
                if (selectedResult) setValue('title', selectedResult.name);

                setValue('description', details.description);
                setValue('image', details.background_image);
                setValue('trailerUrl', details.trailer);
                setValue('rating', details.rating);

                // Map Genres to our Pillars
                // Filter genres that match our GENRES list strictly or loosely
                const mappedTags = translatedGenres.filter(g => GENRES.includes(g));
                setSelectedGenres(mappedTags);

                setShowCuration(false);
                setCurationResults([]);
                setCurationSearch('');
            }
        } catch (error) {
            console.error("Apply curation error:", error);
        } finally {
            setIsCurationLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                // Populate form with defaults + edit data to ensure cleanup of old state
                reset({
                    sku: productToEdit.sku || '',
                    supplierName: productToEdit.supplierName || '',
                    title: productToEdit.title || '',
                    price: productToEdit.price || '',
                    manualPrice: productToEdit.manualPrice || '',
                    stock: productToEdit.stock ?? true,
                    console: productToEdit.console || consoles.find(c => c.active)?.id || '',
                    image: productToEdit.image || '',
                    trailerUrl: productToEdit.trailerUrl || '',
                    customMargin: productToEdit.customMargin || '',
                    discountPercentage: productToEdit.discountPercentage || '',
                    description: productToEdit.description || '',
                    tags: Array.isArray(productToEdit.tags) ? productToEdit.tags.join(',') : (productToEdit.tags || ''),
                    costPrice: productToEdit.costPrice || ''
                    // Keep ID if exists to handle updates vs creates in onSubmit
                });

                // Parse tags for local state
                if (Array.isArray(productToEdit.tags)) {
                    setSelectedGenres(productToEdit.tags);
                } else if (typeof productToEdit.tags === 'string') {
                    const tagsArray = productToEdit.tags.split(',').map(t => t.trim()).filter(Boolean);
                    setSelectedGenres(tagsArray);
                } else {
                    setSelectedGenres([]);
                }
                // Determine currency heuristic
                const initialCost = parseFloat(productToEdit.costPrice || 0);
                if (initialCost > 0 && initialCost < 2000) {
                    setCurrency('USD');
                } else {
                    setCurrency('ARS');
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
                    tags: '',
                    description: '',
                    costPrice: ''
                });
                setSelectedGenres([]);
                setCurrency('ARS'); // Default to ARS for brand new unless user toggles
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

    const onSubmit = async (data) => {
        // Process Data
        const processed = {
            ...data,
            // 'price' in DB is calculated. We use 'manualPrice' field for overrides.
            manualPrice: data.manualPrice ? parseFloat(data.manualPrice) : 0,
            customMargin: data.customMargin ? parseFloat(data.customMargin) : null,
            discountPercentage: data.discountPercentage ? parseFloat(data.discountPercentage) : 0,
            // Convert to ARS if currency was USD, so DB always has ARS
            costPrice: currency === 'USD'
                ? (parseFloat(data.costPrice || 0) * (parseFloat(settings?.exchangeRate) || 1200))
                : (data.costPrice ? parseFloat(data.costPrice) : 0),
            stock: data.stock === 'true' || data.stock === true,
            trailerId: extractYoutubeId(data.trailerUrl),
            // Use local state for tags to ensure pills selection is respected
            tags: selectedGenres
        };

        if (productToEdit?.id) {
            await updateProduct(productToEdit.id, processed);
        } else {
            await addProduct({ ...processed, id: Date.now().toString() });
        }

        if (onSuccess) onSuccess(processed);
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

                            {/* CURATION MODULE */}
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-xs font-bold text-purple-700 uppercase flex items-center gap-2">
                                        <Wand2 size={14} /> Curado de Metadatos
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowCuration(!showCuration)}
                                        className="text-xs text-purple-600 hover:text-purple-800 underline"
                                    >
                                        {showCuration ? 'Cerrar' : 'Buscar manual'}
                                    </button>
                                </div>

                                {showCuration && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={curationSearch}
                                                onChange={(e) => setCurationSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCurateSearch(e)}
                                                placeholder="Buscar juego en IGDB..."
                                                className="flex-grow px-3 py-1.5 rounded-lg border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCurateSearch}
                                                disabled={isCurationLoading}
                                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                            >
                                                {isCurationLoading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                                            </button>
                                        </div>

                                        {/* Results */}
                                        {curationResults.length > 0 && (
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar bg-white rounded-lg border border-purple-100 shadow-sm divide-y divide-gray-50">
                                                {curationResults.map(game => (
                                                    <button
                                                        key={game.id}
                                                        type="button"
                                                        onClick={() => applyCuration(game.id)}
                                                        className="w-full text-left p-2 hover:bg-purple-50 flex gap-3 items-center transition-colors group"
                                                    >
                                                        <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                            {game.background_image ? (
                                                                <img src={game.background_image} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16} /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <div className="font-bold text-sm text-gray-800 group-hover:text-purple-700 truncate">{game.name}</div>
                                                            <div className="text-xs text-gray-400">{game.released?.split('-')[0] || 'N/A'}</div>
                                                        </div>
                                                        <CheckCircle2 size={16} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

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

                                    <div>
                                        <label className={labelClasses}>Descripción</label>
                                        <textarea
                                            {...register('description')}
                                            className={`${inputClasses} h-24 resize-none`}
                                            placeholder="Descripción detallada del juego..."
                                        ></textarea>
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
                                    <div className="flex gap-2">
                                        <input {...register('trailerUrl')} className={inputClasses} placeholder="https://youtube.com/..." />
                                        {watch('title') && (
                                            <a
                                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(watch('title') + ' launch trailer')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center shrink-0 border border-red-100"
                                                title="Buscar en YouTube"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                                            </a>
                                        )}
                                    </div>
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
                                            <div className="flex justify-between items-center mb-1">
                                                <label className={labelClasses}>Costo (Prov.)</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrency(prev => prev === 'USD' ? 'ARS' : 'USD')}
                                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${currency === 'USD' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                                >
                                                    {currency}
                                                </button>
                                            </div>
                                            <div className="flex rounded-md shadow-sm">
                                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 font-bold text-sm">
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    {...register('costPrice')}
                                                    className={`${inputClasses} flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-brand-dark focus:border-brand-dark font-mono font-bold`}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Margen (%)</label>
                                            <input type="number" step="0.1" {...register('customMargin')} className={inputClasses} placeholder={`Global (${settings?.globalMargin || 30}%)`} />
                                        </div>
                                    </div>

                                    {/* Row 2: Manual Price & Discount */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Precio Manual</label>
                                            <div className="flex rounded-md shadow-sm">
                                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 font-bold text-sm">
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    {...register('manualPrice')}
                                                    className={`${inputClasses} flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-brand-dark focus:border-brand-dark font-mono font-bold bg-yellow-50`}
                                                    placeholder="Opcional"
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">Sobrescribe costo+margen</p>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Descuento (%)</label>
                                            <input type="number" step="1" {...register('discountPercentage')} className={inputClasses} placeholder="0" />
                                            <p className="text-[10px] text-gray-400 mt-1">Se aplica al final</p>
                                        </div>
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="mt-4 pt-4 border-t border-gray-200/50 flex flex-col gap-1">

                                        {/* Standard Calculation (Only if Manual not used) */}
                                        {!livePrice.manualUsed && (
                                            <>
                                                {livePrice.currency === 'USD' && (
                                                    <div className="flex justify-between text-[11px] text-blue-600 bg-blue-50 px-2 py-1 rounded mb-1">
                                                        <span>Conv: ${livePrice.costInput} USD x {livePrice.exchangeRate}</span>
                                                        <span>= ${livePrice.costARS.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-[11px] text-gray-500">
                                                    <span>Costo Base {livePrice.currency === 'USD' ? 'ARS' : ''}</span>
                                                    <span>${Math.round(livePrice.costARS).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] text-gray-500">
                                                    <span>Margen ({livePrice.marginPercent}%)</span>
                                                    <span className="text-green-600">+${Math.round(livePrice.marginVal).toLocaleString()}</span>
                                                </div>
                                                {livePrice.vatVal > 0 && (
                                                    <div className="flex justify-between text-[11px] text-gray-500">
                                                        <span>IVA (Global)</span>
                                                        <span className="text-orange-600">+${Math.round(livePrice.vatVal).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="my-1 border-t border-dashed border-gray-200"></div>
                                                {livePrice.basePriceRounded !== Math.round(livePrice.basePrice) && (
                                                    <div className="flex justify-between text-[10px] text-gray-400 italic">
                                                        <span>Redondeo (a 100)</span>
                                                        <span>${Math.round(livePrice.basePrice).toLocaleString()} ➝ ${livePrice.basePriceRounded.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Manual Override Indicator */}
                                        {livePrice.manualUsed && (
                                            <div className="flex justify-between text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded mb-2 font-bold">
                                                <span>Precio Manual Definido</span>
                                                <span>${livePrice.priceBeforeDiscount ? livePrice.priceBeforeDiscount.toLocaleString() : livePrice.basePrice.toLocaleString()}</span>
                                            </div>
                                        )}

                                        {/* Discount */}
                                        {livePrice.discountVal > 0 && (
                                            <div className="flex justify-between text-[11px] text-red-500 font-medium">
                                                <span>Descuento</span>
                                                <span>-${Math.round(livePrice.discountVal).toLocaleString()}</span>
                                            </div>
                                        )}

                                        {/* Final Price */}
                                        <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-200">
                                            <span className="text-xs font-bold text-gray-700">Precio Final</span>
                                            <span className="text-2xl font-bold text-brand-dark">
                                                ${livePrice.final.toLocaleString()}
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
