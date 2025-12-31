import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ShoppingBag, Search, DollarSign, ArrowRight, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { formatCurrency } from '../../utils/formatCurrency';

const AnalyticsDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false); // State for Minimize
    const { products } = useProductStore();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch last 30 days of events
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                const dateString = thirtyDaysAgo.toISOString().split('T')[0];

                const q = query(
                    collection(db, 'analytics_events'),
                    where('date', '>=', dateString),
                    orderBy('date', 'desc'),
                    limit(2000)
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => doc.data());
                setEvents(data);
            } catch (error) {
                console.error("Error fetching analytics events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // --- PROCESAMIENTO DE DATOS ---

    const metrics = useMemo(() => {
        if (!events.length) return null;

        // 1. Funnel Data (Unique Sessions per step)
        const sessions = {
            total: new Set(),
            view: new Set(),
            cart: new Set(),
            checkout: new Set()
        };

        // 2. Revenue Potential
        let potentialRevenue = 0;

        // 3. Search Terms
        const searchCounts = {};

        events.forEach(e => {
            if (e.sessionId) sessions.total.add(e.sessionId);

            if (e.name === 'view_item') {
                if (e.sessionId) sessions.view.add(e.sessionId);
            }
            if (e.name === 'add_to_cart') {
                if (e.sessionId) sessions.cart.add(e.sessionId);
            }
            if (e.name === 'begin_checkout') {
                if (e.sessionId) sessions.checkout.add(e.sessionId);
                if (e.params && e.params.value) potentialRevenue += parseFloat(e.params.value);
            }
            if (e.name === 'search' && e.params.term) {
                const term = e.params.term.toLowerCase();
                searchCounts[term] = (searchCounts[term] || 0) + 1;
            }
        });

        // Funnel Chart Data
        const funnelData = [
            { name: 'Visitas', value: sessions.total.size, fill: '#94a3b8' },
            { name: 'Vieron Prod.', value: sessions.view.size, fill: '#60a5fa' },
            { name: 'Agreg. Carrito', value: sessions.cart.size, fill: '#f59e0b' },
            { name: 'Intentó Compra', value: sessions.checkout.size, fill: '#10b981' }
        ];

        // Conversion Rate (Checkout / Total Sessions)
        const conversionRate = sessions.total.size > 0
            ? ((sessions.checkout.size / sessions.total.size) * 100).toFixed(1)
            : 0;

        // Top Searches
        const topSearches = Object.entries(searchCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([term, count]) => ({ term, count }));

        return { funnelData, potentialRevenue, topSearches, conversionRate };
    }, [events]);

    // Top Products by View Count (New Requirement)
    const topViewedProducts = useMemo(() => {
        return [...products]
            .map(p => ({ ...p, views: p.viewCount || 0 }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
    }, [products]);

    // Top Products by Conversion
    const topPerformingProducts = useMemo(() => {
        return [...products]
            .map(p => {
                const views = p.viewCount || 0;
                const carts = p.cartCount || 0;
                const rate = views > 0 ? (carts / views) * 100 : 0;
                return { ...p, views, carts, rate };
            })
            .sort((a, b) => b.rate - a.rate)
            .filter(p => p.views > 5)
            .slice(0, 5);
    }, [products]);


    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Analizando datos del negocio...</div>;
    if (!metrics) return <div className="p-8 text-center text-gray-500">Esperando datos de eventos... (Navega un poco para generar datos)</div>;

    // Header with Collapse Button
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">

            {/* Header / Toggle Bar */}
            <div
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="text-brand-accent" size={24} />
                        Métricas de Rendimiento
                    </h2>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">
                        {isCollapsed ? "Mostrar" : "Minimizar"}
                    </span>
                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
            </div>

            {/* Collapsible Content */}
            {!isCollapsed && (
                <div className="p-6 space-y-8 bg-white/50">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Revenue Potential */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign size={64} className="text-brand-accent" />
                            </div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Ventas Potenciales (30d)</h3>
                            <div className="text-2xl md:text-3xl font-display font-bold text-gray-900">
                                {formatCurrency(metrics.potentialRevenue)}
                            </div>
                            <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                                <TrendingUp size={12} /> Basado en intentos de Checkout
                            </p>
                        </div>

                        {/* Conversion Rate */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Tasa de Conversión</h3>
                            <div className="text-2xl md:text-3xl font-display font-bold text-gray-900">
                                {metrics.conversionRate}%
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Visitas &#8594; WhatsApp</p>
                        </div>

                        {/* Search Term Top */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Lo más buscado</h3>
                            {metrics.topSearches.length > 0 ? (
                                <div className="flex items-center gap-2">
                                    <Search size={16} className="text-brand-red" />
                                    <span className="text-lg font-bold text-gray-800 capitalize">{metrics.topSearches[0].term}</span>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{metrics.topSearches[0].count}</span>
                                </div>
                            ) : (
                                <span className="text-gray-400 italic text-sm">Sin datos aún</span>
                            )}
                            <p className="text-xs text-gray-400 mt-2">Demanda inatendida</p>
                        </div>
                    </div>

                    {/* Main Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Funnel Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <ShoppingBag size={18} className="text-blue-500" />
                                Embudo de Ventas
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics.funnelData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#6b7280', fontSize: 12 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Search Cloud Intelligence */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Search size={18} className="text-purple-500" />
                                Inteligencia de Búsqueda
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {metrics.topSearches.length > 0 ? metrics.topSearches.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg border border-gray-100 transition-colors cursor-default">
                                        <span className={`font-medium ${idx < 3 ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{item.term}</span>
                                        <span className="bg-white px-1.5 rounded text-[10px] font-bold text-gray-400 border border-gray-100">{item.count}</span>
                                    </div>
                                )) : (
                                    <p className="text-gray-400 text-sm">No hay suficientes búsquedas registradas.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tables Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Top Viewed Products (NEW) */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Eye size={18} className="text-indigo-500" />
                                    Más Vistos
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Producto</th>
                                            <th className="p-4 text-center font-bold text-indigo-600">Visitas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {topViewedProducts.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="p-4 font-medium text-gray-800 truncate max-w-[200px]">{p.title}</td>
                                                <td className="p-4 text-center text-gray-600 font-medium">{p.views}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {!topViewedProducts.length && (
                                    <div className="p-8 text-center text-gray-400 text-sm">Sin suficientes datos.</div>
                                )}
                            </div>
                        </div>

                        {/* Top Converting Products (EXISTING) */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-green-500" />
                                    Mejor Conversión
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Producto</th>
                                            <th className="p-4 text-center font-bold text-green-600">Tasa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {topPerformingProducts.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="p-4 font-medium text-gray-800 truncate max-w-[200px]">{p.title}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.rate > 10 ? 'bg-green-100 text-green-700' :
                                                            p.rate > 5 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {p.rate.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {!topPerformingProducts.length && (
                                    <div className="p-8 text-center text-gray-400 text-sm">Sin suficientes datos.</div>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
