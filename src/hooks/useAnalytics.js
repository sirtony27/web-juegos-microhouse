import { useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';

export const useAnalytics = () => {

    // Helper to get today's date ID (YYYY-MM-DD)
    const getTodayId = () => new Date().toISOString().split('T')[0];

    // 1. Initial Visit Tracking (Session based)
    const trackVisit = async () => {
        const SESSION_KEY = 'mh_session_tracked_' + getTodayId();

        if (sessionStorage.getItem(SESSION_KEY)) return; // Already tracked this session

        try {
            const todayId = getTodayId();
            const docRef = doc(db, 'analytics_days', todayId);

            // Get basic location data
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

            // check if doc exists to determine update or set
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
                    cities: { [city]: 1 },
                    deviceTypes: {} // placeholder for future
                });
            }

            sessionStorage.setItem(SESSION_KEY, 'true');

        } catch (error) {
            console.error("Analytics Error:", error);
        }
    };

    // 2. Track Product View
    const trackProductView = async (productId) => {
        const VIEW_KEY = `mh_view_${productId}`;
        if (sessionStorage.getItem(VIEW_KEY)) return; // Debounce views per session

        try {
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, {
                viewCount: increment(1)
            });
            sessionStorage.setItem(VIEW_KEY, 'true');
        } catch (error) {
            console.error("Track View Error:", error); // Fail silently usually
        }
    };

    // 3. Track Add To Cart
    const trackAddToCart = async (productId) => {
        try {
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, {
                cartCount: increment(1)
            });
        } catch (error) {
            console.error("Track Cart Error:", error);
        }
    };

    return { trackVisit, trackProductView, trackAddToCart };
};
