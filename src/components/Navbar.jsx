import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

import fullLogo from '../assets/logo-completo.png';

const Navbar = () => {
    const totalItems = useCartStore((state) => state.getTotalItems());

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-brand-surface/90 backdrop-blur-md border-b border-white/5 shadow-2xl transition-all">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-2 group">
                    <img
                        src={fullLogo}
                        alt="MicroHouse"
                        className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                    />
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <Link to="/" className="text-slate-300 hover:text-white font-medium hover:scale-105 transition-all">Inicio</Link>
                    <Link to="/catalog/all" className="text-slate-300 hover:text-white font-medium hover:scale-105 transition-all">Catálogo</Link>
                    <Link to="/contact" className="text-slate-300 hover:text-white font-medium hover:scale-105 transition-all">Contacto</Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Link to="/cart" className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all">
                        <ShoppingCart size={24} />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                                {totalItems}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
