import React, { useState, useEffect } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useConsoleStore } from '../../store/useConsoleStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Search, Calculator, ArrowRight, Save, RotateCcw, Filter, DollarSign, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculatePrice } from '../../utils/priceUtils';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';

const PriceManager = () => {
    const { products, fetchProducts } = useProductStore();
    const { consoles } = useConsoleStore();
    const { settings } = useSettingsStore();

    const [loading, setLoading] = useState(false);
    const [filterConsole, setFilterConsole] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Bulk Action State
    const [actionType, setActionType] = useState('DISCOUNT'); // DISCOUNT, INCREASE, MARGIN
    const [actionValue, setActionValue] = useState('');
    const [previewUpdates, setPreviewUpdates] = useState({}); // { sku: { newPrice, oldPrice, ... } }

    useEffect(() => {
        if (products.length === 0) fetchProducts();
    }, []);

    // Helper: Get Console Name
    const getConsoleName = (id) => consoles.find(c => c.id === id)?.name || id;

    // Filter Products
    const filteredProducts = products.filter(p => {
        let matchesConsole = true;
        if (filterConsole !== 'ALL') {
            matchesConsole = p.console === filterConsole;
            // Handle SKU prefix fallback if console ID mismatch
            if (!matchesConsole && filterConsole === 'PS4' && p.sku.startsWith('PS4')) matchesConsole = true;
            if (!matchesConsole && filterConsole === 'PS5' && p.sku.startsWith('PS5')) matchesConsole = true;
            if (!matchesConsole && filterConsole === 'NSW' && (p.sku.startsWith('NSW') || p.sku.startsWith('SW'))) matchesConsole = true;
        }

        const q = searchQuery.toLowerCase();
        const matchesSearch = p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
        return matchesConsole && matchesSearch;
    });

    // Handle Preview
    const handlePreview = () => {
        const val = parseFloat(actionValue);
        if (isNaN(val)) return toast.error("Ingresa un valor numérico válido");

        const updates = {};
        filteredProducts.forEach(p => {
            let updatesForProduct = null;

            if (actionType === 'DISCOUNT') {
                // Apply discount percentage
                // Assuming we update 'discountPercentage' field OR 'price' directly?
                // Usually better to update discount field.
                // Let's assume we update the discountPercentage field.
                updatesForProduct = {
                    discountPercentage: val,
                    // Recalculate final price for preview
                    previewPrice: p.price * (1 - val / 100) // Rough approx or use utils
                };
            } else if (actionType === 'INCREASE') {
                // Increase Base Price (Cost or Margin?)
                // Complex. Let's strictly do "Apply Discount" logic first as requested (-10%).
                // Or "Markup".
                // If INCREASE -> Maybe increase Margin?
                // Let's stick to DISCOUNT for now as it's safer.
                // Or "Clear Discount".
            }

            if (updatesForProduct) {
                // We actually want to calculate the REAL final price using the util
                // But simplified for now:
                // Only support Discount updating for now as it's the most common use case
                updates[p.id] = updatesForProduct;
            }
        });

        // Let's refine logic: 
        // 1. Discount: Update discountPercentage.
        // 2. Margin: Update customMargin.

        const batchUpdates = {};

        filteredProducts.forEach(p => {
            let newSettings = { ...p };

            if (actionType === 'DISCOUNT') {
                newSettings.discountPercentage = val;
            } else if (actionType === 'MARGIN') {
                newSettings.customMargin = val;
            }

            // Recalculate price
            const calculated = calculatePrice(
                p.costPrice,
                newSettings.customMargin || settings.defaultMargin,
                settings.vatRate,
                newSettings.discountPercentage || 0
            );

            batchUpdates[p.id] = {
                sku: p.sku,
                title: p.title,
                oldPrice: p.price,
                newPrice: calculated.finalPrice,
                changes: {
                    discountPercentage: newSettings.discountPercentage,
                    customMargin: newSettings.customMargin
                }
            };
        });

        setPreviewUpdates(batchUpdates);
        toast.success(`Vista previa aplicada a ${Object.keys(batchUpdates).length} productos`);
    };

    const applyChanges = async () => {
        const count = Object.keys(previewUpdates).length;
        if (count === 0) return;
        if (!confirm(`¿Confirmas actualizar ${count} productos? Esta acción no se puede deshacer fácilmente.`)) return;

        setLoading(true);
        try {
            const batch = writeBatch(db);

            Object.keys(previewUpdates).forEach(prodId => {
                const updateData = previewUpdates[prodId].changes;
                // Add explicit price update if needed, but usually price is derived. 
                // However, our system stores 'price' in Firestore for fast read.
                // So we MUST save the new calculated price.
                updateData.price = previewUpdates[prodId].newPrice;

                const ref = doc(db, "products", prodId);
                batch.update(ref, updateData);
            });

            await batch.commit();
            await fetchProducts(); // Refresh

            setPreviewUpdates({});
            setActionValue('');
            toast.success("Precios actualizados correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar precios");
        } finally {
            setLoading(false);
        }
    };

    const clearPreview = () => setPreviewUpdates({});

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Calculator className="text-blue-600" />
                Gestor de Precios Masivo
            </h1>

            {/* Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-6 items-end">

                {/* Filters */}
                <div className="flex-1 space-y-3">
                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                        <Filter size={16} /> Filtros
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={filterConsole}
                            onChange={e => setFilterConsole(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="ALL">Todas las Consolas</option>
                            {consoles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-48 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex-[2] bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-nowrap items-end gap-3">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Acción</label>
                        <select
                            value={actionType}
                            onChange={e => setActionType(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                        >
                            <option value="DISCOUNT">Aplicar Descuento (%)</option>
                            <option value="MARGIN">Fijar Margen (%)</option>
                        </select>
                    </div>

                    <div className="w-32">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Valor</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={actionValue}
                                onChange={e => setActionValue(e.target.value)}
                                placeholder="0"
                                className="w-full pl-3 pr-8 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <button
                        onClick={handlePreview}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
                    >
                        <Calculator size={16} />
                        Simular
                    </button>

                    {Object.keys(previewUpdates).length > 0 && (
                        <>
                            <button
                                onClick={applyChanges}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                <Save size={16} />
                                {loading ? 'Guardando...' : 'Aplicar'}
                            </button>
                            <button
                                onClick={clearPreview}
                                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                title="Deshacer simulación"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 border-b">Producto</th>
                                <th className="p-4 border-b text-center">Consola</th>
                                <th className="p-4 border-b text-right">Precio Actual</th>
                                <th className="p-4 border-b text-right w-48">Nuevo Precio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">
                                        No se encontraron productos con los filtros actuales.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map(product => {
                                    const update = previewUpdates[product.id];
                                    return (
                                        <tr key={product.id} className={`transition-colors ${update ? 'bg-purple-50/50' : 'hover:bg-gray-50'}`}>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{product.title}</div>
                                                <div className="text-xs text-gray-400 font-mono">{product.sku}</div>
                                                {update && (
                                                    <div className="text-xs text-purple-600 font-medium mt-1 inline-flex items-center gap-1">
                                                        {actionType === 'DISCOUNT' && `Descuento: ${update.changes.discountPercentage}%`}
                                                        {actionType === 'MARGIN' && `Margen: ${update.changes.customMargin}%`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">
                                                    {getConsoleName(product.console)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-mono text-gray-600">
                                                {formatCurrency(product.price)}
                                            </td>
                                            <td className="p-4 text-right font-mono">
                                                {update ? (
                                                    <span className="font-bold text-green-600 flex items-center justify-end gap-2">
                                                        {formatCurrency(update.newPrice)}
                                                        <ArrowRight size={14} />
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="text-center text-xs text-gray-400 mt-4">
                Mostrando {filteredProducts.length} productos
            </div>
        </div>
    );
};

export default PriceManager;
