import React from 'react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    return (
        <div className="min-h-screen w-full text-gray-100 flex flex-col font-sans selection:bg-brand-red selection:text-white relative overflow-x-hidden">

            {/* GLOBAL BACKGROUND LAYERS */}
            <div className="fixed inset-0 z-[-1] bg-[#09090b]"> {/* Darker Base */}
                {/* 1. Subtle Radial Glow from top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-red/10 rounded-full blur-[120px] opacity-40 mix-blend-screen pointer-events-none" />

                {/* 2. Secondary Cool Glow for contrast */}
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] opacity-30 pointer-events-none" />

                {/* 3. Texture Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] pointer-events-none" />
            </div>

            <Navbar />

            <main className="flex-grow pt-16 pb-20 md:pb-8 relative z-10">
                <Outlet />
            </main>

            <MobileBottomNav />

            <footer className="hidden md:block bg-black/20 backdrop-blur-md text-gray-500 py-8 text-center border-t border-white/5 mt-auto relative z-10">
                <div className="container mx-auto">
                    <p className="text-sm">© {new Date().getFullYear()} MicroHouse Games. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
