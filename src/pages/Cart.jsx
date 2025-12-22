import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Trash2, ShoppingBag, ArrowLeft, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Cart = () => {
    const { cart, removeFromCart, decrementQuantity, addToCart, getTotalPrice } = useCartStore();
    const totalPrice = getTotalPrice();

    // WhatsApp Message Generator
    const handleWhatsAppClick = () => {
        const phoneNumber = "5492915764388"; // User provided number

        let message = "Hola MicroHouse! Quiero encargar los siguientes juegos:\n\n";

        cart.forEach(item => {
            message += `- ${item.title} x${item.quantity} (${formatCurrency(item.price * item.quantity)})\n`;
        });

        message += `\n*Total: ${formatCurrency(totalPrice)}*`;

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(url, '_blank');
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <ShoppingBag size={48} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-brand-dark mb-2">Tu carrito está vacío</h2>
                <p className="text-gray-500 mb-6 max-w-xs">¡Parece que aún no has elegido tu próxima aventura!</p>
                <Link to="/catalog/all" className="bg-brand-red text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-colors">
                    Ir al Catálogo
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pb-32 md:pb-12 max-w-3xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="text-brand-red" />
                Tu Pedido
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                {cart.map((item) => (
                    <div key={item.id} className="flex items-center p-4 border-b border-gray-100 last:border-0 gap-4">
                        {/* Image */}
                        <div className="w-16 h-20 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                        </div>

                        {/* Info */}
                        <div className="flex-grow">
                            <h3 className="font-semibold text-gray-800 text-sm md:text-base line-clamp-2">{item.title}</h3>
                            <p className="text-brand-red font-bold text-sm">{formatCurrency(item.price)}</p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => decrementQuantity(item.id)}
                                    className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-red-500 disabled:opacity-50"
                                >
                                    -
                                </button>
                                <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                <button
                                    onClick={() => addToCart(item)}
                                    className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-green-500"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-gray-400 hover:text-red-500 text-xs flex items-center gap-1"
                            >
                                <Trash2 size={14} /> Eliminar
                            </button>
                        </div>
                    </div>
                ))}

                {/* Subtotal Footer */}
                <div className="bg-gray-50 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="text-gray-500 font-medium">Total Estimado</span>
                    <span className="text-3xl font-bold text-brand-dark">{formatCurrency(totalPrice)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={handleWhatsAppClick}
                    className="w-full bg-[#25D366] hover:bg-[#1faa53] text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 animate-pulse"
                >
                    <MessageCircle className="w-6 h-6" />
                    Realizar Pedido por WhatsApp
                </button>

                <Link to="/catalog/all" className="w-full text-center py-3 text-gray-500 font-medium hover:text-brand-dark transition-colors">
                    <span className="flex items-center justify-center gap-2">
                        <ArrowLeft size={16} /> Seguir comprando
                    </span>
                </Link>
            </div>
        </div>
    );
};

export default Cart;
