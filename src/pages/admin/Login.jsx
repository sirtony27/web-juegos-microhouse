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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                    <div className="bg-brand-dark w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                        <Lock className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Acceso Administrativo</h1>
                    <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none transition-all"
                            placeholder="••••••••"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg animate-pulse">
                            Contraseña incorrecta. Inténtalo de nuevo.
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-brand-dark hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 hover:gap-4 group shadow-lg"
                    >
                        Ingresar al Panel
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <span className="text-xs text-gray-400">MicroHouse v1.0</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
