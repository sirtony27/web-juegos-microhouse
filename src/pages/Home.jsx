import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Gamepad2, Disc, Play, MapPin, MousePointerClick, Truck, Package, HelpCircle } from 'lucide-react';
import { useConsoleStore } from '../store/useConsoleStore';
import { useCollectionStore } from '../store/useCollectionStore';
import { Helmet } from 'react-helmet-async'; // Import Helmet

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

    // Dynamic Collections
    const { collections, fetchCollections } = useCollectionStore();

    useEffect(() => {
        fetchCollections();
    }, []);

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
            <Helmet>
                <title>MicroHouse Games | Juegos Físicos a Pedido en Bahía Blanca</title>
                <meta name="description" content="Encargá tus juegos físicos de PS4, PS5 y Switch en Bahía Blanca. Catálogo completo, precios claros y entrega rápida." />
            </Helmet>
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
                    <motion.div variants={item} className="inline-flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-full bg-brand-red border border-brand-red/50 shadow-lg shadow-brand-red/20 mb-4">
                        <MapPin size={16} className="text-white" />
                        <span className="text-sm font-bold text-white tracking-wider uppercase">Exclusivo Bahía Blanca y Zona</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {activeConsoles.map((console, index) => {
                        const defaultDetails = getConsoleDetails(console.id);
                        const isNew = console.name?.toLowerCase().includes('switch 2');
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
                                    icon={defaultDetails.icon}
                                    iconUrl={console.iconUrl}
                                    to={`/catalog/${console.id}`}
                                    isNew={isNew}
                                />
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* COLLECTIONS SECTION */}
            <section className="container mx-auto px-4 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-8 flex items-center gap-4"
                >
                    <h2 className="font-display font-bold text-3xl text-white">Sagas y Colecciones Destacadas</h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((col, index) => (
                        <motion.div
                            key={col.id || col.title}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <CollectionCard
                                title={col.title}
                                keyword={col.keyword}
                                color={col.bgType === 'gradient' ? (col.color.replace('bg-gradient-to-br ', '')) : ''}
                                imageUrl={col.imageUrl}
                                extraOverlay={col.extraOverlay}
                            />
                        </motion.div>
                    ))}
                    {collections.length === 0 && (
                        <p className="col-span-full text-center text-gray-500">No hay colecciones destacadas.</p>
                    )}
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
        <div className="w-16 h-16 rounded-2xl bg-brand-surface border border-white/10 flex items-center justify-center mb-4 text-brand-red shadow-lg shadow-black/20">
            <Icon size={40} />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
    </motion.div>
);

// Category Card Subcomponent
const CategoryCard = ({ title, icon: Icon, iconUrl, to, isNew }) => (
    <Link to={to} className="block group h-full">
        <motion.div
            className="relative h-64 rounded-2xl overflow-hidden cursor-pointer border border-gray-800 bg-gradient-to-br from-gray-900 to-black group-hover:border-red-600 transition-all duration-300 shadow-lg group-hover:shadow-red-600/20 group-hover:-translate-y-1"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-500" />

            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center z-10 text-center">
                {/* Badge */}
                {isNew && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-lg z-20">
                        NUEVO
                    </div>
                )}

                <div className="mb-4 p-4 bg-white/5 rounded-full backdrop-blur-md text-white group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300 flex items-center justify-center w-20 h-20 shadow-inner border border-white/5">
                    {iconUrl ? (
                        <img src={iconUrl} alt={title} className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                    ) : (
                        <Icon size={40} />
                    )}
                </div>

                <div className="transform transition-transform duration-300">
                    <h3 className="font-display text-2xl md:text-3xl font-black text-white group-hover:text-red-500 transition-colors uppercase tracking-wider">{title}</h3>
                </div>
            </div>
        </motion.div>
    </Link>
);

// Collection Card Component
const CollectionCard = ({ title, keyword, color, imageUrl, extraOverlay }) => (
    <Link to={`/catalog/all?search=${keyword}`} className="block group">
        <div
            className={`relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-white/5 group-hover:border-white/20 transition-all shadow-lg bg-cover bg-center ${imageUrl ? 'bg-no-repeat' : `bg-gradient-to-br ${color}`}`}
            style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
        >
            {/* Overlay for Readability */}
            <div className={`absolute inset-0 transition-all duration-300 ${imageUrl ? 'bg-black/60 group-hover:bg-black/40' : (extraOverlay ? 'bg-black/70' : 'bg-black/50')}`} />

            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
                <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                    <h3 className="font-display text-2xl font-bold text-white mb-1 group-hover:text-brand-red transition-colors drop-shadow-md">{title}</h3>
                    <div className="flex items-center gap-2 text-gray-200 text-sm font-medium group-hover:text-white transition-colors drop-shadow-sm">
                        <span>Ver colección</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
        </div>
    </Link>
);

export default Home;
