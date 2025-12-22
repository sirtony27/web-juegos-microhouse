import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';
import GameCard from '../components/GameCard';
import { SearchX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CatalogFilters from '../components/catalog/CatalogFilters';

const Catalog = () => {
    const { console } = useParams();
    const { products: games } = useProductStore();

    // Local State for Instant Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [activeConsole, setActiveConsole] = useState('all');
    const [activeGenre, setActiveGenre] = useState(null);

    // Initialize/Sync with URL param
    useEffect(() => {
        if (console) {
            setActiveConsole(console);
        } else {
            setActiveConsole('all');
        }
    }, [console]);

    // Handle Clear Filters
    const handleClearFilters = () => {
        setSearchQuery('');
        setActiveConsole('all');
        setActiveGenre(null);
    };

    // Advanced Filtering Logic
    const filteredGames = useMemo(() => {
        return games.filter(game => {
            if (game.isHidden) return false;

            // 1. Console Filter
            if (activeConsole !== 'all' && game.console !== activeConsole) return false;

            // 2. Genre Filter
            if (activeGenre) {
                // Ensure tags exist and are an array
                const gameTags = Array.isArray(game.tags) ? game.tags : [];
                if (!gameTags.some(t => t.toLowerCase() === activeGenre.toLowerCase())) return false;
            }

            // 3. Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!game.title.toLowerCase().includes(query)) return false;
            }

            return true;
        });
    }, [games, activeConsole, activeGenre, searchQuery]);

    const getTitle = () => {
        if (activeConsole !== 'all') {
            // Capitalize first letter strictly for display, or just use ID if simple
            // Better: Find name from store would be ideal, but for now simple capitalization
            return `Catálogo ${activeConsole.toUpperCase()}`;
        }
        return 'Catálogo Completo';
    };

    return (
        <div className="min-h-screen bg-brand-bg pb-20 pt-4 md:pt-12">
            <div className="container mx-auto px-4">

                {/* Header Title */}
                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-4xl font-display font-bold text-white mb-2">{getTitle()}</h1>
                    <p className="text-gray-400">Explora nuestra colección de títulos disponibles.</p>
                </div>

                {/* Command Bar Filters */}
                <CatalogFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeConsole={activeConsole}
                    setActiveConsole={setActiveConsole}
                    activeGenre={activeGenre}
                    setActiveGenre={setActiveGenre}
                    onClear={handleClearFilters}
                />

                {/* Results Grid */}
                <AnimatePresence mode="wait">
                    {filteredGames.length > 0 ? (
                        <motion.div
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6"
                        >
                            {filteredGames.map(game => (
                                <motion.div
                                    layout
                                    key={game.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <GameCard game={game} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        /* Empty State */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 text-center bg-brand-surface/30 rounded-3xl border border-white/5"
                        >
                            <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-xl">
                                <SearchX className="text-gray-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No encontramos juegos</h3>
                            <p className="text-gray-400 max-w-md mx-auto mb-6">
                                Intenta ajustar tus filtros o buscar con otros términos.
                            </p>
                            <button
                                onClick={handleClearFilters}
                                className="px-6 py-2 bg-brand-red text-white font-bold rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20"
                            >
                                Limpiar Filtros
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Catalog;
