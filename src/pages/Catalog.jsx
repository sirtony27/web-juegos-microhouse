import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useProductStore } from '../store/useProductStore';
import { useConsoleStore } from '../store/useConsoleStore';
import GameCard from '../components/GameCard';
import GameCardSkeleton from '../components/ui/GameCardSkeleton';
import { SearchX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CatalogFilters from '../components/catalog/CatalogFilters';
import { Helmet } from 'react-helmet-async';

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
    const { console: consoleParam } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { products: games, loading } = useProductStore();

    // Derived State from URL or Params
    // Priority: Route Param > Search Param > 'all'
    const activeConsole = consoleParam || 'all';
    const activeGenre = searchParams.get('genre') || null;
    const searchQuery = searchParams.get('search') || '';

    // Setters that update URL
    const setActiveConsole = (id) => {
        // Since we use route param /catalog/:console, we must Navigate
        if (id === 'all') navigate('/catalog/all'); // Or just /catalog if route exists
        else navigate(`/catalog/${id}`);
    };

    const setActiveGenre = (genre) => {
        const newParams = new URLSearchParams(searchParams);
        if (genre) newParams.set('genre', genre);
        else newParams.delete('genre');
        setSearchParams(newParams);
    };

    const setSearchQuery = (query) => {
        const newParams = new URLSearchParams(searchParams);
        if (query) newParams.set('search', query);
        else newParams.delete('search');
        setSearchParams(newParams, { replace: true }); // Replace to avoid massive history stack
    };

    // Handle Clear Filters
    const handleClearFilters = () => {
        setSearchParams({});
        if (activeConsole !== 'all') navigate('/catalog/all');
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

    // Advanced Filtering Logic - Removed Debounce for Fluidity (assuming <2000 items is fast enough)
    // If we really need debounce, we should only debounce the *filtering*, not the input state.
    // But keeping it direct is usually best for "instant" feel unless dataset is huge.
    const [sortBy, setSortBy] = useState('date'); // Default: Newest

    // Advanced Filtering Logic
    const filteredGames = useMemo(() => {
        return games.filter(game => {
            if (game.isHidden) return false;

            // 1. Console Filter
            if (activeConsole !== 'all') {
                const gameConsoleId = (game.console || '').toLowerCase();
                const targetConsoleId = activeConsole.toLowerCase();
                if (gameConsoleId !== targetConsoleId) return false;
            }

            // 2. Genre Filter
            if (activeGenre) {
                const gameTags = Array.isArray(game.tags) ? game.tags : [];
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
        }).sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'date':
                default:
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
            }
        });
    }, [games, activeConsole, activeGenre, searchQuery, sortBy]);

    // Reset pagination when filters change
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [activeConsole, activeGenre, searchQuery]);

    // Helper to reset (used in UI handlers)
    // ... not really needed with Effect but kept for legacy ref

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
            <Helmet>
                <title>{getTitle()} | MicroHouse Games</title>
                <meta name="description" content={`Explorá nuestro catálogo de juegos para ${activeConsole === 'all' ? 'todas las consolas' : activeConsole}. Encontrá tu próxima aventura.`} />
            </Helmet>
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
                    sortBy={sortBy}
                    setSortBy={setSortBy}
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

                {/* Results Grid - With AnimatePresence for Filtering */}
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
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6"
                        >
                            <AnimatePresence mode='popLayout'>
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
                            </AnimatePresence>
                        </motion.div>

                        {/* Loading Indicator / End of List */}
                        {visibleCount < filteredGames.length && (
                            <div className="py-8 text-center text-gray-500 animate-pulse">
                                Cargando más juegos...
                            </div>
                        )}
                    </>
                ) : (
                    /* Empty State - Simple Fade */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
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
            </div>
        </div>
    );
};

export default Catalog;
