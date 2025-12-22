import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Gamepad2, Disc, Play, MapPin, MousePointerClick, Truck, Package, HelpCircle } from 'lucide-react';
import { useConsoleStore } from '../store/useConsoleStore';

const Home = () => {
    // Stagger Text Animation Constants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
    };

    // Dynamic Consoles
    const { consoles } = useConsoleStore();
    const activeConsoles = consoles.filter(c => c.active);

    const getConsoleDetails = (id) => {
        switch (id) {
            case 'ps5': return { subtitle: 'Next Gen Experience', icon: Gamepad2, color: 'from-blue-600 to-blue-800' };
            case 'ps4': return { subtitle: 'Clásicos Modernos', icon: Disc, color: 'from-blue-800 to-indigo-900' };
            case 'switch': return { subtitle: 'Diversión Portátil', icon: Play, color: 'from-red-600 to-red-700' };
            default: return { subtitle: 'Plataforma', icon: Gamepad2, color: 'from-gray-700 to-gray-900' };
        }
    };

    const scrollToHowItWorks = () => {
        const element = document.getElementById('how-it-works');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen pt-4 md:pt-12">
            {/* BACKGROUND DECORATION */}
            <div className="absolute inset-0 bg-grid-white/[0.04] pointer-events-none" />

            {/* Red Aurora/Spotlight Effect */}
            <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[600px] bg-brand-red/25 rounded-full blur-[130px] pointer-events-none mix-blend-screen animate-pulse duration-[5000ms]" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* HERO SECTION */}
            <section className="relative container mx-auto px-4 py-8 lg:py-10 flex flex-col items-center text-center">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-6 max-w-4xl z-10"
                >
                    {/* Location Badge */}
                    <motion.div variants={item} className="inline-flex items-center justify-center gap-2 mx-auto px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 backdrop-blur-md">
                        <MapPin size={14} className="text-brand-red" />
                        <span className="text-xs font-bold text-brand-red tracking-wider uppercase">Exclusivo Bahía Blanca y Zona</span>
                    </motion.div>

                    <motion.h1 variants={item} className="font-display font-bold text-5xl md:text-7xl lg:text-8xl tracking-tight text-white leading-tight">
                        Tu Próximo Juego, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-600 drop-shadow-sm">A Pedido.</span>
                    </motion.h1>

                    <motion.p variants={item} className="font-body text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        El catálogo más completo de juegos físicos para PS4, PS5 y Switch.
                        Elegís tu juego, nos encargamos del pedido y te lo traemos. <span className="text-white font-medium">Sin costos ocultos.</span>
                    </motion.p>

                    <motion.div variants={item} className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/catalog/all" className="px-8 py-3 bg-brand-red hover:bg-red-600 text-white font-bold rounded-lg shadow-lg shadow-brand-red/30 transition-all hover:scale-105 flex items-center justify-center">
                            Ver Catálogo Completo
                        </Link>
                        <button
                            onClick={scrollToHowItWorks}
                            className="px-8 py-3 bg-transparent border border-white/20 hover:bg-white/5 text-white font-bold rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                        >
                            <HelpCircle size={18} /> ¿Cómo funciona?
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* BENTO GRID (How It Works) */}
            <section id="how-it-works" className="container mx-auto px-4 py-12 scroll-mt-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <BentoCard
                        icon={MousePointerClick}
                        title="1. Elegís y Encargás"
                        desc="Explorá nuestro catálogo web y asegurá tu copia con un click."
                        delay={0.3}
                    />
                    <BentoCard
                        icon={Truck}
                        title="2. Lo Traemos"
                        desc="Procesamos tu pedido con el proveedor. En 24/48hs hábiles llega a nuestras oficinas."
                        delay={0.4}
                    />
                    <BentoCard
                        icon={Package}
                        title="3. Retirás o Recibís"
                        desc="Te avisamos cuando está listo. Pasás por tu sucursal más cercana o te lo enviamos."
                        delay={0.5}
                    />
                </div>
            </section>

            {/* CATEGORIES PREVIEW */}
            <section className="container mx-auto px-4 py-8 md:py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 flex items-center justify-between border-b border-white/5 pb-4"
                >
                    <h2 className="font-display font-bold text-3xl text-white">Explorá por Consola</h2>
                    <Link to="/catalog/all" className="text-brand-red font-medium hover:text-red-400 transition-colors flex items-center gap-1 group">
                        Ver todo <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {activeConsoles.map((console, index) => {
                        const defaultDetails = getConsoleDetails(console.id);
                        return (
                            <motion.div
                                key={console.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                            >
                                <CategoryCard
                                    title={console.name}
                                    subtitle={console.iconUrl ? 'Plataforma' : defaultDetails.subtitle}
                                    icon={defaultDetails.icon}
                                    iconUrl={console.iconUrl}
                                    color={defaultDetails.color}
                                    to={`/catalog/${console.id}`}
                                />
                            </motion.div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

// Bento Card Component
const BentoCard = ({ icon: Icon, title, desc, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay }}
        className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 transition-colors h-full"
    >
        <div className="w-12 h-12 rounded-xl bg-brand-surface border border-white/10 flex items-center justify-center mb-4 text-brand-red shadow-lg shadow-black/20">
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
);

// Category Card Subcomponent
const CategoryCard = ({ title, subtitle, icon: Icon, iconUrl, color, delay, to }) => (
    <Link to={to} className="block group h-full">
        <motion.div
            className="relative h-56 rounded-2xl overflow-hidden cursor-pointer border border-white/5 group-hover:border-white/20 transition-all shadow-lg hover:shadow-2xl hover:shadow-black/50"
        >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] group-hover:backdrop-blur-none transition-all duration-500" />

            <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                <div className="mb-auto p-3 bg-white/5 w-fit rounded-xl backdrop-blur-md text-white group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300 flex items-center justify-center min-w-[56px] min-h-[56px]">
                    {iconUrl ? (
                        <img src={iconUrl} alt={title} className="w-8 h-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                    ) : (
                        <Icon size={32} />
                    )}
                </div>
                <div className="transform group-hover:translate-y-[-5px] transition-transform duration-300">
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 group-hover:text-white transition-colors">{subtitle}</p>
                    <h3 className="font-display text-3xl font-bold text-white group-hover:text-white">{title}</h3>
                </div>
                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <ChevronRight className="text-white" size={28} />
                </div>
            </div>
        </motion.div>
    </Link>
);

export default Home;
