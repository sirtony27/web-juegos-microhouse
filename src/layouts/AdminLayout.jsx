import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const AdminLayout = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
            {/* Admin Header */}
            <header className="bg-brand-dark text-white shadow-md z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Left: Branding */}
                    <div className="flex items-center gap-3">
                        <Link to="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain bg-white rounded-full p-0.5" />
                            <span className="font-bold text-lg tracking-tight">MicroHouse</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-xs font-semibold text-gray-300 uppercase tracking-wider">
                            <ShieldCheck size={12} />
                            Panel Admin
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4">
                        <Link to="/" target="_blank" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                            <ExternalLink size={16} />
                            <span className="hidden sm:inline">Ver Tienda</span>
                        </Link>
                        <div className="h-6 w-px bg-white/20"></div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white px-3 py-1.5 rounded transition-all"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow container mx-auto px-4 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-200 py-4 text-center text-xs text-gray-500">
                Panel de Administración &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
};

export default AdminLayout;
