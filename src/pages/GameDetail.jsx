import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';
import { useConsoleStore } from '../store/useConsoleStore';
import { formatCurrency } from '../utils/formatCurrency';
import { useCartStore } from '../store/useCartStore';
import { Check, ArrowLeft, Plus, Play, X, Tag } from 'lucide-react';
import GameCard from '../components/GameCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useAnalytics } from '../hooks/useAnalytics';
import { Helmet } from 'react-helmet-async';
import FadeImage from '../components/ui/FadeImage';

const GameDetail = () => {
    const { slug, console: consoleId } = useParams();
    const navigate = useNavigate();
    const addToCart = useCartStore((state) => state.addToCart);
    const { trackViewItem, trackAddToCart } = useAnalytics();

    const { products, loading } = useProductStore();

    // Find by slug and console (structured)
    let game = products.find(g => (g.slug === slug || g.id === slug) && g.console === consoleId);

    // Fallback: search just by slug if direct link or collision
    if (!game) {
        game = products.find(g => g.slug === slug || g.id === slug);
    }

    const { consoles } = useConsoleStore();

    // Resolve Console Name (Case insensitive match)
    const foundConsole = consoles.find(c =>
        (c.id === game?.console) ||
        (c.name === game?.console) ||
        (c.id.toLowerCase() === (game?.console || '').toLowerCase()) ||
        (c.name.toLowerCase() === (game?.console || '').toLowerCase())
    );
    const consoleName = foundConsole ? foundConsole.name : (game?.console || 'Sin Plataforma');

    // Normalize for styling
    const styleKey = (consoleName || '').toLowerCase().replace(/\s/g, '');
    const isPs5 = styleKey.includes('ps5') || styleKey.includes('playstation5');
    const isPs4 = styleKey.includes('ps4') || styleKey.includes('playstation4');
    const isPs3 = styleKey.includes('ps3') || styleKey.includes('playstation3');
    const isSwitch2 = styleKey.includes('switch2') || styleKey.includes('sw2') || styleKey.includes('nsw2');
    const isSwitch = (styleKey.includes('switch') || styleKey.includes('nintendo')) && !isSwitch2;


    const [isAdded, setIsAdded] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);

    // Extract YouTube ID from URL or use ID directly
    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const trailerId = game?.trailerId || getYouTubeId(game?.trailerUrl);

    useEffect(() => {
        if (game) {
            trackViewItem(game);
        }
    }, [game]);

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-red"></div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center text-white">
                <h2 className="text-2xl font-bold mb-4 font-display">Juego no encontrado</h2>
                <Link to="/catalog/all" className="text-brand-red hover:underline">Volver al catálogo</Link>
            </div>
        );
    }

    const handleAddToCart = () => {
        if (!game.stock) return;
        addToCart(game);
        trackAddToCart(game);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);

        // Rich Toast Notification
        toast.custom((t) => (
            <div className="flex items-center gap-3 w-full bg-brand-surface border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10">
                    <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-white font-bold text-sm truncate">{game.title}</span>
                    <span className="text-green-400 text-xs flex items-center gap-1">
                        <Check size={12} /> Agregado al carrito
                    </span>
                </div>
            </div>
        ), { duration: 2000 });
    };

    return (
        <div className="bg-brand-bg min-h-screen text-gray-100 pb-32 md:pb-12 font-sans">
            <Helmet>
                <title>{game.title} | MicroHouse Games</title>
                <meta name="description" content={`Comprá ${game.title} para ${consoleName} en MicroHouse Games. ${game.description ? game.description.substring(0, 150) + '...' : ''}`} />
                <meta property="og:title" content={`${game.title} - ${consoleName}`} />
                <meta property="og:description" content={game.description || `Conseguí ${game.title} al mejor precio en MicroHouse.`} />
                <meta property="og:image" content={game.image} />
                <meta property="og:type" content="product" />
            </Helmet>

            {/* Background Atmosphere */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-surface via-brand-bg to-black pointer-events-none z-0" />

            {/* Back Button */}
            <div className="relative z-10 container mx-auto px-4 pt-6 md:pt-8 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="font-medium hidden md:inline">Volver</span>
                </button>
            </div>

            <div className="relative z-10 container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col md:flex-row gap-8 lg:gap-16">

                    {/* LEFT COLUMN: IMAGE */}
                    <div
                        className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0"
                    >
                        <motion.div
                            className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5 aspect-[3/4] group"
                            layoutId={`product-image-${game.id}`}
                        >
                            <FadeImage
                                src={game.image}
                                alt={game.title}
                                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!game.stock ? 'grayscale opacity-50' : ''}`}
                                priority={true}
                            />
                            {!game.stock && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <span className="text-white px-6 py-2 font-display text-2xl font-bold tracking-widest border-2 border-white/20 bg-black/50 rounded-lg">AGOTADO</span>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: INFO */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-grow flex flex-col pt-2 md:pt-4"
                    >
                        {/* Tags & Console */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border ${isPs5 ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                                isPs4 ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                                    isPs3 ? 'bg-slate-700/50 text-slate-300 border-slate-500/50' :
                                        isSwitch2 ? 'bg-gradient-to-r from-red-900/50 to-orange-900/50 text-orange-200 border-orange-500/50' :
                                            'bg-red-500/10 text-red-300 border-red-500/20'}`
                            }>
                                {consoleName}
                            </span>

                            {/* RATING BADGE */}
                            {game.rating > 0 && (
                                <div className={`flex items-center justify-center px-2 py-1 rounded border font-bold text-xs ${game.rating >= 75 ? 'bg-green-600/20 border-green-500/30 text-green-400' :
                                    game.rating >= 50 ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                                        'bg-red-500/20 border-red-500/30 text-red-400'
                                    }`}>
                                    <span className="mr-1 opacity-70">★</span> {game.rating.toFixed(0)}
                                </div>
                            )}

                            {/* GENRES / TAGS */}
                            {game.tags && game.tags.length > 0 ? (
                                game.tags.map((tag, i) => (
                                    <span key={i} className="flex items-center gap-1 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                                        <Tag size={12} /> {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-600 italic">Sin género</span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-none mb-4">
                            {game.title}
                        </h1>

                        <p className="text-gray-400 text-lg mb-6 leading-relaxed max-w-2xl">
                            {game.description || "No hay descripción disponible para este título."}
                        </p>

                        <div className="flex items-end gap-6 mb-8 border-b border-white/5 pb-8">
                            <div>
                                <p className="text-sm text-gray-400 uppercase tracking-widest mb-1 font-semibold">Precio</p>
                                <span className="text-4xl md:text-5xl font-display font-bold text-brand-red drop-shadow-[0_0_15px_rgba(230,36,41,0.4)]">
                                    {formatCurrency(game.price)}
                                </span>
                            </div>

                            {/* WATCH TRAILER BUTTON */}
                            {trailerId && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowTrailer(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 group mb-2"
                                >
                                    <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Play size={14} fill="white" />
                                    </div>
                                    <span className="font-medium text-sm">Ver Trailer</span>
                                </motion.button>
                            )}
                        </div>



                        {/* Desktop Actions */}
                        <div className="hidden md:flex gap-4 mt-auto">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAddToCart}
                                disabled={!game.stock}
                                className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 ${!game.stock ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
                                    isAdded ? 'bg-green-600 text-white' : 'bg-brand-red text-white hover:bg-red-600 hover:shadow-[0_0_20px_rgba(230,36,41,0.4)] hover:scale-[1.02]'
                                    }`}
                            >
                                {isAdded ? <><Check /> Agregado</> : "Agregar al Carrito"}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Mobile Sticky Footer */}
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-brand-surface/95 backdrop-blur border-t border-white/10 md:hidden z-30">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Total</span>
                        <span className="text-xl font-bold text-white">{formatCurrency(game.price)}</span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={!game.stock}
                        className={`flex-1 py-3 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 ${!game.stock ? 'bg-gray-700' : isAdded ? 'bg-green-600' : 'bg-brand-red'}`}
                    >
                        {isAdded ? "Listo" : "Agregar"}
                    </button>
                </div>
            </div>


            {/* TRAILER MODAL */}
            <AnimatePresence>
                {showTrailer && trailerId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                        onClick={() => setShowTrailer(false)}
                    >
                        <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                            <button
                                onClick={() => setShowTrailer(false)}
                                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SIMILAR GAMES SECTION */}
            {/* SIMILAR GAMES SECTION */}
            <div className="container mx-auto px-4 mt-16 md:mt-24 border-t border-white/5 pt-12">
                <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-8 bg-brand-red rounded-full block"></span>
                    También te podría gustar
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {useProductStore.getState().products
                        .filter(p => p.id !== game.id && !p.isHidden)
                        .map(p => {
                            // Scoring System for Relevance
                            let score = 0;
                            // 1. Same Console (High priority)
                            if (p.console === game.console) score += 10;
                            // 2. Shared Tags (Medium priority)
                            if (p.tags && game.tags) {
                                const shared = p.tags.filter(t => game.tags.includes(t));
                                score += shared.length * 2;
                            }
                            return { ...p, score };
                        })
                        .filter(p => p.score > 0) // Only show relevant games
                        .sort((a, b) => b.score - a.score) // Sort by relevance
                        .slice(0, 4)
                        .map(relatedGame => (
                            <div key={relatedGame.id} className="h-full">
                                <GameCard game={relatedGame} />
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default GameDetail;
