import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, ExternalLink, MessageCircle, Instagram } from 'lucide-react';

const branches = [
    {
        id: 1,
        name: 'Casa Central',
        address: 'Alvarado 38',
        phone: '+54 9 291 576-4388',
        mapLink: 'https://maps.app.goo.gl/dj3n8BnZrMFyCo5P7',
        delay: 0
    },
    {
        id: 2,
        name: 'Sucursal Belgrano',
        address: 'Belgrano 118',
        phone: '+54 291 576-4388',
        mapLink: 'https://maps.app.goo.gl/DyDcS1PMm4ezVHmw5',
        delay: 0.1
    },
    {
        id: 3,
        name: 'Sucursal Villa Mitre',
        address: 'Maipú 1599',
        phone: '+54 291 470-5803',
        mapLink: 'https://maps.app.goo.gl/kNC8JoYJuqBN6DDd9',
        delay: 0.2
    }
];

const Contact = () => {
    return (
        <div className="min-h-screen bg-brand-bg pt-24 pb-16 md:pt-32 text-gray-100 font-sans">
            {/* Background Decor */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-surface via-brand-bg to-black pointer-events-none z-0" />

            <div className="relative z-10 container mx-auto px-4">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Nuestras Sucursales</h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Encontrá tu MicroHouse más cercano en Bahía Blanca. <br />
                        Estamos listos para asesorarte.
                    </p>
                </motion.div>

                {/* Branches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20 max-w-6xl mx-auto">
                    {branches.map((branch) => (
                        <motion.div
                            key={branch.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: branch.delay }}
                            className="bg-brand-surface border border-white/5 rounded-2xl p-6 md:p-8 hover:border-brand-red/30 hover:shadow-[0_0_20px_rgba(230,36,41,0.15)] transition-all group"
                        >
                            <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-brand-red group-hover:text-white transition-colors text-brand-red">
                                <MapPin size={24} />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 font-display">{branch.name}</h3>

                            <div className="space-y-3 mb-8">
                                <p className="text-gray-400 flex items-start gap-2">
                                    <span className="text-gray-500 mt-1"><MapPin size={14} /></span>
                                    {branch.address}
                                </p>
                                <p className="text-gray-400 flex items-center gap-2">
                                    <span className="text-gray-500"><Phone size={14} /></span>
                                    {branch.phone}
                                </p>
                            </div>

                            <a
                                href={branch.mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-brand-red font-bold text-sm tracking-wide uppercase hover:text-red-400 transition-colors"
                            >
                                Ver en Mapa <ExternalLink size={14} />
                            </a>
                        </motion.div>
                    ))}
                </div>

                {/* Support Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="max-w-2xl mx-auto text-center border-t border-white/5 pt-16"
                >
                    <h2 className="text-2xl font-bold text-white mb-8 font-display">¿Tenés dudas puntuales?</h2>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="https://wa.me/5492915764388"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-green-900/20"
                        >
                            <MessageCircle size={20} />
                            WhatsApp General
                        </a>

                        <a
                            href="https://www.instagram.com/microhouse.tecnologia/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-purple-900/20"
                        >
                            <Instagram size={20} />
                            @microhouse.tecnologia
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
