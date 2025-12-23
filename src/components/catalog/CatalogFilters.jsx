import React, { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsoleStore } from '../../store/useConsoleStore';

const GENRES = ["Acción", "Aventura", "RPG", "FPS (Shooter)", "Deportes", "Carreras", "Pelea", "Estrategia", "Terror", "Simulación", "Infantil", "Mundo Abierto"];

const CatalogFilters = ({
    searchQuery, setSearchQuery,
    activeConsole, setActiveConsole,
    activeGenre, setActiveGenre,
    onClear,
    counts = {},
    availableGenres = []
}) => {
    const { consoles } = useConsoleStore();

    // Use dynamic genres if available, otherwise fallback (or empty)
    const displayGenres = availableGenres.length > 0 ? availableGenres : GENRES;

    // Custom Sort Order
    const sortOrder = [
        'Nintendo Switch 2',
        'PlayStation 5',
        'Nintendo Switch',
        'PlayStation 4',
        'Xbox Series',
        'PlayStation 3'
    ];

    // Prepare console tabs: "Todos" + sorted consoles with counts
    const consoleTabs = useMemo(() => {
        // 1. Sort available consoles
        const sortedConsoles = [...consoles].sort((a, b) => {
            const indexA = sortOrder.indexOf(a.name);
            const indexB = sortOrder.indexOf(b.name); // Corrected to use b.name

            // If both defined in list, sort by index
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If only A defined, A goes first
            if (indexA !== -1) return -1;
            // If only B defined, B goes first
            if (indexB !== -1) return 1;
            // Otherwise alphabetical
            return a.name.localeCompare(b.name);
        });

        const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

        return [
            { id: 'all', name: `Todos (${totalCount})` },
            ...sortedConsoles.map(c => ({
                id: c.id,
                name: `${c.name} (${counts[c.id] || 0})`
            }))
        ];
    }, [consoles, counts]);

    return (
        <div className="sticky top-20 z-30 bg-brand-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-8 shadow-2xl shadow-black/20">
            {/* Top Row: Search & Console Tabs */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b border-white/5 pb-4 mb-4">

                {/* Search Input */}
                <div className="relative w-full md:w-64 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-red transition-colors" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar juego..."
                        className="w-full bg-brand-bg/50 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-red transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Console Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
                    {consoleTabs.map((tab) => {
                        const isActive = activeConsole === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveConsole(tab.id)}
                                className={`relative px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/5 rounded-lg border border-white/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Row: Genre Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                    onClick={() => setActiveGenre(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${!activeGenre ? 'bg-brand-red text-white border-brand-red' : 'bg-brand-bg text-white/70 border-white/5 hover:border-white/20'}`}
                >
                    Todos los géneros
                </button>
                {displayGenres.map((genre) => (
                    <button
                        key={genre}
                        onClick={() => setActiveGenre(genre === activeGenre ? null : genre)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${activeGenre === genre ? 'bg-brand-red text-white border-brand-red shadow-[0_0_10px_rgba(230,36,41,0.4)]' : 'bg-brand-bg text-white/70 border-white/5 hover:border-white/20'}`}
                    >
                        {genre}
                    </button>
                ))}
            </div>

            {/* Clear All Button (Only if filters active) */}
            <AnimatePresence>
                {(searchQuery || activeConsole !== 'all' || activeGenre) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-3 mt-1 flex justify-end">
                            <button
                                onClick={onClear}
                                className="text-xs text-brand-red hover:text-red-400 font-medium flex items-center gap-1"
                            >
                                <X size={12} /> Limpiar filtros
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CatalogFilters;
