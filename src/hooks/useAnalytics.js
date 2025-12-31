import { useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment, getDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';

export const useAnalytics = () => {

    // Helper to get today's date ID (YYYY-MM-DD)
    const getTodayId = () => new Date().toISOString().split('T')[0];

    // --- GENERIC EVENT TRACKER (The Core) ---
    const trackEvent = useCallback(async (eventName, params = {}) => {
        try {
            // Log to console in dev for debugging
            if (import.meta.env.DEV) {
                console.log(`📊 [Analytics] ${eventName}:`, params);
            }

            // Prepare granular event data for "Event Stream"
            const eventData = {
                name: eventName,
                params: params,
                timestamp: serverTimestamp(),
                date: getTodayId(),
                userAgent: navigator.userAgent,
                path: window.location.pathname,
                sessionId: sessionStorage.getItem('mh_session_id') || 'unknown'
            };

            // Fire and forget - Unified Collection
            addDoc(collection(db, 'analytics_events'), eventData)
                .catch(err => console.error("Error logging generic event:", err));

        } catch (error) {
            console.error("Analytics Internal Error:", error);
        }
    }, []);

    // --- SPECIFIC WRAPPERS (For convenience & specific logic) ---

    // 1. Session Start (replaces trackVisit)
    const trackSessionStart = async () => {
        const SESSION_KEY = 'mh_session_tracked_' + getTodayId();

        if (sessionStorage.getItem(SESSION_KEY)) return; // Already tracked

        // Generate simple Session ID
        const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('mh_session_id', sessionId);
        sessionStorage.setItem(SESSION_KEY, 'true');

        try {
            // Geo-tracking (Preserved from old implementation)
            let city = 'Desconocido';
            try {
                const res = await fetch('https://ipapi.co/json/');
                if (res.ok) {
                    const data = await res.json();
                    if (data.city) city = data.city;
                }
            } catch (e) {
                console.warn('Geo-tracking failed:', e);
            }

            // Log event
            trackEvent('session_start', { city });

            // Maintain "Simple Counters" for fast dashboard loading (Legacy support + Fast KPI)
            // We keep this for the "Daily Visits" chart which relies on pre-aggregated data
            const todayId = getTodayId();
            const docRef = doc(db, 'analytics_days', todayId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                await updateDoc(docRef, {
                    totalVisits: increment(1),
                    [`cities.${city}`]: increment(1)
                });
            } else {
                await setDoc(docRef, {
                    date: todayId,
                    totalVisits: 1,
                    cities: { [city]: 1 }
                });
            }

        } catch (error) {
            console.error("Session Track Error:", error);
        }
    };

    // 2. View Item
    const trackViewItem = (product) => {
        // Prevent spam: only track view once per session per product? Enforce in UI or here?
        // Let's allow multiple views but maybe debounce? 
        // For now, raw event stream is fine.
        trackEvent('view_item', {
            id: product.id,
            title: product.title,
            price: product.price,
            currency: 'ARS' // Normalized
        });

        // Update Counter in Product Doc (Legacy/KPI)
        const productRef = doc(db, 'products', product.id);
        updateDoc(productRef, { viewCount: increment(1) }).catch(() => { });
    };

    // 3. Add to Cart
    const trackAddToCart = (product) => {
        trackEvent('add_to_cart', {
            id: product.id,
            title: product.title,
            price: product.price,
            quantity: 1
        });

        // Update Counter (Legacy/KPI)
        const productRef = doc(db, 'products', product.id);
        updateDoc(productRef, { cartCount: increment(1) }).catch(() => { });
    };

    // 4. Search
    const trackSearch = (term) => {
        if (!term || term.length < 3) return;
        trackEvent('search', { term });
    };

    // 5. Begin Checkout (WhatsApp Click)
    const trackBeginCheckout = (cartTotal, cartItems) => {
        trackEvent('begin_checkout', {
            value: cartTotal,
            currency: 'ARS',
            items: cartItems.map(i => ({ id: i.id, title: i.title, qty: i.quantity }))
        });
    };

    // 6. Reset Analytics (Danger Zone)
    const resetAnalytics = async () => {
        try {
            console.log("⚠️ STARTING ANALYTICS RESET...");

            // A. Delete 'analytics_events' collection
            // Firestore doesn't support "delete collection" client-side directly, must iterate.
            const eventsSnapshot = await getDocs(collection(db, 'analytics_events'));
            const deletePromises = eventsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log(`✅ Deleted ${deletePromises.length} events.`);

            // B. Delete 'analytics_days' collection (Legacy counters)
            const daysSnapshot = await getDocs(collection(db, 'analytics_days'));
            const deleteDaysPromises = daysSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteDaysPromises);
            console.log(`✅ Deleted ${deleteDaysPromises.length} daily records.`);

            // C. Reset Product Counters (viewCount, cartCount)
            const productsSnapshot = await getDocs(collection(db, 'products'));
            // Use batch for better performance/atomicity
            const batch = writeBatch(db); // Requires import
            productsSnapshot.docs.forEach(doc => {
                batch.update(doc.ref, {
                    viewCount: 0,
                    cartCount: 0
                });
            });
            await batch.commit();
            console.log(`✅ Reset counters for ${productsSnapshot.size} products.`);

            // D. Clear Session Storage
            sessionStorage.removeItem('mh_session_id');
            const todayId = getTodayId();
            sessionStorage.removeItem('mh_session_tracked_' + todayId);

            return true;
        } catch (error) {
            console.error("Critical Error Reseting Analytics:", error);
            throw error;
        }
    };

    return {
        trackEvent,
        trackSessionStart,
        trackViewItem,
        trackAddToCart,
        trackSearch,
        trackBeginCheckout,
        resetAnalytics
    };
};
