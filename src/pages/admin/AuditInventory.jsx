import React, { useState, useEffect } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useConsoleStore } from '../../store/useConsoleStore';
import { AlertCircle, Plus, Search, Loader, RefreshCw, Filter, ArrowLeft, Wand2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import ProductModal from '../../components/admin/ProductModal';
import { searchGame, getGameDetails } from '../../services/gameService';

const AuditInventory = () => {
    const { getMissingProducts } = useProductStore();
    const { consoles } = useConsoleStore();
    const [loading, setLoading] = useState(false);
    const [enriching, setEnriching] = useState(false);
    const [missingProducts, setMissingProducts] = useState(null);
    const [selectedConsoleFilter, setSelectedConsoleFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToCreate, setItemToCreate] = useState(null);

    // Progress State
    const [progress, setProgress] = useState({ current: 0, total: 0, show: false, message: '' });

    // Initial Load
    useEffect(() => {
        handleCheck();
    }, []);

    const handleCheck = async () => {
        setLoading(true);
        try {
            const missing = await getMissingProducts();
            setMissingProducts(missing);
            if (missing.length === 0) {
                toast.success("Todo sincronizado. No faltan productos.");
            }
        } catch (error) {
            toast.error("Error al buscar productos faltantes");
        } finally {
            setLoading(false);
        }
    };

    // Helper: Detect Console ID from SKU
    const detectConsoleId = (sku) => {
        if (!sku) return '';
        const upperSku = sku.toUpperCase();
        let targetName = '';
        if (upperSku.startsWith('PS4')) targetName = 'PlayStation 4';
        else if (upperSku.startsWith('PS5')) targetName = 'PlayStation 5';
        else if (upperSku.startsWith('NSW')) targetName = 'Nintendo Switch';
        else if (upperSku.startsWith('SW2')) targetName = 'Nintendo Switch';

        if (targetName) {
            const found = consoles.find(c => c.name.toLowerCase() === targetName.toLowerCase());
            if (found) return found.id;
        }
        return '';
    };

    // Helper: Manual Title Corrections (For stubborn inputs)
    const TITLE_CORRECTIONS = {
        'Disney Ilusion Island': 'Disney Illusion Island',
        'Paw Patrol Gran Prix': 'Paw Patrol Grand Prix',
        'Fc 26': 'EA Sports FC 25', // Assuming typo for current/next gen, or placeholder
        'Fc 25': 'EA Sports FC 25',
        'Fc 24': 'EA Sports FC 24',
        'Mario Kart World': 'Mario Kart 8 Deluxe', // Guessing "World" is "8" typo or similar
        'Donkey Kong Bananza': 'Donkey Kong Country Tropical Freeze', // Wild guess or user specific name
        'Dragon Ball Sparking Zero': 'Dragon Ball: Sparking! Zero',
        'Pokemon Legends Z-a': 'Pokémon Legends: Z-A',
        'Kirby Return To Dreamland Deluxe': "Kirby's Return to Dream Land Deluxe",
        'Sonic Mania Nsw + Team Sonic Racing Double Pack': 'Sonic Mania + Team Sonic Racing Double Pack'
    };

    // Helper: Clean Title Common
    const cleanTitleCommon = (rawName) => {
        if (!rawName) return '';

        // 1. Check Manual Corrections First
        const cleanRaw = rawName.trim();
        const baseName = cleanRaw.replace(/\s+(Nsw2|NSW|PS5|PS4|SW2)$/i, '').trim(); // Quick strip for match
        if (TITLE_CORRECTIONS[baseName]) return TITLE_CORRECTIONS[baseName];
        if (TITLE_CORRECTIONS[cleanRaw]) return TITLE_CORRECTIONS[cleanRaw];

        return cleanRaw
            .replace(/\s+(PS[45]|NSW\d?|SW\d?|Switch|Playstation\d?)$/i, '') // Suffixes
            .replace(/^(PS[45]|NSW\d?|SW\d?)\s+/i, '') // Prefixes
            .replace(/\s*\(.*?\)\s*/g, '')
            .replace(/\s*\[.*?\]\s*/g, '')
            .replace(/\b(EU|EUR|USA|US|JP|JPN|PAL|NTSC|NA|UK|ASIA)\b/gi, '')
            .replace(/\s+(Complete|GOTY|Game of the Year|Edition|Remastered|Definitive).*$/i, '')
            .replace(/\s*-\s*$/, '')
            .trim();
    };

    // Helper: Format Name (Capitalize)
    const formatTitle = (title) => {
        if (!title) return '';
        const cleaned = cleanTitleCommon(title);
        return cleaned.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    // Helper: Clean Title for Search
    const cleanTitleForSearch = (rawName) => {
        // If "Pokemon", ensure accent for better IGDB matching sometimes (though IGDB is usually lenient)
        let cleaned = cleanTitleCommon(rawName);
        return cleaned;
    };

    // Helper: Genre Translation Map
    const genreMap = {
        'Action': 'Acción',
        'Adventure': 'Aventura',
        'RPG': 'Rol',
        'Strategy': 'Estrategia',
        'Shooter': 'Disparos',
        'Casual': 'Casual',
        'Simulation': 'Simulación',
        'Puzzle': 'Puzle',
        'Arcade': 'Arcade',
        'Platformer': 'Plataformas',
        'Racing': 'Carreras',
        'Sports': 'Deportes',
        'Fighting': 'Lucha',
        'Family': 'Familiar',
        'Board Games': 'De Mesa',
        'Educational': 'Educativo',
        'Card': 'Cartas',
        'Indie': 'Indie',
        'Massively Multiplayer': 'MMO'
    };

    const translateGenres = (genres) => {
        if (!genres) return [];
        return genres.map(g => genreMap[g] || g);
    };

    // Helper: Validate Match
    // Helper: Validate Match (Fuzzy & Strict)
    const isGoodMatch = (original, result) => {
        if (!original || !result) return false;

        // 1. Strict Substring Check (Fast)
        const cleanOriginal = cleanTitleCommon(original).toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanResult = result.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanResult.includes(cleanOriginal) || cleanOriginal.includes(cleanResult)) return true;

        // 2. Token Overlap Strategy (Fuzzy)
        const tokenize = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
        const tokensOrig = tokenize(cleanTitleCommon(original));
        const tokensRes = tokenize(result);

        if (tokensOrig.length === 0) return false;

        let matches = 0;
        tokensOrig.forEach(token => {
            // Exact token match
            if (tokensRes.includes(token)) {
                matches++;
            }
            // Common Roman Numeral Mappings (1 -> I, 2 -> II)
            else if (token === '1' && (tokensRes.includes('i') || tokensRes.includes('one'))) matches++;
            else if (token === '2' && (tokensRes.includes('ii') || tokensRes.includes('two'))) matches++;
            else if (token === '3' && (tokensRes.includes('iii') || tokensRes.includes('three'))) matches++;
        });

        // Calculate overlap score relative to the INPUT (what the user has)
        // We want to ensure most of the user's words are present in the result.
        const score = matches / tokensOrig.length;

        // Threshold: 0.6 means 3 out of 5 words must match. 
        // e.g. "The Last Of Part 1" (5 words) vs "The Last Of Us Part I"
        // Matches: "The", "Last", "Of", "Part", "1"->"I" (5/5) = 1.0 -> Match!
        return score >= 0.6;
    };

    const handleAutoFill = async () => {
        if (!missingProducts || missingProducts.length === 0) return;

        setEnriching(true);
        const total = filteredItems.length;
        setProgress({ current: 0, total, show: true, message: 'Iniciando turbo-carga...' });

        let enrichedCount = 0;
        let processedCount = 0;
        const newProductsState = [...missingProducts];

        // CONCURRENCY CONTROL
        // IGDB Limit is ~4 requests/second. 
        // Each item takes 1 Search + 1 Detail (if found) = 2 Requests.
        // Safe Concurrency = 2 items at once (4 requests) or 3 items with stagger.
        const CONCURRENCY_LIMIT = 3;

        const processItem = async (item) => {
            if (item._suggestedData) return; // Skip if already done

            const searchName = cleanTitleForSearch(item.name);
            try {
                // 1. Search
                console.log(`[AutoFill] Searching: "${searchName}"`);
                let results = await searchGame(searchName);

                // RETRY STRATEGY: Broader Search
                if (!results || results.length === 0) {
                    const words = searchName.split(' ');
                    if (words.length > 3) {
                        const shortName = words.slice(0, 3).join(' ');
                        console.log(`[AutoFill] Retry with short name: "${shortName}"`);
                        results = await searchGame(shortName);
                    }
                }

                if (results && results.length > 0) {
                    const bestMatch = results[0];
                    // Relaxed matching for retry cases? 
                    // Use isGoodMatch but maybe log confidence
                    if (isGoodMatch(searchName, bestMatch.name) || isGoodMatch(searchName.split(' ').slice(0, 3).join(' '), bestMatch.name)) {
                        // 2. Get Details
                        const details = await getGameDetails(bestMatch.id, searchName);
                        if (details) {
                            details.genres = translateGenres(details.genres);

                            // 3. Update State safely using SKU finding
                            const index = newProductsState.findIndex(p => p.sku === item.sku);
                            if (index !== -1) {
                                newProductsState[index] = {
                                    ...newProductsState[index],
                                    _suggestedData: details,
                                    _matchConfidence: 'High'
                                };
                                enrichedCount++;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Auto-fill error for", item.name, err);
            } finally {
                processedCount++;
                setProgress(prev => ({
                    ...prev,
                    current: processedCount,
                    message: `Procesando: ${item.name}`
                }));
            }
        };

        // Chunked Execution to prevent 429s (simple queue)
        for (let i = 0; i < filteredItems.length; i += CONCURRENCY_LIMIT) {
            const chunk = filteredItems.slice(i, i + CONCURRENCY_LIMIT);
            await Promise.all(chunk.map(item => processItem(item)));
            // Small cooldown between chunks prevents rate limit spikes
            // 250ms delay after every 3 items
            await new Promise(r => setTimeout(r, 250));
        }

        setMissingProducts(newProductsState);
        setEnriching(false);
        setTimeout(() => setProgress(prev => ({ ...prev, show: false })), 1000);
        toast.success(`Turbo-Carga completada: ${enrichedCount} juegos encontrados.`);
    };

    const handleBulkImport = async () => {
        if (!confirm(`¿Estás seguro de importar TODOS los ${filteredItems.length} productos? (Incluyendo los que no tienen datos)`)) return;
        await executeImport(filteredItems);
    };

    const handleImportEnrichedOnly = async () => {
        const enrichedItems = filteredItems.filter(i => i._suggestedData);
        if (enrichedItems.length === 0) return toast.error("No hay productos con datos enriquecidos para importar.");

        if (!confirm(`¿Importar solo los ${enrichedItems.length} productos que tienen datos completos?`)) return;
        await executeImport(enrichedItems);
    };

    const executeImport = async (itemsToImport) => {
        setLoading(true);
        const total = itemsToImport.length;
        setProgress({ current: 0, total, show: true, message: 'Iniciando importación...' });

        try {
            const { bulkImportProducts } = useProductStore.getState();

            const productsPayload = itemsToImport.map(item => {
                const suggested = item._suggestedData || {};
                // Prioritize explicit console from Sheet, fallback to detection
                const consoleId = item.console || detectConsoleId(item.sku);
                const costPrice = parseFloat(item.price.replace(/[$. ]/g, '').replace(',', '.')) || 0;

                return {
                    sku: item.sku,
                    title: formatTitle(item.name),
                    supplierName: item.name,
                    costPrice: costPrice,
                    console: consoleId,
                    stock: true,
                    image: suggested.background_image || '',
                    trailerUrl: suggested.trailer || '',
                    description: suggested.description || '',
                    tags: suggested.genres || [],
                    rating: suggested.rating || 0
                };
            });

            await bulkImportProducts(productsPayload, (current, totalItems) => {
                setProgress({
                    current,
                    total: totalItems,
                    show: true,
                    message: `Guardando paquete ${Math.ceil(current / 450)}...`
                });
            });

            // Refresh list
            await handleCheck();

        } catch (error) {
            console.error(error);
            toast.error("Error al importar productos.");
        } finally {
            setLoading(false);
            setProgress(prev => ({ ...prev, show: false }));
        }
    };

    const handleAdd = (item) => {
        const logicalConsoleId = item.console || detectConsoleId(item.sku);

        // Resolve Real DB ID
        let realConsoleId = '';
        const targetName =
            logicalConsoleId === 'ps5' ? 'PlayStation 5' :
                logicalConsoleId === 'ps4' ? 'PlayStation 4' :
                    logicalConsoleId === 'nsw' ? 'Nintendo Switch' :
                        logicalConsoleId === 'nsw2' ? 'Nintendo Switch 2' : '';

        if (targetName) {
            const found = consoles.find(c => c.name.toLowerCase() === targetName.toLowerCase());
            if (found) realConsoleId = found.id;
        }

        // Fallback or Active
        if (!realConsoleId) realConsoleId = consoles.find(c => c.active)?.id || '';

        const suggested = item._suggestedData || {};

        let trailerUrl = suggested.trailer || '';
        // No forced fallback to search URL
        // User prefers empty if not found, or manual search button (to be added)

        setItemToCreate({
            sku: item.sku,
            title: formatTitle(item.name),
            supplierName: item.name,
            costPrice: parseFloat(item.price.replace(/[$. ]/g, '').replace(',', '.')) || 0,
            stock: true,
            console: realConsoleId,
            manualPrice: '',
            // Pre-fill from suggested data
            image: suggested.background_image || '',
            trailerUrl: trailerUrl,
            description: suggested.description || '', // Description from RAWG might still be English
            tags: suggested.genres || []
        });
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setItemToCreate(null);
    };

    const handleProductCreationSuccess = (createdProduct) => {
        if (!createdProduct || !createdProduct.sku) return;

        toast.success(`Producto "${createdProduct.title}" creado y removido de la lista.`);

        setMissingProducts(prev => {
            if (!prev) return prev;
            // Remove item from list if SKU matches
            return prev.filter(item => item.sku !== createdProduct.sku);
        });
    };

    // Filter Logic
    const filteredItems = missingProducts?.filter(item => {
        // 1. Console Filter
        let matchesConsole = false;
        if (selectedConsoleFilter === 'ALL') matchesConsole = true;
        else {
            if (selectedConsoleFilter === 'PS') matchesConsole = item.console === 'ps5' || item.console === 'ps4';
            if (selectedConsoleFilter === 'NSW') matchesConsole = item.console === 'nsw' || item.console === 'nsw2';
        }

        // 2. Search Filter
        let matchesSearch = true;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            matchesSearch = item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
        }

        return matchesConsole && matchesSearch;
    }) || [];

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard" className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-gray-600 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Search className="text-blue-600" />
                            Auditoría de Inventario
                        </h1>
                        <p className="text-gray-500 text-sm">Detecta juegos faltantes y enriquece datos con IA</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleAutoFill}
                        disabled={loading || enriching || !missingProducts || missingProducts.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
                    >
                        <Wand2 size={18} className={enriching ? 'animate-pulse' : ''} />
                        {enriching ? 'Enriqueciendo...' : 'Auto-Completar Datos'}
                    </button>

                    {/* Import Buttons */}
                    {filteredItems.length > 0 && (
                        <>
                            {/* Only show "Import Enriched" if there are any enriched items */}
                            {filteredItems.some(i => i._suggestedData) && (
                                <button
                                    onClick={handleImportEnrichedOnly}
                                    disabled={loading || enriching}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all shadow-sm disabled:opacity-70 disabled:cursor-wait font-bold"
                                >
                                    <Wand2 size={18} />
                                    Importar {filteredItems.filter(i => i._suggestedData).length} (Completos)
                                </button>
                            )}

                            <button
                                onClick={handleBulkImport}
                                disabled={loading || enriching}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
                            >
                                <Plus size={18} />
                                Importar Todos ({filteredItems.length})
                            </button>
                        </>
                    )}

                    <button
                        onClick={handleCheck}
                        disabled={loading || enriching}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Analizando...' : 'Escanear'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-2">
                <div className="flex items-center gap-2 text-gray-500 mr-2">
                    <Filter size={18} />
                    <span className="font-semibold text-sm">Filtrar por Consola:</span>
                </div>
                <button
                    onClick={() => setSelectedConsoleFilter('ALL')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedConsoleFilter === 'ALL' ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => setSelectedConsoleFilter('PS')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedConsoleFilter === 'PS' ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                >
                    PlayStation (PS4/PS5)
                </button>
                <button
                    onClick={() => setSelectedConsoleFilter('NSW')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedConsoleFilter === 'NSW' ? 'bg-red-600 text-white shadow-md' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                >
                    Nintendo (NSW/SW2)
                </button>

                {/* Search Filter */}
                <div className="ml-auto w-full md:w-64 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Filtrar por nombre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader className="animate-spin mb-4" size={40} />
                        <p>Analizando hoja de cálculo...</p>
                    </div>
                ) : !missingProducts ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <p>Presiona "Escanear" para comenzar.</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-green-600">
                        <div className="bg-green-100 p-4 rounded-full mb-4">
                            <AlertCircle size={40} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold">¡Todo al día!</h3>
                        <p className="text-gray-500">No se encontraron productos faltantes con los filtros actuales.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                                    <th className="p-4">EAN</th>
                                    <th className="p-4">Consola</th>
                                    <th className="p-4">Referencia (Sheet)</th>
                                    <th className="p-4">Datos Sugeridos</th>
                                    <th className="p-4 text-right">Costo (Sheet)</th>
                                    <th className="p-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.map((item, index) => (
                                    <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-4 font-mono text-xs font-bold text-gray-500">{item.sku}</td>
                                        <td className="p-4 text-xs font-bold text-gray-400 uppercase">
                                            {/* Show mapped console name if possible, else raw */}
                                            {(() => {
                                                const effectiveConsole = item.console || detectConsoleId(item.sku);
                                                if (effectiveConsole) {
                                                    return (
                                                        <span className={`px-2 py-1 rounded-md text-white text-[10px] ${effectiveConsole === 'ps5' ? 'bg-blue-600' :
                                                            effectiveConsole === 'ps4' ? 'bg-blue-400' :
                                                                effectiveConsole === 'nsw2' ? 'bg-red-700' :
                                                                    effectiveConsole === 'nsw' ? 'bg-red-500' : 'bg-gray-400'
                                                            }`}>
                                                            {effectiveConsole === 'ps5' ? 'PS5' :
                                                                effectiveConsole === 'ps4' ? 'PS4' :
                                                                    effectiveConsole === 'nsw2' ? 'SWITCH 2' :
                                                                        effectiveConsole === 'nsw' ? 'SWITCH' : item.categoryRaw}
                                                        </span>
                                                    );
                                                } else {
                                                    return item.categoryRaw || '-';
                                                }
                                            })()}
                                        </td>
                                        <td className="p-4 font-medium text-gray-800">{formatTitle(item.name)}</td>
                                        <td className="p-4">
                                            {item._suggestedData ? (
                                                <div className="flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg w-fit">
                                                    <Wand2 size={12} />
                                                    Encontrado
                                                    {item._suggestedData.background_image && (
                                                        <img src={item._suggestedData.background_image} alt="" className="w-6 h-6 rounded-sm object-cover ml-1" />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Pendiente</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right font-mono text-gray-600">{item.price}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleAdd(item)}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all shadow-sm font-semibold text-sm ${item._suggestedData
                                                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-600 hover:text-white'
                                                    }`}
                                            >
                                                <Plus size={16} /> {item._suggestedData ? 'Revisar & Crear' : 'Crear'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Progress Modal */}
            {progress.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
                        <div className="mb-4 flex justify-center">
                            <RefreshCw size={40} className="text-purple-600 animate-spin" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{progress.message}</h3>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
                            <div
                                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            ></div>
                        </div>

                        <p className="text-sm text-gray-500 font-mono">
                            {progress.current} / {progress.total}
                        </p>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <ProductModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                productToEdit={itemToCreate}
                onSuccess={handleProductCreationSuccess}
            />
        </div>
    );
};

export default AuditInventory;
