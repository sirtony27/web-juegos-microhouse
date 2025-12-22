import React, { useState } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { AlertCircle, CheckCircle, Plus, Search, Loader, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const MissingProductsAlert = ({ onOpenModal }) => {
    const { getMissingProducts } = useProductStore();
    const [loading, setLoading] = useState(false);
    const [missingProducts, setMissingProducts] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleCheck = async () => {
        setLoading(true);
        setIsOpen(true);
        try {
            const missing = await getMissingProducts();
            setMissingProducts(missing);
            if (missing.length === 0) {
                toast.success("Todo sincronizado. No faltan productos.");
            } else {
                toast.warning(`Se detectaron ${missing.length} productos faltantes.`);
            }
        } catch (error) {
            toast.error("Error al buscar productos faltantes");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = (item) => {
        // Pre-fill modal data
        onOpenModal({
            sku: item.sku,
            title: item.name, // The parser might return lowercase, maybe capitalize first letter?
            costPrice: parseFloat(item.price.replace(/[$. ]/g, '').replace(',', '.')) || 0,
            stock: true,
            console: '' // User must select
        });
    };

    // Helper to capitalize title if it looks lowercased
    const formatTitle = (title) => {
        if (!title) return '';
        return title.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    if (!isOpen && !loading && !missingProducts) {
        return (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Search size={20} className="text-blue-500" />
                    Auditoria de Inventario
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Compara tu lista de Google Sheets con la base de datos para detectar juegos que faltan cargar.
                </p>
                <button
                    onClick={handleCheck}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <Search size={16} /> Verificar Faltantes
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center sticky top-0 z-10">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    {loading ? <Loader className="animate-spin text-blue-500" size={20} /> : <AlertCircle className="text-amber-500" size={20} />}
                    Productos Faltantes
                    {missingProducts && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{missingProducts.length}</span>}
                </h3>
                <div className="flex gap-2">
                    <button onClick={handleCheck} disabled={loading} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Recargar">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-xs text-gray-500 hover:text-gray-700 underline">
                        Cerrar
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto p-0 flex-grow custom-scrollbar">
                {loading && (
                    <div className="p-8 text-center text-gray-400">
                        <p>Analizando hoja de cálculo...</p>
                    </div>
                )}

                {!loading && missingProducts && missingProducts.length === 0 && (
                    <div className="p-8 text-center text-green-600 flex flex-col items-center gap-2">
                        <CheckCircle size={32} />
                        <p className="font-medium">¡Todo en orden!</p>
                        <p className="text-xs text-gray-400">Todos los productos del Excel están cargados.</p>
                    </div>
                )}

                {!loading && missingProducts && missingProducts.length > 0 && (
                    <div className="divide-y divide-gray-100">
                        {missingProducts.map((item, index) => (
                            <div key={index} className="p-3 hover:bg-amber-50 transition-colors flex items-center justify-between gap-3 group">
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 rounded">{item.sku}</span>
                                        <span className="text-xs font-bold text-gray-500">${item.price}</span>
                                    </div>
                                    <p className="text-sm text-gray-800 font-medium truncate capitalize" title={item.name}>
                                        {formatTitle(item.name)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleAdd(item)}
                                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm flex-shrink-0"
                                    title="Cargar Producto"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MissingProductsAlert;
