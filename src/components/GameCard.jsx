import React, { useState } from 'react';
import { Plus, Check, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/useCartStore'; // Fixing import path just in case
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import FadeImage from './ui/FadeImage';

import { useConsoleStore } from '../store/useConsoleStore';
import { useAnalytics } from '../hooks/useAnalytics';

const GameCard = ({ game }) => {
    const addToCart = useCartStore((state) => state.addToCart);
    const { consoles } = useConsoleStore(); // Get consoles from store
    const { trackAddToCart } = useAnalytics();

    const [imageError, setImageError] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    // Resolve Console Name
    const foundConsole = consoles.find(c => c.id === game.console || c.name === game.console);
    const consoleName = foundConsole ? foundConsole.name : game.console;

    // Normalize for styling (fuzzy match for 'ps5', 'ps4', 'switch', 'xbox')
    const styleKey = consoleName.toLowerCase().replace(/\s/g, '');
    const isPs5 = styleKey.includes('ps5') || styleKey.includes('playstation5');
    const isPs4 = styleKey.includes('ps4') || styleKey.includes('playstation4');
    const isSwitch = styleKey.includes('switch') || styleKey.includes('nintendo');
    const isXbox = styleKey.includes('xbox');

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(game);
        trackAddToCart(game.id);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };

    // Helper for short names on mobile cards
    const getShortConsoleName = (name) => {
        if (!name) return '';
        const n = name.toLowerCase();
        if (n.includes('playstation 5')) return 'PS5';
        if (n.includes('ps5')) return 'PS5';
        if (n.includes('playstation 4')) return 'PS4';
        if (n.includes('ps4')) return 'PS4';
        if (n.includes('switch')) return 'SWITCH';
        if (n.includes('xbox')) return 'XBOX';
        return name; // Fallback
    };

    return (
        <Link to={`/game/${game.slug || game.id}`} className="block h-full group">
            <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className="h-full flex flex-col bg-brand-surface border border-white/5 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(230,36,41,0.25)] hover:border-brand-red/50 relative"
            >
                {/* Image Area */}
                <div className="relative w-full aspect-[3/4] bg-neutral-900 overflow-hidden">
                    <FadeImage
                        src={game.image}
                        alt={game.title}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!game.stock ? 'opacity-40 grayscale' : ''}`}
                    />

                    {/* Discount Badge */}
                    {game.discountPercentage > 0 && (
                        <div className="absolute top-2 right-2 bg-brand-accent text-brand-bg text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm border border-brand-accent/50 font-display tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                            -{game.discountPercentage}%
                        </div>
                    )}

                    {/* Out of Stock Badge */}
                    {!game.stock && (
                        <div className="absolute top-2 left-2 bg-black/90 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm border border-white/10 font-display tracking-widest">
                            AGOTADO
                        </div>
                    )}

                    {/* Add Button */}
                    {game.stock && (
                        <button
                            onClick={handleAddToCart}
                            className={clsx(
                                "absolute bottom-3 right-3 p-3 rounded-full shadow-xl transition-all z-20 flex items-center justify-center border border-white/10 backdrop-blur-sm",
                                isAdded ? "bg-green-600 text-white scale-110" : "bg-brand-red hover:bg-red-600 text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(230,36,41,0.6)]"
                            )}
                        >
                            {isAdded ? <Check size={20} /> : <Plus size={20} />}
                        </button>
                    )}
                </div>

                {/* Info Area */}
                <div className="p-5 flex flex-col flex-grow relative">

                    <h3 className="font-display font-bold text-lg text-white leading-tight line-clamp-2 min-h-[3rem] mb-2 group-hover:text-brand-red transition-colors">
                        {game.title}
                    </h3>

                    <div className="mt-auto flex items-end justify-between pt-2">
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wider">Precio</p>
                            <div className="flex flex-col">
                                {game.discountPercentage > 0 && game.basePrice && (
                                    <span className="text-xs text-gray-500 line-through font-medium">
                                        {formatCurrency(game.basePrice)}
                                    </span>
                                )}
                                <span className={clsx(
                                    "font-display font-bold text-white group-hover:text-brand-red transition-colors",
                                    game.discountPercentage > 0 ? "text-xl text-brand-accent group-hover:text-brand-accent" : "text-2xl"
                                )}>
                                    {formatCurrency(game.price)}
                                </span>
                            </div>
                        </div>

                        <span className={clsx(
                            "text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border whitespace-nowrap",
                            isPs5 ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                                isPs4 ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                                    isSwitch ? 'bg-red-500/10 text-red-300 border-red-500/20' :
                                        isXbox ? 'bg-green-500/10 text-green-300 border-green-500/20' :
                                            'bg-gray-500/10 text-gray-300 border-gray-500/20'
                        )}>
                            {getShortConsoleName(consoleName)}
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default GameCard;
