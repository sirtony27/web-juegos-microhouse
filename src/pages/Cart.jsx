import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { useConsoleStore } from '../store/useConsoleStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Trash2, ShoppingBag, ArrowLeft, MessageCircle, Plus, Minus, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Cart = () => {
    const { cart, removeFromCart, decrementQuantity, addToCart, getTotalPrice, clearCart } = useCartStore();
    const { consoles } = useConsoleStore();
    const totalPrice = getTotalPrice();

    const handleWhatsAppClick = () => {
        const phoneNumber = "5492915764388";

        // Header
        let message = "¡Hola MicroHouse! Me gustaría encargar el siguiente pedido web:\n\n";

        // Items
        cart.forEach(item => {
            const consoleName = consoles.find(c => c.id === item.console)?.name || item.console || 'Juego';
            message += `- *${item.title}* (${consoleName})\n`;
            message += `  Cant: ${item.quantity} x ${formatCurrency(item.price)}\n`;
        });

        // Footer & Total
        message += `\n*Total Final: ${formatCurrency(totalPrice)}*`;
        message += `\n\nQuedo a la espera para coordinar el pago y envío. ¡Gracias!`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-800/50 p-8 rounded-full mb-6 backdrop-blur-sm border border-white/5"
                >
                    <ShoppingBag size={64} className="text-gray-400" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-3 font-display">Tu carrito está vacío</h2>
                <p className="text-gray-400 mb-8 max-w-sm text-lg">Parece que aún no has elegido tu próxima aventura.</p>
                <Link to="/catalog/all" className="bg-brand-red text-white px-8 py-3 rounded-full font-bold hover:bg-red-600 transition-all hover:scale-105 shadow-lg shadow-red-900/20">
                    Explorar Catálogo
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pb-32 md:pb-12 max-w-6xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-white font-display">
                    <ShoppingBag className="text-brand-red" size={32} />
                    Tu Carrito
                    <span className="text-lg font-normal text-gray-400">({cart.length})</span>
                </h1>
                <button
                    onClick={clearCart}
                    className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-2 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                    Vaciar Carrito
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={item.id}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/5 flex gap-4 md:gap-6 group hover:border-white/10 transition-colors"
                        >
                            {/* Image */}
                            <div className="w-20 h-24 md:w-28 md:h-36 flex-shrink-0 bg-gray-900 rounded-lg overflow-hidden shadow-md relative group-hover:shadow-lg transition-all">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            </div>

                            {/* Info & Controls */}
                            <div className="flex-grow flex flex-col justify-between py-1">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="font-bold text-white text-lg md:text-xl leading-tight mb-1">{item.title}</h3>
                                        <p className="text-gray-400 text-sm">
                                            {consoles.find(c => c.id === item.console)?.name || item.console || 'Juego'}
                                        </p>
                                    </div>
                                    <p className="text-brand-red font-bold text-lg md:text-xl whitespace-nowrap">
                                        {formatCurrency(item.price * item.quantity)}
                                    </p>
                                </div>

                                <div className="flex justify-between items-end mt-4">
                                    {/* Quantity Controls - Fixed Contrast */}
                                    <div className="flex items-center bg-slate-900/80 rounded-lg p-1 border border-white/5 shadow-inner">
                                        <button
                                            onClick={() => decrementQuantity(item.id)}
                                            className="w-8 h-8 flex items-center justify-center bg-transparent rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center font-bold text-white text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="w-8 h-8 flex items-center justify-center bg-transparent rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        <span className="hidden md:inline">Eliminar</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-white/10 sticky top-24 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6">Resumen del Pedido</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-400">
                                <span>Subtotal</span>
                                <span>{formatCurrency(totalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Envío</span>
                                <span className="text-emerald-400 text-sm">Acordar por WhatsApp</span>
                            </div>
                            <div className="h-px bg-white/10 my-4"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-white font-bold text-lg">Total</span>
                                <span className="text-3xl font-bold text-brand-red">{formatCurrency(totalPrice)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleWhatsAppClick}
                            className="w-full bg-[#25D366] hover:bg-[#1faa53] text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                        >
                            <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                            Pedir por WhatsApp
                        </button>

                        <p className="text-xs text-center text-gray-500 mt-4">
                            Al hacer clic, se abrirá WhatsApp con el detalle de tu pedido para coordinar el pago y envío.
                        </p>

                        <Link to="/catalog/all" className="block text-center mt-6 text-gray-400 hover:text-white transition-colors text-sm font-medium">
                            Seguir comprando
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-6 bg-slate-800/50 rounded-xl p-6 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-emerald-400 mb-2">
                            <div className="bg-emerald-500/10 p-2 rounded-full">
                                <ShieldCheck size={20} />
                            </div>
                            <span className="font-semibold text-sm">Compra 100% Segura</span>
                        </div>
                        <p className="text-xs text-gray-400 ml-11">
                            Tus datos están protegidos. Coordinamos el pago directamente con vos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
