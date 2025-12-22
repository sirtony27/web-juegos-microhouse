import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useCartStore } from '../store/useCartStore';


const MobileBottomNav = () => {
    const location = useLocation();
    const totalItems = useCartStore((state) => state.getTotalItems());

    const navItems = [
        { icon: Home, label: 'Inicio', path: '/' },
        { icon: Grid, label: 'Catálogo', path: '/catalog/all' },
        { icon: ShoppingCart, label: 'Carrito', path: '/cart', badge: totalItems },
        { icon: MessageCircle, label: 'Contacto', path: '/contact' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-dark shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 border-t border-white/10">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className="flex flex-col items-center justify-center w-full h-full group relative"
                        >
                            <div className={twMerge(
                                "p-1 rounded-full transition-colors duration-200",
                                isActive ? "text-brand-red" : "text-gray-400 group-hover:text-gray-200"
                            )}>
                                <Icon className={twMerge("w-6 h-6 transition-transform duration-200", isActive && "scale-110")} />
                                {item.badge > 0 && (
                                    <span className="absolute top-2 right-4 bg-brand-red text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-brand-dark">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className={twMerge(
                                "text-[10px] font-medium mt-0.5 transition-colors duration-200",
                                isActive ? "text-brand-red" : "text-gray-400"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
