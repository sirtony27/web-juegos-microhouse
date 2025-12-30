import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore'; // Changed from useConfigStore
import { useProductStore } from '../../store/useProductStore';
import ConsoleManager from '../../components/admin/ConsoleManager';
import { Save, ArrowLeft, CheckCircle, XCircle, Globe, Settings, RefreshCw, Trash } from 'lucide-react';
import { toast } from 'sonner';
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
                igdbClientSecret: settings.igdbClientSecret || '',
                exchangeRate: settings.exchangeRate || 1200,
                autoExchangeRate: settings.autoExchangeRate || false
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
            autoExchangeRate: formData.autoExchangeRate
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

                            {/* Dollar Exchange Logic */}
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <label className="block text-sm font-bold text-green-700 mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        Cotización Dólar (USD)
                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Base de Costo</span>
                                    </div>

                                    {/* Auto-Update Toggle */}
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-semibold ${formData.autoExchangeRate ? 'text-blue-600' : 'text-gray-400'}`}>
                                            Sync Automática (Dólar Blue)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const newValue = !formData.autoExchangeRate;
                                                setFormData(prev => ({ ...prev, autoExchangeRate: newValue }));

                                                if (newValue) {
                                                    // Trigger Auto-Fetch immediately
                                                    try {
                                                        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
                                                        const data = await res.json();
                                                        if (data && data.venta) {
                                                            setFormData(prev => ({ ...prev, exchangeRate: data.venta, autoExchangeRate: true }));
                                                            toast.success(`Cotización actualizada: $${data.venta} (DolarAPI)`);
                                                        }
                                                    } catch (error) {
                                                        toast.error("Error al obtener cotización automática");
                                                        console.error(error);
                                                    }
                                                }
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.autoExchangeRate ? 'bg-blue-600' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.autoExchangeRate ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </label>

                                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                    <div className="relative w-full md:w-1/3">
                                        <input
                                            type="number"
                                            name="exchangeRate"
                                            value={formData.exchangeRate}
                                            onChange={handleChange}
                                            disabled={formData.autoExchangeRate} // Disable manual input if auto is on
                                            className={`w-full p-3 pl-12 border rounded-xl outline-none transition-all font-mono text-xl ${formData.autoExchangeRate
                                                ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'
                                                : 'bg-white text-green-800 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 font-bold'}`}
                                            placeholder="1200"
                                        />
                                        <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg ${formData.autoExchangeRate ? 'text-gray-400' : 'text-green-600'}`}>$</span>
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">ARS</span>
                                    </div>

                                    <div className="flex-1">
                                        {formData.autoExchangeRate ? (
                                            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                                <RefreshCw size={14} className="animate-spin-slow" />
                                                <span>Sincronizando con <strong>DolarAPI.com</strong> (Venta Blue)</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                Ingresá el valor manualmente. Se usará para convertir los precios de la lista (USD) a pesos.
                                            </p>
                                        )}
                                        {settings.lastExchangeUpdate && (
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                Última act: {new Date(settings.lastExchangeUpdate).toLocaleString()}
                                            </p>
                                        )}
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
