import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore'; // Changed from useConfigStore
import { useProductStore } from '../../store/useProductStore';
import ConsoleManager from '../../components/admin/ConsoleManager';
import { Save, ArrowLeft, CheckCircle, XCircle, Globe, Settings, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AdminSettings = () => {
    const navigate = useNavigate();
    // Use Firestore Store
    const { settings, fetchSettings, updateSettings } = useSettingsStore();
    const { recalculatePrices } = useProductStore();

    // Local state for form
    const [formData, setFormData] = useState({
        sheetUrl: '',
        defaultMargin: 30,
        vatRate: 21,
        enableVatGlobal: false
    });

    const [saved, setSaved] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState(null); // 'success', 'error', null
    const [isTechUnlocked, setIsTechUnlocked] = useState(false); // Safety Lock

    useEffect(() => {
        fetchSettings(); // Force fetch on mount
    }, []);

    useEffect(() => {
        if (settings) {
            setFormData({
                sheetUrl: settings.sheetUrl || '',
                defaultMargin: settings.globalMargin !== undefined ? settings.globalMargin : 30,
                vatRate: settings.vatRate !== undefined ? settings.vatRate : 21,
                enableVatGlobal: settings.enableVatGlobal || false,
                rawgApiKey: settings.rawgApiKey || '',
                youtubeApiKey: settings.youtubeApiKey || '',
                igdbClientId: settings.igdbClientId || '',
                igdbClientSecret: settings.igdbClientSecret || ''
            });
        }
    }, [settings]);

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

        try {
            const response = await fetch(formData.sheetUrl);
            if (response.ok) {
                const text = await response.text();
                // Simple check if it looks like a CSV
                if (text.includes(',') || text.includes(';')) {
                    setVerifyStatus('success');
                } else {
                    console.warn("URL reachable but content doesn't look like CSV");
                    setVerifyStatus('warning');
                }
            } else {
                setVerifyStatus('error');
            }
        } catch (error) {
            console.error(error);
            setVerifyStatus('error');
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
            igdbClientSecret: formData.igdbClientSecret
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

                        {/* Pricing Logic */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2">
                                <span className="bg-green-100 p-2 rounded-lg text-green-700"><Globe size={20} /></span>
                                Lógica de Precios
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Margen de Ganancia Global (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="defaultMargin"
                                            value={formData.defaultMargin}
                                            onChange={handleChange}
                                            className="form-input text-lg font-bold"
                                        />
                                        <span className="absolute right-4 top-3 text-gray-400 font-bold">%</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Margen base aplicado a productos sin configuración manual.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Tasa de IVA / Impuestos (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="vatRate"
                                            value={formData.vatRate}
                                            onChange={handleChange}
                                            className="form-input text-lg font-bold"
                                        />
                                        <span className="absolute right-4 top-3 text-gray-400 font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-4">
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            name="enableVatGlobal"
                                            checked={formData.enableVatGlobal}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Forzar IVA Globalmente</span>
                                        <span className="block text-xs text-gray-500">Sobrescribe configuraciones individuales de productos.</span>
                                    </div>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => recalculatePrices()}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors mt-2 border border-gray-200"
                                >
                                    <RefreshCw size={18} />
                                    Recalcular Catalog (Precios y URLs)
                                </button>
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
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminSettings;
