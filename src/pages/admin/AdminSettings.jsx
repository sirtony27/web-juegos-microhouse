import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore'; // Changed from useConfigStore
import { useProductStore } from '../../store/useProductStore';
import ConsoleManager from '../../components/admin/ConsoleManager';
import { Save, ArrowLeft, CheckCircle, XCircle, Globe } from 'lucide-react';
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

    useEffect(() => {
        fetchSettings(); // Force fetch on mount
    }, []);

    useEffect(() => {
        if (settings) {
            setFormData({
                sheetUrl: settings.sheetUrl || '',
                defaultMargin: settings.defaultMargin || 30,
                vatRate: settings.vatRate || 21,
                enableVatGlobal: settings.enableVatGlobal || false
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
                    setVerifyStatus('warning'); // Could separate this state
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
            globalMargin: formData.defaultMargin, // Map defaultMargin -> globalMargin (store uses globalMargin)
            vatRate: formData.vatRate,
            enableVatGlobal: formData.enableVatGlobal
        });

        // Auto recalculate prices when global config changes
        recalculatePrices();

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="flex justify-center w-full">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                        <ArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-dark">Configuración General</h1>
                        <p className="text-sm text-gray-500">Ajusta los parámetros globales de la tienda</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section 1: Data Source */}
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                                <Globe size={20} className="text-blue-600" /> Origen de Datos
                            </h2>
                            {settings?.lastSync && (
                                <span className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">
                                    Última Sync: {new Date(settings.lastSync).toLocaleString()}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                URL pública del CSV (Google Sheets)
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <input
                                        type="url"
                                        name="sheetUrl"
                                        value={formData.sheetUrl}
                                        onChange={handleChange}
                                        placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                                        className={`form-input pr-10 ${verifyStatus === 'success' ? 'form-input-success' :
                                                verifyStatus === 'error' ? 'form-input-error' : ''
                                            }`}
                                    />
                                    {verifyStatus === 'success' && <CheckCircle className="absolute right-3 top-3 text-green-600" size={20} />}
                                    {verifyStatus === 'error' && <XCircle className="absolute right-3 top-3 text-red-600" size={20} />}
                                </div>

                                <button
                                    type="button"
                                    onClick={verifyUrl}
                                    disabled={verifying || !formData.sheetUrl}
                                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap min-w-[100px]"
                                >
                                    {verifying ? '...' : 'Verificar'}
                                </button>
                            </div>
                            <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                <span>En Google Sheets: Archivo &gt; Compartir &gt; Publicar en la Web &gt; Formato CSV.</span>
                                {verifyStatus === 'success' && <span className="text-green-600 font-bold">¡Conexión Exitosa!</span>}
                                {verifyStatus === 'error' && <span className="text-red-600 font-bold">Error de conexión</span>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Pricing Logic */}
                    <div className="p-6 rounded-xl border border-gray-100">
                        <h2 className="text-lg font-bold text-brand-dark mb-4">Lógica de Precios</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Margen de Ganancia Global (%)
                                </label>
                                <input
                                    type="number"
                                    name="defaultMargin"
                                    value={formData.defaultMargin}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                                <p className="text-xs text-gray-500 mt-1">Se aplica si el producto no tiene margen personalizado.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    IVA (%)
                                </label>
                                <input
                                    type="number"
                                    name="vatRate"
                                    value={formData.vatRate}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, enableVatGlobal: !prev.enableVatGlobal }))}>
                            <input
                                type="checkbox"
                                id="enableVatGlobal"
                                name="enableVatGlobal"
                                checked={formData.enableVatGlobal}
                                onChange={handleChange}
                                className="w-5 h-5 text-brand-red rounded focus:ring-brand-red pointer-events-none" // pointer-events-none to let parent div handle click
                            />
                            <label htmlFor="enableVatGlobal" className="cursor-pointer font-medium text-gray-700 select-none pointer-events-none">
                                Aplicar IVA a todos los productos globalmente (Sobrescribe configuración individual)
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            className={`w-full font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${saved ? 'bg-green-600 text-white' : 'bg-brand-dark hover:bg-gray-800 text-white'
                                }`}
                        >
                            {saved ? <CheckCircle size={24} /> : <Save size={24} />}
                            {saved ? 'GUARDADO EXITOSAMENTE' : 'GUARDAR CAMBIOS'}
                        </button>
                    </div>
                </form>
                {/* ... Costos de Envío (existentes) ... */}

                {/* GESTIÓN DE PLATAFORMAS (NUEVO) */}
                <ConsoleManager />

            </div>
        </div>
    );
};

export default AdminSettings;
