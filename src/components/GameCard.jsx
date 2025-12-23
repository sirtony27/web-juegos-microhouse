import React, { useState } from 'react';
import { Plus, Check, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/useCartStore'; // Fixing import path just in case
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import FadeImage from './ui/FadeImage';
import { toast } from 'sonner';

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
    const isPs3 = styleKey.includes('ps3') || styleKey.includes('playstation3');
    const isSwitch2 = styleKey.includes('switch2') || styleKey.includes('sw2') || styleKey.includes('nsw2');
    const isSwitch = (styleKey.includes('switch') || styleKey.includes('nintendo')) && !isSwitch2;
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
    else if (isPs3) platformConfig = {
        color: 'bg-slate-900',
        text: 'text-white',
        border: 'group-hover:border-slate-500',
        label: 'PS3',
        shadow: 'shadow-slate-500/20'
    };
    else if (isSwitch2) platformConfig = {
        color: 'bg-gradient-to-r from-red-600 to-orange-600',
        text: 'text-white',
        border: 'group-hover:border-orange-500',
        label: 'SWITCH 2',
        shadow: 'shadow-orange-500/20'
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

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(game);
        trackAddToCart(game.id);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);

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

    // Spotlight Effect Logic
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <Link
            to={`/game/${game.console}/${game.slug || game.id}`}
            className="block h-full group"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className={`h-full flex flex-col bg-brand-surface border border-white/5 rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${platformConfig.border} ${platformConfig.shadow} hover:shadow-2xl relative`}
            >
                {/* Spotlight Overlay */}
                <div
                    className="pointer-events-none absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 z-30"
                    style={{
                        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1), transparent 40%)`
                    }}
                />

                {/* Additional Border Spotlight */}
                <div
                    className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 z-30"
                    style={{
                        background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.15), transparent 40%)`,
                        maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
                        maskComposite: 'exclude',
                        WebkitMaskComposite: 'xor',
                        padding: '1px' // This simulates the border width
                    }}
                />

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
                        layoutId={`product-image-${game.id}`}
                    />

                    {/* Rating Badge (Metacritic Style) */}
                    {game.rating > 0 && (
                        <div className={`absolute top-8 left-2 z-20 flex items-center justify-center w-8 h-8 rounded border-2 shadow-lg backdrop-blur-md font-bold text-xs ${game.rating >= 75 ? 'bg-green-600/90 border-green-400 text-white' :
                            game.rating >= 50 ? 'bg-yellow-500/90 border-yellow-300 text-black' :
                                'bg-red-500/90 border-red-300 text-white'
                            }`}>
                            {game.rating}
                        </div>
                    )}

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
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleAddToCart}
                            className={clsx(
                                "absolute bottom-3 right-3 p-3 rounded-full shadow-xl transition-all z-20 flex items-center justify-center border border-white/10 backdrop-blur-sm",
                                isAdded ? "bg-green-600 text-white scale-110" : "bg-brand-red hover:bg-red-600 text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(230,36,41,0.6)]"
                            )}
                        >
                            {isAdded ? <Check size={20} /> : <Plus size={20} />}
                        </motion.button>
                    )}
                </div>

                {/* Info Area */}
                <div className="p-4 flex flex-col flex-grow relative z-20"> {/* z-20 to sit above spotlight */}
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
