import React, { useState, useEffect } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useConsoleStore } from '../../store/useConsoleStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import ConsoleManager from '../../components/admin/ConsoleManager';
import { Save, ArrowLeft, CheckCircle, XCircle, Globe, Settings, RefreshCw, Trash, Loader, TrendingUp, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { calculateProductPrice } from '../../utils/pricingUtils';

const AdminSettings = () => {
    const navigate = useNavigate();
    // Use Firestore Store
    const { settings, fetchSettings, updateSettings, loading: settingsLoading } = useSettingsStore();
    const { recalculatePrices } = useProductStore();

    // Local state for form
    const [formData, setFormData] = useState({
        sheetUrl: '',
        defaultMargin: 30,
        vatRate: 21,
        enableVatGlobal: false,
        exchangeRate: 1200,
        autoExchangeRate: false,
        autoExchangeSource: 'blue', // Default
        rawgApiKey: '',
        youtubeApiKey: '',
        igdbClientId: '',
        igdbClientSecret: ''
    });

    // const { fetchSettings, updateSettings, settings, loading: settingsLoading } = useSettingsStore(); // Duplicate removed
    const [saved, setSaved] = useState(false);
    const { resetAnalytics } = useAnalytics();
    const [verifying, setVerifying] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState(null); // 'success', 'error', null
    const [isTechUnlocked, setIsTechUnlocked] = useState(false); // Safety Lock

    // Suggestions State
    const [suggestionQuotes, setSuggestionQuotes] = useState([]);
    const [loadingQuotes, setLoadingQuotes] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [simulatedCost, setSimulatedCost] = useState(60);

    useEffect(() => {
        fetchSettings(); // Force fetch on mount
    }, []);

    useEffect(() => {
        if (settings) {
            setFormData({
                sheetUrl: settings.sheetUrl || '',
                defaultMargin: settings.globalMargin !== undefined ? settings.globalMargin : 30,
                enableTieredMargins: settings.enableTieredMargins || false,
                marginTiers: settings.marginTiers || [],
                vatRate: settings.vatRate !== undefined ? settings.vatRate : 21,
                enableVatGlobal: settings.enableVatGlobal || false,
                rawgApiKey: settings.rawgApiKey || '',
                youtubeApiKey: settings.youtubeApiKey || '',
                igdbClientId: settings.igdbClientId || '',
                igdbClientSecret: settings.igdbClientSecret || '',
                exchangeRate: settings.exchangeRate || 1200,
                autoExchangeRate: settings.autoExchangeRate || false,
                autoExchangeSource: settings.autoExchangeSource || 'blue'
            });
        }
    }, [settings]);

    // Fetch all quotes for suggestions
    const fetchDetailedQuotes = async () => {
        setLoadingQuotes(true);
        setShowSuggestions(true);
        try {
            const res = await fetch('https://dolarapi.com/v1/dolares');
            const data = await res.json(); // Array of objects
            setSuggestionQuotes(data);
        } catch (error) {
            console.error("Error fetching quotes:", error);
            toast.error("Error al cargar cotizaciones");
        } finally {
            setLoadingQuotes(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Reset verify status if url changes
        if (name === 'sheetUrl') setVerifyStatus(null);
    };

    const verifyUrl = async (e) => {
        e.preventDefault();
        if (!formData.sheetUrl) return;

        setVerifying(true);
        setVerifyStatus(null);
        toast.message('Verificando conexión y formato...');

        try {
            const response = await fetch(formData.sheetUrl);
            if (response.ok) {
                const text = await response.text();
                // Check CSV Basics
                if (text.includes(',') || text.includes(';')) {
                    // Quick Parse to count rows and preview
                    const rows = text.split('\n').filter(r => r.trim() !== '');
                    const rowCount = rows.length;
                    const firstRow = rows[0] || 'Vacia';
                    const lastRow = rows[rows.length - 1] || 'Vacia';

                    setVerifyStatus('success');
                    toast.success(`¡Conexión Exitosa! Detectados ${rowCount} juegos/filas.`);

                    // console.log preview for debug
                    console.log("CSV Preview:", { firstRow, lastRow });
                } else {
                    console.warn("URL reachable but content doesn't look like CSV");
                    setVerifyStatus('warning');
                    toast.warning('Se conecta, pero no parece un CSV válido.');
                }
            } else {
                setVerifyStatus('error');
                toast.error(`Error HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error(error);
            setVerifyStatus('error');
            toast.error('No se pudo conectar a esa URL.');
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Use async updateSettings from Firestore store
        await updateSettings({
            sheetUrl: formData.sheetUrl,
            globalMargin: formData.defaultMargin,
            vatRate: formData.vatRate,
            enableVatGlobal: formData.enableVatGlobal,
            rawgApiKey: formData.rawgApiKey,
            youtubeApiKey: formData.youtubeApiKey,
            igdbClientId: formData.igdbClientId,
            igdbClientSecret: formData.igdbClientSecret,
            exchangeRate: formData.exchangeRate,
            autoExchangeRate: formData.autoExchangeRate,
            autoExchangeSource: formData.autoExchangeSource,
            enableTieredMargins: formData.enableTieredMargins,
            marginTiers: formData.marginTiers
        });

        // Auto recalculate prices when global config changes
        recalculatePrices();

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setIsTechUnlocked(false); // Auto-lock after save
    };

    return (
        <div className="flex justify-center w-full min-h-screen bg-gray-50/50 p-6">
            <div className="w-full max-w-[1400px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/dashboard" className="p-2 hover:bg-white rounded-full text-gray-600 transition-colors shadow-sm">
                            <ArrowLeft />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-brand-dark">Configuración del Sistema</h1>
                            <p className="text-sm text-gray-500">Administra los parámetros comerciales y técnicos</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className={`font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 ${saved ? 'bg-green-600 text-white' : 'bg-brand-dark hover:bg-gray-800 text-white'
                            }`}
                    >
                        {saved ? <CheckCircle size={20} /> : <Save size={20} />}
                        {saved ? 'GUARDADO' : 'GUARDAR CAMBIOS'}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: Business Settings (Active/Unlocked) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Pricing Logic & Playground */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2.5 rounded-xl text-green-700">
                                        <Globe size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Lógica de Precios</h2>
                                        <p className="text-xs text-gray-500">Configurá cómo se calculan los precios finales.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => recalculatePrices()}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-bold rounded-lg shadow-sm transition-all"
                                >
                                    <RefreshCw size={14} />
                                    Forzar Recálculo Global
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {/* LEFT: Controls */}
                                <div className="p-6 space-y-8 border-r border-gray-100">

                                    {/* 1. Base Parameters */}
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            1. Estrategia de Márgenes
                                        </h3>

                                        {/* Strategy Switch */}
                                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, enableTieredMargins: false })}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!formData.enableTieredMargins ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                MARGEN FIJO
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, enableTieredMargins: true })}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.enableTieredMargins ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                ESCALONADO
                                            </button>
                                        </div>

                                        {/* Global / Fallback Margin */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2">
                                                {formData.enableTieredMargins ? 'Margen por Defecto (Resto)' : 'Margen Global (%)'}
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    name="defaultMargin"
                                                    value={formData.defaultMargin}
                                                    onChange={handleChange}
                                                    className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                />
                                                <span className="absolute right-3 top-2 text-gray-400 font-bold">%</span>
                                            </div>
                                            {formData.enableTieredMargins && (
                                                <p className="text-[10px] text-gray-400 mt-1">Se aplica si no coincide ninguna regla.</p>
                                            )}
                                        </div>

                                        {/* Tiered Rules Editor */}
                                        {formData.enableTieredMargins && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-xs font-bold text-gray-700">Reglas de Margen</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newTiers = [...(formData.marginTiers || []), { maxPrice: 60, percentage: 20 }];
                                                            setFormData({ ...formData, marginTiers: newTiers });
                                                        }}
                                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded"
                                                    >
                                                        + AGREGAR REGLA
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    {(formData.marginTiers || []).map((tier, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Hasta</span>
                                                            <div className="relative w-20">
                                                                <span className="absolute left-2 top-1.5 text-gray-400 text-[10px]">$</span>
                                                                <input
                                                                    type="number"
                                                                    value={tier.maxPrice}
                                                                    onChange={(e) => {
                                                                        const newTiers = formData.marginTiers.map((t, i) =>
                                                                            i === idx ? { ...t, maxPrice: e.target.value } : t
                                                                        );
                                                                        setFormData({ ...formData, marginTiers: newTiers });
                                                                    }}
                                                                    className="w-full pl-4 pr-1 py-1 text-xs font-bold bg-white border border-gray-200 rounded focus:border-indigo-500 outline-none"
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase">USD ➡</span>
                                                            <div className="relative w-16">
                                                                <input
                                                                    type="number"
                                                                    value={tier.percentage}
                                                                    onChange={(e) => {
                                                                        const newTiers = formData.marginTiers.map((t, i) =>
                                                                            i === idx ? { ...t, percentage: e.target.value } : t
                                                                        );
                                                                        setFormData({ ...formData, marginTiers: newTiers });
                                                                    }}
                                                                    className="w-full pl-2 pr-4 py-1 text-xs font-bold bg-white border border-gray-200 rounded focus:border-indigo-500 outline-none"
                                                                />
                                                                <span className="absolute right-2 top-1.5 text-gray-400 text-[10px]">%</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newTiers = formData.marginTiers.filter((_, i) => i !== idx);
                                                                    setFormData({ ...formData, marginTiers: newTiers });
                                                                }}
                                                                className="ml-auto text-gray-400 hover:text-red-500 p-1"
                                                            >
                                                                <Trash size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {(formData.marginTiers || []).length === 0 && (
                                                        <p className="text-center text-[10px] text-gray-400 py-2 border border-dashed border-gray-200 rounded-lg">
                                                            Sin reglas. Usará el margen por defecto.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Tasa IVA (%)</label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    name="vatRate"
                                                    value={formData.vatRate}
                                                    onChange={handleChange}
                                                    className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                />
                                                <span className="absolute right-3 top-2 text-gray-400 font-bold">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Dollar Logic */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                                2. Cotización Dólar
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold ${formData.autoExchangeRate ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    SYNC AUTO
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const newValue = !formData.autoExchangeRate;
                                                        setFormData(prev => ({ ...prev, autoExchangeRate: newValue }));
                                                        if (newValue) {
                                                            const source = formData.autoExchangeSource || 'blue';
                                                            try {
                                                                toast.message(`Sincronizando Dólar ${source}...`);
                                                                const res = await fetch(`https://dolarapi.com/v1/dolares/${source}`);
                                                                const data = await res.json();
                                                                if (data && data.venta) {
                                                                    setFormData(prev => ({ ...prev, exchangeRate: data.venta, autoExchangeRate: true }));
                                                                    toast.success(`Actualizado: $${data.venta}`);
                                                                }
                                                            } catch (error) { toast.error("Error al sincronizar"); }
                                                        }
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${formData.autoExchangeRate ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                >
                                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.autoExchangeRate ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="flex gap-2 mb-3">
                                                {formData.autoExchangeRate && (
                                                    <select
                                                        name="autoExchangeSource"
                                                        value={formData.autoExchangeSource}
                                                        onChange={async (e) => {
                                                            const newSource = e.target.value;
                                                            setFormData(prev => ({ ...prev, autoExchangeSource: newSource }));
                                                            try {
                                                                const res = await fetch(`https://dolarapi.com/v1/dolares/${newSource}`);
                                                                const data = await res.json();
                                                                if (data?.venta) setFormData(prev => ({ ...prev, exchangeRate: data.venta }));
                                                            } catch (e) { }
                                                        }}
                                                        className="flex-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg py-2 px-3 uppercase outline-none"
                                                    >
                                                        <option value="oficial">Oficial</option>
                                                        <option value="blue">Blue</option>
                                                        <option value="bolsa">MEP</option>
                                                        <option value="tarjeta">Tarjeta</option>
                                                        <option value="mayorista">Mayorista</option>
                                                    </select>
                                                )}
                                                {!formData.autoExchangeRate && (
                                                    <button
                                                        type="button"
                                                        onClick={fetchDetailedQuotes}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg py-2 px-3 text-xs font-bold hover:bg-green-100 transition-colors"
                                                    >
                                                        <TrendingUp size={14} /> Ver Cotizaciones
                                                    </button>
                                                )}
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="exchangeRate"
                                                    value={formData.exchangeRate}
                                                    onChange={handleChange}
                                                    disabled={formData.autoExchangeRate}
                                                    className={`w-full text-3xl font-mono font-bold py-4 pl-10 border rounded-xl outline-none transition-all ${formData.autoExchangeRate
                                                        ? 'bg-gray-50 text-gray-400 border-gray-200'
                                                        : 'bg-white text-green-700 border-green-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10'
                                                        }`}
                                                />
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-300 font-bold">$</span>
                                            </div>

                                            {/* Manual Suggestions */}
                                            {!formData.autoExchangeRate && showSuggestions && (
                                                <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95">
                                                    {loadingQuotes ? (
                                                        <div className="col-span-2 p-4 text-center text-xs text-gray-400"><Loader className="animate-spin mx-auto mb-1" />Cargando...</div>
                                                    ) : (
                                                        suggestionQuotes.filter(q => ['Oficial', 'Blue', 'Bolsa', 'Tarjeta'].includes(q.nombre)).map((q, i) => (
                                                            <button
                                                                key={i} type="button"
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, exchangeRate: q.venta }));
                                                                    setShowSuggestions(false);
                                                                }}
                                                                className="text-left p-2 hover:bg-green-50 rounded-lg group transition-colors"
                                                            >
                                                                <div className="text-[10px] font-bold text-gray-500 uppercase">{q.nombre}</div>
                                                                <div className="text-sm font-bold text-gray-800 group-hover:text-green-600">${q.venta}</div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Global Switches */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <label className="flex items-center gap-3 cursor-pointer group p-3 hover:bg-gray-50 rounded-lg transition-colors -mx-3">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="enableVatGlobal"
                                                    checked={formData.enableVatGlobal}
                                                    onChange={handleChange}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                            </div>
                                            <div>
                                                <span className="block text-xs font-bold text-gray-700 group-hover:text-blue-600">Forzar IVA en todos</span>
                                                <span className="block text-[10px] text-gray-400">Si activo, ignora configuración individual de productos.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* RIGHT: Playground */}
                                <div className="bg-gray-50/50 p-6 flex flex-col justify-center">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        Simulación en Tiempo Real
                                    </h3>

                                    {/* Simulation Card */}
                                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform transition-all hover:scale-[1.01] hover:shadow-2xl">
                                        {/* Product Header */}
                                        <div className="flex gap-4 mb-6 pb-6 border-b border-dashed border-gray-200">
                                            <div className="w-12 h-16 bg-gray-200 rounded-lg shadow-inner flex-shrink-0"></div>
                                            <div className="flex-1">
                                                <div className="h-4 w-3/4 bg-gray-100 rounded mb-2"></div>
                                                <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                                            </div>
                                        </div>

                                        {/* Dynamic Calc */}
                                        {/* Dynamic Calc */}
                                        <div className="space-y-3 font-mono text-sm">
                                            {(() => {
                                                // Prepare fake product and settings for calculation
                                                const fakeCost = parseFloat(simulatedCost) || 0;
                                                const fakeSettings = {
                                                    globalMargin: formData.defaultMargin,
                                                    vatRate: formData.vatRate,
                                                    enableVatGlobal: formData.enableVatGlobal,
                                                    exchangeRate: formData.exchangeRate,
                                                    enableTieredMargins: formData.enableTieredMargins,
                                                    marginTiers: formData.marginTiers
                                                };

                                                const { basePrice, finalPrice } = calculateProductPrice(
                                                    fakeCost,
                                                    null, // No custom margin
                                                    0, // No discount
                                                    fakeSettings,
                                                    0, // No manual price
                                                    'USD' // Currency
                                                );

                                                // Back-calculate components for visualization
                                                const costInARS = fakeCost * formData.exchangeRate;

                                                // Re-derive margin to show the USER which one is being used
                                                let usedMargin = parseFloat(formData.defaultMargin);
                                                if (formData.enableTieredMargins && formData.marginTiers) {
                                                    const matching = [...formData.marginTiers]
                                                        .sort((a, b) => a.maxPrice - b.maxPrice)
                                                        .find(t => fakeCost <= t.maxPrice);
                                                    if (matching) usedMargin = parseFloat(matching.percentage);
                                                }

                                                const priceWithMargin = costInARS * (1 + (usedMargin / 100));
                                                const vatAmount = formData.enableVatGlobal ? priceWithMargin * (formData.vatRate / 100) : 0;

                                                return (
                                                    <>
                                                        <div className="flex justify-between items-center text-gray-500">
                                                            <span>Costo Input (USD)</span>
                                                            <div className="relative w-24">
                                                                <input
                                                                    type="number"
                                                                    value={simulatedCost}
                                                                    onChange={(e) => setSimulatedCost(e.target.value)}
                                                                    className="w-full pl-6 pr-2 py-1 text-right font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded focus:border-green-500 outline-none"
                                                                />
                                                                <span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center text-gray-500 text-xs pl-4 border-l-2 border-gray-200">
                                                            <span>× Cotización</span>
                                                            <span>$ {formData.exchangeRate}</span>
                                                        </div>

                                                        <div className="flex justify-between items-center text-gray-800 font-bold bg-gray-50 p-2 rounded-lg">
                                                            <span>Base (ARS)</span>
                                                            <span>$ {costInARS.toLocaleString('es-AR')}</span>
                                                        </div>

                                                        <div className="flex justify-between items-center text-green-600 text-xs pl-4">
                                                            <span className="flex items-center gap-1">
                                                                + Margen ({usedMargin}%)
                                                                {usedMargin !== parseFloat(formData.defaultMargin) && (
                                                                    <span className="bg-green-100 text-green-700 px-1 rounded text-[10px]">REGLA</span>
                                                                )}
                                                            </span>
                                                            <span>+ $ {(priceWithMargin - costInARS).toLocaleString('es-AR')}</span>
                                                        </div>

                                                        <div className="flex justify-between items-center text-blue-600 text-xs pl-4">
                                                            <span>+ IVA ({formData.vatRate}%)</span>
                                                            <span>+ $ {vatAmount.toLocaleString('es-AR')}</span>
                                                        </div>

                                                        <div className="pt-4 border-t border-gray-100 mt-4">
                                                            <div className="flex justify-between items-end">
                                                                <span className="text-sm font-bold text-gray-400 uppercase">Precio Final</span>
                                                                <span className="text-3xl font-bold text-brand-dark leading-none">
                                                                    $ {finalPrice.toLocaleString('es-AR')}
                                                                </span>
                                                            </div>
                                                            <div className="text-right text-[10px] text-gray-400 mt-1">
                                                                Ejemplo para un juego de <span className="font-bold">{fakeCost} USD</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Platforms Manager */}
                        <ConsoleManager />
                    </div>


                    {/* RIGHT COLUMN: Technical Settings (Locked by Default) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Tech Header & Lock Toggle */}
                        <div className="flex items-center justify-between bg-gray-800 text-white p-4 rounded-xl shadow-lg">
                            <div className="flex items-center gap-3">
                                <Settings className="text-gray-400" />
                                <div>
                                    <h3 className="font-bold text-sm">Panel Técnico</h3>
                                    <p className="text-[10px] text-gray-400">Zona de peligro</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsTechUnlocked(!isTechUnlocked)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isTechUnlocked
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {isTechUnlocked ? 'BLOQUEAR' : 'DESBLOQUEAR'}
                            </button>
                        </div>

                        <div className={`space-y-6 transition-opacity duration-200 ${isTechUnlocked ? 'opacity-100 pointer-events-auto' : 'opacity-60 pointer-events-none select-none'}`}>

                            {/* Data Source */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                                {!isTechUnlocked && <div className="absolute inset-0 z-10 bg-gray-50/10 backdrop-blur-[1px]"></div>}

                                <h3 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Origen de Datos (CSV)</h3>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type="url"
                                            name="sheetUrl"
                                            value={formData.sheetUrl}
                                            onChange={handleChange}
                                            disabled={!isTechUnlocked}
                                            className={`form-input text-xs font-mono pr-8 ${verifyStatus === 'success' ? 'border-green-500' : ''}`}
                                            placeholder="https://docs.google.com/..."
                                        />
                                        <div className="absolute right-2 top-2.5">
                                            {verifyStatus === 'success' ? <CheckCircle size={16} className="text-green-500" /> : <Globe size={16} className="text-gray-400" />}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={verifyUrl}
                                        disabled={!isTechUnlocked || verifying}
                                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg transition-colors"
                                    >
                                        {verifying ? 'Verificando...' : 'Verificar Conexión'}
                                    </button>
                                </div>
                            </div>

                            {/* API Configuration */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                                {!isTechUnlocked && <div className="absolute inset-0 z-10 bg-gray-50/10 backdrop-blur-[1px]"></div>}

                                <h3 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Integraciones API</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">RAWG API Key</label>
                                        <input
                                            type="password"
                                            name="rawgApiKey"
                                            value={formData.rawgApiKey}
                                            onChange={handleChange}
                                            disabled={!isTechUnlocked}
                                            className="form-input text-xs font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">IGDB Client ID</label>
                                        <input
                                            type="password"
                                            name="igdbClientId"
                                            value={formData.igdbClientId}
                                            onChange={handleChange}
                                            disabled={!isTechUnlocked}
                                            className="form-input text-xs font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">IGDB Secret</label>
                                        <input
                                            type="password"
                                            name="igdbClientSecret"
                                            value={formData.igdbClientSecret}
                                            onChange={handleChange}
                                            disabled={!isTechUnlocked}
                                            className="form-input text-xs font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">YouTube API Key</label>
                                        <input
                                            type="password"
                                            name="youtubeApiKey"
                                            value={formData.youtubeApiKey}
                                            onChange={handleChange}
                                            disabled={!isTechUnlocked}
                                            className="form-input text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* DANGER ZONE */}
                            <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200 relative overflow-hidden">
                                {!isTechUnlocked && <div className="absolute inset-0 z-10 bg-gray-50/10 backdrop-blur-[1px]"></div>}

                                <h3 className="text-sm font-bold text-red-800 mb-4 border-b border-red-200 pb-2 flex items-center gap-2">
                                    <XCircle size={16} /> Zona de Peligro
                                </h3>

                                <div className="space-y-4">
                                    <p className="text-xs text-red-600">
                                        Estas acciones son destructivas e irreversibles. Ten cuidado.
                                    </p>

                                    <div>
                                        <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">
                                            Escribí "BORRAR" para confirmar
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="BORRAR"
                                            className="form-input text-xs border-red-300 focus:border-red-500 focus:ring-red-500"
                                            onChange={(e) => {
                                                if (e.target.value === 'BORRAR') {
                                                    e.target.style.borderColor = 'green';
                                                } else {
                                                    e.target.style.borderColor = '';
                                                }
                                            }}
                                            id="delete-confirm-input"
                                        />
                                    </div>

                                    {/* Botón de Reinicio de Estadísticas */}
                                    <div className="p-3 border border-red-100 rounded bg-white/50 mb-2">
                                        <h4 className="text-xs font-bold text-red-700 mb-1">Reiniciar Estadísticas (Pre-Lanzamiento)</h4>
                                        <p className="text-[10px] text-gray-500 mb-3">
                                            Borra todos los eventos de analítica y resetea los contadores de vista/carrito de los productos a cero.
                                            Ideal para limpiar datos de prueba.
                                        </p>
                                        <button
                                            type="button"
                                            disabled={!isTechUnlocked || verifying}
                                            onClick={async () => {
                                                const confirmInput = document.getElementById('delete-confirm-input');
                                                if (confirmInput.value !== 'BORRAR') {
                                                    toast.error('Debes escribir "BORRAR" arriba para confirmar.');
                                                    return;
                                                }

                                                if (window.confirm('¿Confirmas que quieres BORRAR TODAS LAS ESTADÍSTICAS? No se puede deshacer.')) {
                                                    setVerifying(true);
                                                    try {
                                                        await resetAnalytics();
                                                        toast.success('Estadísticas reiniciadas correctamente');
                                                        confirmInput.value = '';
                                                    } catch (e) {
                                                        console.error(e);
                                                        toast.error('Error al reiniciar estadísticas');
                                                    } finally {
                                                        setVerifying(false);
                                                    }
                                                }
                                            }}
                                            className="w-full py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-bold rounded text-xs transition-colors"
                                        >
                                            REINICIAR SOLO ESTADÍSTICAS
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={!isTechUnlocked || verifying}
                                        onClick={async () => {
                                            const confirmInput = document.getElementById('delete-confirm-input');
                                            if (confirmInput.value !== 'BORRAR') {
                                                alert('Debes escribir "BORRAR" (en mayúsculas) para confirmar.');
                                                return;
                                            }

                                            if (window.confirm('¿ESTÁS SEGURO? Se borrarán TODOS los productos para siempre.')) {
                                                setVerifying(true); // Reuse loading state
                                                try {
                                                    const { deleteAllProducts } = useProductStore.getState();
                                                    await deleteAllProducts((current, total) => {
                                                        console.log(`Borrando ${current}/${total}`);
                                                    });
                                                    confirmInput.value = '';
                                                } catch (e) {
                                                    console.error(e);
                                                } finally {
                                                    setVerifying(false); // Reuse loading state
                                                }
                                            }
                                        }}
                                        className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <Trash size={16} />
                                        ELIMINAR TODO EL INVENTARIO
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminSettings;
