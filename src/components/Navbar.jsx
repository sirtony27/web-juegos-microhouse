import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

import fullLogo from '../assets/logo-completo.png';

const Navbar = () => {
    const totalItems = useCartStore((state) => state.getTotalItems());
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/catalog/all?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

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
                <div className="flex items-center gap-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="hidden md:flex items-center relative group">
                        <input
                            type="text"
                            placeholder="Buscar juegos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-4 pr-10 text-sm text-gray-200 focus:outline-none focus:bg-white/10 focus:border-brand-red/50 w-48 transition-all group-hover:w-64 placeholder:text-gray-500"
                        />
                        <button type="submit" className="absolute right-3 text-gray-400 hover:text-white transition-colors">
                            <Search size={16} />
                        </button>
                    </form>
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
