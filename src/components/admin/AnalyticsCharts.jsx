import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, MousePointerClick, Gamepad2 } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { useConsoleStore } from '../../store/useConsoleStore';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const AnalyticsCharts = () => {
    const [dailyStats, setDailyStats] = useState([]);
    const [topCities, setTopCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { products } = useProductStore();
    const { consoles } = useConsoleStore();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Daily Visits (Last 7 days)
                const daysRef = collection(db, 'analytics_days');
                const q = query(daysRef, orderBy('date', 'desc'), limit(7));
                const snapshot = await getDocs(q);

                let stats = [];
                let cityMap = {};

                snapshot.forEach(doc => {
                    const data = doc.data();
                    stats.push({
                        date: data.date.slice(5), // MM-DD
                        visitas: data.totalVisits
                    });

                    // Aggregate cities
                    if (data.cities) {
                        Object.entries(data.cities).forEach(([city, count]) => {
                            cityMap[city] = (cityMap[city] || 0) + count;
                        });
                    }
                });

                setDailyStats(stats.reverse()); // Show oldest to newest

                // Process Top Cities
                const citiesArray = Object.entries(cityMap)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);
                setTopCities(citiesArray);

            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Process Top Products (Views)
    const topViewed = [...products]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)
        .map(p => ({ name: p.title.substring(0, 15) + '...', value: p.viewCount || 0 }));

    // Process Platform Interest (Group Views by Console)
    const platformStats = products.reduce((acc, curr) => {
        const rawConsole = curr.console || 'Otros';
        // Try to find matching console by ID, Name or Slug
        const foundConsole = consoles.find(c => c.id === rawConsole || c.name === rawConsole || c.slug === rawConsole);
        let displayName = foundConsole ? foundConsole.name : rawConsole;

        // Fallback or Cleaning if no match found (mostly for legacy text data)
        if (!foundConsole) {
            const lower = rawConsole.toLowerCase();
            if (lower.includes('ps5') || lower.includes('playstation 5')) displayName = 'PlayStation 5';
            else if (lower.includes('ps4') || lower.includes('playstation 4')) displayName = 'PlayStation 4';
            else if (lower.includes('switch') || lower.includes('nintendo')) displayName = 'Nintendo Switch';
            else if (lower.includes('xbox')) displayName = 'Xbox';
        }

        acc[displayName] = (acc[displayName] || 0) + (curr.viewCount || 0);
        return acc;
    }, {});

    const platformData = Object.entries(platformStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Find the most popular platform
    const topPlatform = platformData.length > 0 ? platformData[0].name : '-';

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando métricas...</div>;

    return (
        <div className="space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase">Visitas (7 días)</h3>
                    </div>
                    <p className="text-2xl font-display font-bold text-gray-900">
                        {dailyStats.reduce((acc, curr) => acc + curr.visitas, 0)}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><MousePointerClick size={20} /></div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase">Total Vistas</h3>
                    </div>
                    <p className="text-2xl font-display font-bold text-gray-900">
                        {products.reduce((acc, p) => acc + (p.viewCount || 0), 0)}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Gamepad2 size={20} /></div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase">Plat. Favorita</h3>
                    </div>
                    <p className="text-2xl font-display font-bold text-gray-900 truncate">
                        {topPlatform}
                    </p>
                </div>
            </div>

            {/* Charts Vertical Stack */}
            <div className="space-y-6">

                {/* Traffic Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-6">Tendencia de Visitas</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="visitas" stroke="#E62429" strokeWidth={3} dot={{ r: 3, fill: '#E62429', strokeWidth: 2, stroke: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Cities */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Top Ciudades</h3>
                    <div className="space-y-3">
                        {topCities.length > 0 ? topCities.map((city, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-[10px] font-bold text-gray-500">{i + 1}</span>
                                    <span className="text-gray-700 font-medium truncate max-w-[100px]">{city.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${(city.value / topCities[0].value) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 w-4 text-right">{city.value}</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-400 text-xs">Sin datos.</p>
                        )}
                    </div>
                </div>

                {/* Platform Interest (Pie Chart) */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Interés por Plataforma</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={platformData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {platformData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold text-gray-400">
                                    VISTAS
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                            {platformData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-[10px] text-gray-500">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Most Viewed Games */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Más Vistos</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={topViewed}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#4B5563' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsCharts;
