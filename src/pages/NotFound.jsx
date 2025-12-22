import React from 'react';
import { Link } from 'react-router-dom';
import { Ghost, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-brand-red/20 blur-[100px] rounded-full pointer-events-none" />

                <h1 className="relative font-display font-bold text-9xl text-white opacity-20 select-none">404</h1>

                <div className="absolute inset-0 flex items-center justify-center">
                    <Ghost size={80} className="text-brand-red drop-shadow-[0_0_15px_rgba(230,36,41,0.5)]" />
                </div>
            </motion.div>

            <h2 className="text-3xl font-display font-bold text-white mt-8 mb-4">
                Nivel no encontrado
            </h2>

            <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
                Parece que te has salido del mapa. Esta zona aún no ha sido desbloqueada o el enlace es incorrecto.
            </p>

            <Link
                to="/"
                className="flex items-center gap-2 px-8 py-3 bg-brand-red hover:bg-red-600 text-white font-bold rounded-lg transition-all hover:scale-105 shadow-lg shadow-brand-red/20"
            >
                <Home size={20} />
                Volver al Lobby
            </Link>
        </div>
    );
};

export default NotFound;
