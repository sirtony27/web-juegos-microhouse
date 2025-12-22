import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Contact from './pages/Contact';
import GameDetail from './pages/GameDetail';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';
import PageTransition from './components/PageTransition';

import Login from './pages/admin/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import RequireAuth from './components/RequireAuth';

import { useProductStore } from './store/useProductStore';
import { useConsoleStore } from './store/useConsoleStore';
import { useSettingsStore } from './store/useSettingsStore';

import { useAnalytics } from './hooks/useAnalytics';

function App() {
  const location = useLocation();
  const { fetchProducts } = useProductStore();
  const { fetchConsoles } = useConsoleStore();
  const { fetchSettings } = useSettingsStore();
  const { trackVisit } = useAnalytics();

  useEffect(() => {
    const loadData = async () => {
      await fetchSettings();
      await Promise.all([
        fetchConsoles(),
        fetchProducts()
      ]);
      trackVisit(); // Track daily visit
    };
    loadData();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Toaster richColors theme="dark" position="top-center" />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Views */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<PageTransition><Home /></PageTransition>} />
            <Route path="catalog/:console" element={<PageTransition><Catalog /></PageTransition>} />
            <Route path="cart" element={<PageTransition><Cart /></PageTransition>} />
            <Route path="contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="game/:slug" element={<PageTransition><GameDetail /></PageTransition>} />
            <Route path="how-it-works" element={
              <PageTransition>
                <div className="container mx-auto p-8 text-center text-white">
                  <h1 className="text-2xl font-bold mb-4">¿Cómo funciona?</h1>
                  <p className="text-gray-400">El proceso es simple: Elegís los juegos que querés, nos enviás el pedido por WhatsApp y nosotros coordinamos el pago y la entrega.</p>
                </div>
              </PageTransition>
            } />
            {/* 404 Catch-all */}
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Route>

          {/* Admin Login (Standalone) */}
          <Route path="/admin/login" element={<Login />} />

          {/* Admin Protected Views (Restricted Layout) - No animations for admin to keep it snappy */}
          <Route path="/admin" element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
