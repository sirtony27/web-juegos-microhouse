import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';
import { useConsoleStore } from '../store/useConsoleStore';
import GameCard from '../components/GameCard';
import GameCardSkeleton from '../components/ui/GameCardSkeleton';
import { SearchX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CatalogFilters from '../components/catalog/CatalogFilters';

const GENRE_TRANSLATIONS = {
    "Action": "Acción",
    "Adventure": "Aventura",
    "Arcade": "Arcade",
    "Board Games": "Juegos de Mesa",
    "Card": "Cartas",
    "Card & Board Game": "Cartas y Mesa",
    "Casual": "Casual",
    "Educational": "Educativo",
    "Family": "Familiar",
    "Fighting": "Pelea",
    "Indie": "Indie",
    "Massively Multiplayer": "MMO",
    "Music": "Música",
    "Platformer": "Plataformas",
    "Platform": "Plataformas",
    "Puzzle": "Puzles",
    "Racing": "Carreras",
    "RPG": "RPG",
    "Role-playing (RPG)": "RPG",
    "Shooter": "Disparos",
    "Simulation": "Simulación",
    "Simulator": "Simulación",
    "Sports": "Deportes",
    "Strategy": "Estrategia",
    "Turn-based strategy (TBS)": "Estrategia por Turnos",
    "Real Time Strategy (RTS)": "Estrategia en Tiempo Real",
    "Point-and-click": "Aventura Gráfica",
    "Hack and slash/Beat 'em up": "Hack & Slash",
    "Tactical": "Táctico",
    "Visual Novel": "Novela Visual"
};

const Catalog = () => {
    const { console } = useParams();
    const { products: games, loading } = useProductStore();

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

    // Pagination State (Persisted)
    const ITEMS_PER_PAGE = 24;
    const [visibleCount, setVisibleCount] = useState(() => {
        const saved = sessionStorage.getItem('catalog-visible-count');
        return saved ? parseInt(saved) : ITEMS_PER_PAGE;
    });

    useEffect(() => {
        sessionStorage.setItem('catalog-visible-count', visibleCount);
    }, [visibleCount]);

    // Restore Scroll
    useEffect(() => {
        const savedScroll = sessionStorage.getItem('catalog-scroll');
        if (savedScroll) {
            window.scrollTo(0, parseInt(savedScroll));
        }

        const handleScrollSave = () => {
            sessionStorage.setItem('catalog-scroll', window.scrollY);
        };
        window.addEventListener('scroll', handleScrollSave);
        return () => window.removeEventListener('scroll', handleScrollSave);
    }, []);

    // Advanced Filtering Logic
    const filteredGames = useMemo(() => {
        return games.filter(game => {
            if (game.isHidden) return false;
            // 1. Console Filter
            if (activeConsole !== 'all' && game.console !== activeConsole) return false;
            // 2. Genre Filter
            if (activeGenre) {
                const gameTags = Array.isArray(game.tags) ? game.tags : [];
                // Check if any of the game's tags (translated) matches the active genre
                const hasMatchingGenre = gameTags.some(t => {
                    const translated = GENRE_TRANSLATIONS[t] || GENRE_TRANSLATIONS[t.trim()] || t;
                    return translated === activeGenre;
                });

                if (!hasMatchingGenre) return false;
            }
            // 3. Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!game.title.toLowerCase().includes(query)) return false;
            }
            return true;
        });
    }, [games, activeConsole, activeGenre, searchQuery]);

    // Reset pagination when filters change (Explicit User Action)
    useEffect(() => {
        // Only reset if filters *actually* changed, not just on mount
        // We can track prev filters or just assume explicit action resets it.
        // For now, let's keep it simple: if search/console/genre changes, reset.
        // BUT we need to avoid resetting on initial mount if we want to restore state?
        // Actually, if we navigate back, activeConsole comes from URL.

        // This effect might conflict with restoring state.
        // Let's rely on the user manually clearing filters or changing them.
        // If the URL param changes, we SHOULD reset.
    }, [activeConsole, activeGenre, searchQuery]);

    // Helper to reset (used in UI handlers)
    const resetPagination = () => {
        setVisibleCount(ITEMS_PER_PAGE);
        sessionStorage.setItem('catalog-visible-count', ITEMS_PER_PAGE);
        sessionStorage.setItem('catalog-scroll', 0);
    };

    // Derived Visible Games
    const visibleGames = useMemo(() => {
        return filteredGames.slice(0, visibleCount);
    }, [filteredGames, visibleCount]);

    // Infinite Scroll / Load More Logic
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                setVisibleCount(prev => {
                    if (prev >= filteredGames.length) return prev;
                    return prev + ITEMS_PER_PAGE;
                });
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [filteredGames.length]);


    // Helper: Get Title
    const { consoles } = useConsoleStore();
    const getTitle = () => {
        if (activeConsole !== 'all') {
            const consoleObj = consoles.find(c => c.id === activeConsole);
            return consoleObj ? `Catálogo ${consoleObj.name}` : 'Catálogo';
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
                {/* Command Bar Filters */}
                <CatalogFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeConsole={activeConsole}
                    setActiveConsole={setActiveConsole}
                    activeGenre={activeGenre}
                    setActiveGenre={setActiveGenre}
                    onClear={handleClearFilters}
                    counts={useMemo(() => {
                        const c = {};
                        games.forEach(g => {
                            const k = g.console;
                            c[k] = (c[k] || 0) + 1;
                        });
                        return c;
                    }, [games])}
                    availableGenres={useMemo(() => {
                        const genres = new Set();
                        games.forEach(game => {
                            if (Array.isArray(game.tags)) {
                                game.tags.forEach(tag => {
                                    // Normalize: Check translation or Capitalize
                                    const translated = GENRE_TRANSLATIONS[tag] || GENRE_TRANSLATIONS[tag.trim()] || tag;
                                    genres.add(translated);
                                });
                            }
                        });
                        return Array.from(genres).sort();
                    }, [games])}
                />

                {/* Results Grid */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <GameCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : visibleGames.length > 0 ? (
                        <>
                            <motion.div
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6"
                            >
                                {visibleGames.map(game => (
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

                            {/* Loading Indicator / End of List */}
                            {visibleCount < filteredGames.length && (
                                <div className="py-8 text-center text-gray-500 animate-pulse">
                                    Cargando más juegos...
                                </div>
                            )}
                        </>
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
