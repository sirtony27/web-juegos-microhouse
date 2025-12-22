import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export const useCartStore = create(
    persist(
        (set, get) => ({
            cart: [],

            addToCart: (game) => {
                const { cart } = get();
                const existingItem = cart.find((item) => item.id === game.id);

                if (existingItem) {
                    set({
                        cart: cart.map((item) =>
                            item.id === game.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    });
                    toast.success('Cantidad actualizada', { description: game.title });
                } else {
                    set({ cart: [...cart, { ...game, quantity: 1 }] });
                    toast.success('Producto agregado', { description: game.title });
                }
            },

            removeFromCart: (id) => {
                const { cart } = get();
                set({ cart: cart.filter((item) => item.id !== id) });
            },

            decrementQuantity: (id) => {
                const { cart } = get();
                const existingItem = cart.find((item) => item.id === id);
                if (existingItem && existingItem.quantity > 1) {
                    set({
                        cart: cart.map((item) =>
                            item.id === id
                                ? { ...item, quantity: item.quantity - 1 }
                                : item
                        ),
                    });
                } else {
                    // Optional: Remove if quantity goes to 0? Or just keep at 1. 
                    // Usually decrementing at 1 removes it, let's allow removing via remove button separately or autoremove.
                    // For now, let's just remove it if it goes below 1
                    set({ cart: cart.filter((item) => item.id !== id) });
                }
            },

            clearCart: () => set({ cart: [] }),

            getTotalItems: () => {
                const { cart } = get();
                return cart.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalPrice: () => {
                const { cart } = get();
                return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            },
        }),
        {
            name: 'microhouse-cart-storage', // name of the item in the storage (must be unique)
        }
    )
);
