import React, { useState, useEffect, useMemo } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { RefreshCw, Edit, Eye, EyeOff, Trash, Plus, Settings, LogOut, Search, DollarSign, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ProductModal from '../../components/admin/ProductModal';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';
import CollectionsModal from '../../components/admin/CollectionsModal';
import FadeImage from '../../components/ui/FadeImage';
import { useCollectionStore } from '../../store/useCollectionStore';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { products, toggleVisibility, deleteProduct, syncPricesFromSheet, recalculatePrices } = useProductStore();
    const { settings, fetchSettings, syncExchangeRate } = useSettingsStore(); // Added syncExchangeRate
    const { globalMargin } = settings;
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        const load = async () => {
            await fetchSettings();
            const updated = await syncExchangeRate(); // Silent check on mount
            if (updated) {
                recalculatePrices();
            }
        };
        load();
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncResult, setLastSyncResult] = useState(null);

    // Stale Price Logic
    const { daysSinceSync, isStale } = useMemo(() => {
        if (!settings.lastSync) return { daysSinceSync: -1, isStale: true };

        const last = new Date(settings.lastSync);
        const now = new Date();
        const diffTime = Math.abs(now - last);
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return { daysSinceSync: days, isStale: days > 3 };
    }, [settings.lastSync]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const openModal = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Newest first
    });

    const handleSync = async () => {
        setIsSyncing(true);
        setLastSyncResult(null);
        try {
            const result = await syncPricesFromSheet();
            setLastSyncResult(`Sincronizado: ${result.updated} precios actualizados.`);
        } catch (error) {
            setLastSyncResult('Error al sincronizar. Revisa la URL.');
            console.error(error); // Debugging
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm md:bg-transparent md:p-0 md:shadow-none">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-brand-dark">Panel de Administración</h1>
                    <p className="text-gray-500 text-sm md:text-base">Gestión de inventario y precios</p>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
                    <Link to="/admin/settings" className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 font-medium text-sm md:text-base">
                        <Settings size={18} /> <span className="hidden sm:inline">Configuración</span>
                    </Link>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg shadow font-bold text-white transition-all text-sm md:text-base ${isSyncing ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-medium text-sm md:text-base"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* STALE PRICE WARNING */}
            {isStale && (
                <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600 flex-shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900 text-lg">
                                {daysSinceSync === -1 ? '¡Atención! Precios nunca sincronizados' : `¡Atención! Precios desactualizados (${daysSinceSync} días)`}
                            </h3>
                            <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                                {daysSinceSync === -1
                                    ? 'Es la primera vez que ingresas. Sincroniza ahora para cargar los precios bases.'
                                    : `La última actualización fue el ${new Date(settings.lastSync).toLocaleDateString()}. Los costos del proveedor podrían haber cambiado.`}
                                <br className="hidden sm:block" /> Sincroniza ahora para evitar vender a pérdida.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-full sm:w-auto px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Actualizando...' : 'Actualizar Precios'}
                    </button>
                </div>
            )}

            {lastSyncResult && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 border border-blue-200 flex items-center gap-2">
                    <RefreshCw size={16} />
                    {lastSyncResult}
                </div>
            )}

            {/* NEW ANALYTICS DASHBOARD (Full Width) */}
            <div className="mb-8">
                <AnalyticsDashboard />
            </div>

            {/* Dashboard Content Grid (Filters & Table) */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] gap-6 items-start">

                {/* Left Column: Filters & Table */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <input
                                type="text"
                                placeholder="Buscar juego..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                            />
                            <button
                                onClick={() => openModal(null)}
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                                title="Agregar Producto"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs md:text-sm uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Producto</th>
                                        <th className="p-4 font-semibold text-right hidden md:table-cell">Costo (Prov.)</th>
                                        <th className="p-4 font-semibold text-center hidden md:table-cell">Margen</th>
                                        <th className="p-4 font-semibold text-right text-brand-dark">Precio Final</th>
                                        <th className="p-4 font-semibold text-center hidden sm:table-cell">Estado</th>
                                        <th className="p-4 font-semibold text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm md:text-base">
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="p-4 flex items-center gap-3">
                                                <FadeImage
                                                    src={product.image || 'https://placehold.co/40'}
                                                    alt={product.title}
                                                    className="w-10 h-10 rounded object-cover bg-gray-200"
                                                />
                                                <div className="max-w-[150px] md:max-w-xs truncate">
                                                    <div className="font-semibold text-gray-800 truncate" title={product.title}>{product.title}</div>
                                                    <div className="text-xs text-gray-400 truncate">{product.supplierName}</div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-mono text-gray-600 hidden md:table-cell">
                                                {product.costPrice ? formatCurrency(product.costPrice) : '-'}
                                            </td>
                                            <td className="p-4 text-center hidden md:table-cell">
                                                {product.customMargin ? (
                                                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">{product.customMargin}%</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">{globalMargin}% (Global)</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right font-bold text-brand-dark">
                                                {formatCurrency(product.price)}
                                            </td>
                                            <td className="p-4 text-center hidden sm:table-cell">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {product.stock ? 'STOCK' : 'AGOTADO'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => openModal(product)} className="text-blue-600 hover:text-blue-800 p-1"><Edit size={18} /></button>
                                                    <button onClick={() => toggleVisibility(product.id, product.isHidden)} className={`${product.isHidden ? 'text-gray-400' : 'text-green-600'} hover:opacity-80 p-1`}>
                                                        {product.isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                    {/* Eliminar (protegido si se requiere confirmación masiva, pero individual aquí) */}
                                                    <button onClick={() => { if (window.confirm('¿Eliminar?')) deleteProduct(product.id) }} className="text-red-500 hover:text-red-700 p-1"><Trash size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-gray-500">
                                                No se encontraron productos.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Analytics Sidebar (Sticky) */}
                <div className="lg:sticky lg:top-4 bg-gray-50/50 rounded-xl space-y-6">

                    {/* Tools Links (Moved to Top) */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-3 px-2">Acceso Rápido</h3>
                        <div className="space-y-3">
                            <Link to="/admin/audit" className="block bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Search size={20} />
                                    </div>
                                    <h4 className="font-bold text-gray-800">Auditoría de Inventario</h4>
                                </div>
                                <p className="text-xs text-gray-500">Detecta faltantes y enriquece datos.</p>
                            </Link>

                            <Link to="/admin/pricing" className="block bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <DollarSign size={20} />
                                    </div>
                                    <h4 className="font-bold text-gray-800">Gestor de Precios</h4>
                                </div>
                                <p className="text-xs text-gray-500">Edición masiva de márgenes y descuentos.</p>
                            </Link>

                            <button onClick={() => setIsCollectionsModalOpen(true)} className="block w-full text-left bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        <div className="w-5 h-5 flex items-center justify-center font-serif font-black text-lg leading-none">★</div>
                                    </div>
                                    <h4 className="font-bold text-gray-800">Destacados Home</h4>
                                </div>
                                <p className="text-xs text-gray-500">Gestionar colecciones y secciones destacadas.</p>
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 px-2">Tips de Gestión</h3>
                        {/* Old charts removed */}

                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                            <p className="text-xs text-blue-800">
                                <strong>Tip:</strong> Revisa la "Intención de Compra" para saber qué stock reponer antes de que los clientes te lo pidan.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal */}
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productToEdit={selectedProduct}
            />

            <CollectionsModal
                isOpen={isCollectionsModalOpen}
                onClose={() => setIsCollectionsModalOpen(false)}
            />
        </div>
    );
};

export default AdminDashboard;
