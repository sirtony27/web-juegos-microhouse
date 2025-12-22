import React, { useState, useEffect } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useConfigStore } from '../../store/useConfigStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { RefreshCw, Edit, Eye, EyeOff, Trash, Plus, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ProductModal from '../../components/admin/ProductModal';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { products, toggleVisibility, deleteProduct, syncPricesFromSheet } = useProductStore();
    const { defaultMargin } = useConfigStore();
    const logout = useAuthStore((state) => state.logout);

    const [searchTerm, setSearchTerm] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncResult, setLastSyncResult] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const openModal = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm md:bg-transparent md:p-0 md:shadow-none">
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

            {lastSyncResult && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 border border-blue-200">
                    {lastSyncResult}
                </div>
            )}

            {/* Filters & Table */}
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
                                        <img src={product.image} alt="" className="w-10 h-10 rounded object-cover bg-gray-200" />
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
                                            <span className="text-gray-400 text-xs">{defaultMargin}% (Global)</span>
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
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                title="Ocultar/Mostrar"
                                                onClick={() => toggleVisibility(product.id)}
                                                className={`p-1.5 rounded hover:bg-gray-200 ${product.isHidden ? 'text-red-500' : 'text-gray-400'}`}
                                            >
                                                {product.isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                onClick={() => openModal(product)}
                                                className="p-1.5 rounded hover:bg-blue-100 text-blue-600 hidden sm:block"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => { if (window.confirm('Eliminar?')) deleteProduct(product.id) }}
                                                className="p-1.5 rounded hover:bg-red-100 text-red-600"
                                                title="Eliminar"
                                            >
                                                <Trash size={18} />
                                            </button>
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

            {/* Modal */}
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productToEdit={selectedProduct}
            />
        </div>
    );
};

export default AdminDashboard;
