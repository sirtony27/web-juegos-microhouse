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

    // Resolve styling config
    let platformConfig = {
        color: 'bg-neutral-800', // Default
        text: 'text-neutral-200',
        border: 'border-white/10',
        label: game.console,
        shadow: ''
    };

    if (isPs5) platformConfig = {
        color: 'bg-white',
        text: 'text-black',
        border: 'group-hover:border-blue-500',
        label: 'PS5',
        shadow: 'shadow-blue-500/20',
        logoColor: 'text-black'
    };
    else if (isPs4) platformConfig = {
        color: 'bg-[#003791]',
        text: 'text-white',
        border: 'group-hover:border-[#003791]',
        label: 'PS4',
        shadow: 'shadow-blue-900/20'
    };
    else if (isSwitch) platformConfig = {
        color: 'bg-[#e60012]',
        text: 'text-white',
        border: 'group-hover:border-[#e60012]',
        label: 'SWITCH',
        shadow: 'shadow-red-500/20'
    };
    else if (isXbox) platformConfig = {
        color: 'bg-[#107c10]',
        text: 'text-white',
        border: 'group-hover:border-[#107c10]',
        label: 'XBOX',
        shadow: 'shadow-green-500/20'
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(game);
        trackAddToCart(game.id);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };

    return (
        <Link to={`/game/${game.slug || game.id}`} className="block h-full group">
            <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className={`h-full flex flex-col bg-brand-surface border border-white/5 rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${platformConfig.border} ${platformConfig.shadow} hover:shadow-2xl relative`}
            >
                {/* Image Area */}
                <div className="relative w-full aspect-[3/4] bg-neutral-900 overflow-hidden">
                    {/* Platform Headstrip (Mimicking Box Art) */}
                    <div className={`absolute top-0 left-0 right-0 h-6 ${platformConfig.color} z-10 flex items-center justify-center shadow-md`}>
                        <span className={`text-[10px] font-black tracking-[0.2em] leading-none ${platformConfig.text}`}>
                            {platformConfig.label}
                        </span>
                        {/* Diagonal Cut/Slope for style */}
                        <div className="absolute top-full left-0 right-0 h-2 bg-gradient-to-b from-black/20 to-transparent"></div>
                    </div>

                    <FadeImage
                        src={game.image}
                        alt={game.title}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 mt-6 ${!game.stock ? 'opacity-40 grayscale' : ''}`}
                    />

                    {/* Discount Badge */}
                    {game.discountPercentage > 0 && (
                        <div className="absolute top-8 right-2 bg-brand-accent text-brand-bg text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm border border-brand-accent/50 font-display tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.4)] z-20">
                            -{game.discountPercentage}%
                        </div>
                    )}

                    {/* Out of Stock Badge */}
                    {!game.stock && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white text-xs font-bold px-3 py-1.5 rounded backdrop-blur-sm border border-white/10 font-display tracking-widest z-20">
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
                <div className="p-4 flex flex-col flex-grow relative">
                    <h3 className="font-display font-bold text-base text-white leading-tight line-clamp-2 min-h-[2.5rem] mb-2 group-hover:text-brand-red transition-colors">
                        {game.title}
                    </h3>

                    <div className="mt-auto flex items-end justify-between pt-2">
                        <div>
                            {game.discountPercentage > 0 && game.basePrice && (
                                <span className="text-xs text-gray-500 line-through font-medium block">
                                    {formatCurrency(game.basePrice)}
                                </span>
                            )}
                            <span className={clsx(
                                "font-display font-bold text-white transition-colors",
                                game.discountPercentage > 0 ? "text-lg text-brand-accent" : "text-xl"
                            )}>
                                {formatCurrency(game.price)}
                            </span>
                        </div>

                        {/* Small metadata text instead of badge since we have big header now */}
                        <span className="text-[10px] text-gray-500 font-mono">
                            {getShortConsoleName(consoleName)}
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default GameCard;
