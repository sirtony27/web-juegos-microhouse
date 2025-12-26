import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to where they came from or dashboard
    const from = location.state?.from?.pathname || '/admin/dashboard';

    const handleSubmit = (e) => {
        e.preventDefault();
        const success = login(password);
        if (success) {
            navigate(from, { replace: true });
        } else {
            setError(true);
            setPassword('');
            setTimeout(() => setError(false), 2000); // Clear error after 2s
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4 selection:bg-brand-red selection:text-white">
            {/* Background effects similar to MainLayout */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-red/20 rounded-full blur-[120px] opacity-20 pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
            </div>

            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/10 relative z-10">
                <div className="text-center mb-8">
                    <div className="bg-brand-red w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        <Lock className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Acceso Administrativo</h1>
                    <p className="text-gray-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red/50 outline-none transition-all font-medium bg-black/20"
                            placeholder="Ingrese su contraseña..."
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center font-medium bg-red-500/10 border border-red-500/20 py-2 rounded-lg animate-pulse">
                            Contraseña incorrecta. Inténtalo de nuevo.
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 hover:gap-4 group shadow-lg shadow-red-900/20"
                    >
                        Ingresar al Panel
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <span className="text-xs text-gray-500">MicroHouse Games Admin</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
