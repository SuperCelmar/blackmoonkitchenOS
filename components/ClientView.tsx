import React, { useState, useMemo, useEffect } from 'react';
import { MemoryRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { MenuItem, OrderItem, PaymentMethod, OrderType } from '../types';
import { fetchActiveOrder } from '../services/menuService';

interface ClientViewProps {
  menu: MenuItem[];
  onSubmitOrder: (items: OrderItem[], paymentMethod: PaymentMethod, type: OrderType) => void;
}

// --- Icons ---
const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// --- Components ---

const HomeScreen = ({ orderType, setOrderType }: { orderType: OrderType, setOrderType: (t: OrderType) => void }) => {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark">
            <header className="flex items-center justify-between px-6 pt-6 pb-2">
                <div className="flex items-center gap-2"></div>
                <button aria-label="Appeler un serveur" className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Icon name="room_service" className="text-[24px]" />
                </button>
            </header>
            <main className="flex flex-1 flex-col items-center justify-center px-6 -mt-10">
                <div className="flex w-full max-w-sm flex-col items-center gap-8">
                    <div className="relative group cursor-default">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-orange-400 opacity-30 blur group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div 
                            className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white dark:border-surface-dark shadow-xl bg-cover bg-center" 
                            style={{backgroundImage: 'url("https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=800&auto=format&fit=crop")'}}
                        ></div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
                            Bienvenue au <br/> <span className="text-primary">Restaurant Chinois</span>
                        </h1>
                        <div className="space-y-1">
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                                Bonjour ! ☀️
                            </p>
                            <p className="text-slate-400 dark:text-slate-500 text-base font-normal">
                                Choisissez votre mode de commande :
                            </p>
                        </div>
                        
                        <div className="flex gap-4 w-full mt-4">
                            <button 
                                onClick={() => setOrderType(OrderType.DINE_IN)}
                                className={`flex-1 p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${orderType === OrderType.DINE_IN ? 'border-primary bg-primary/5' : 'border-transparent bg-white dark:bg-surface-dark'}`}
                            >
                                <Icon name="restaurant" className={orderType === OrderType.DINE_IN ? 'text-primary' : 'text-slate-400'} />
                                <span className={`text-sm font-bold ${orderType === OrderType.DINE_IN ? 'text-primary' : 'text-slate-500'}`}>Sur Place</span>
                            </button>
                            <button 
                                onClick={() => setOrderType(OrderType.TAKEAWAY)}
                                className={`flex-1 p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${orderType === OrderType.TAKEAWAY ? 'border-primary bg-primary/5' : 'border-transparent bg-white dark:bg-surface-dark'}`}
                            >
                                <Icon name="shopping_bag" className={orderType === OrderType.TAKEAWAY ? 'text-primary' : 'text-slate-400'} />
                                <span className={`text-sm font-bold ${orderType === OrderType.TAKEAWAY ? 'text-primary' : 'text-slate-500'}`}>À Emporter</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <footer className="w-full bg-background-light dark:bg-background-dark safe-pb px-6 pt-4">
                <div className="mx-auto w-full max-w-md flex flex-col gap-4">
                    <Link to="/starters" className="relative w-full overflow-hidden rounded-2xl bg-primary py-4 text-white shadow-lg shadow-red-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-red-500/20 text-center">
                        <span className="relative z-10 flex items-center justify-center gap-2 text-lg font-bold tracking-wide">
                            Voir le menu
                            <Icon name="restaurant_menu" className="text-[20px]" />
                        </span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]"></div>
                    </Link>
                    <div className="flex flex-col items-center gap-3 pb-4">
                        <button className="text-sm font-medium text-primary hover:text-red-700 dark:hover:text-red-400 transition-colors underline decoration-2 decoration-transparent hover:decoration-current underline-offset-4">
                            Mes commandes
                        </button>
                        <p className="text-xs text-slate-400 dark:text-slate-600 font-medium tracking-wide">
                            Propulsé par Sunday-Style
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const MenuScreen = ({ 
    title, 
    items, 
    cart, 
    addToCart, 
    removeFromCart, 
    nextLink,
    prevLink 
}: { 
    title: string, 
    items: MenuItem[], 
    cart: OrderItem[], 
    addToCart: (i: MenuItem) => void,
    removeFromCart: (id: string) => void,
    nextLink?: string,
    prevLink?: string
}) => {
    const navigate = useNavigate();
    const cartTotal = cart.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const getQuantity = (id: string) => cart.find(i => i.menuItem.id === id)?.quantity || 0;

    return (
        <div className="relative flex min-h-screen w-full flex-col pb-32 mx-auto max-w-md bg-background-light dark:bg-background-dark overflow-x-hidden shadow-2xl">
            <header className="sticky top-0 z-40 w-full glass-effect border-b border-black/5 dark:border-white/5 transition-colors duration-300">
                <div className="flex items-center justify-between px-5 py-3">
                    <button onClick={() => navigate(prevLink || -1)} className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-primary">
                        <Icon name="arrow_back_ios_new" className="text-[26px]" />
                    </button>
                    <h1 className="text-[17px] font-bold tracking-tight text-center flex-1 text-gray-900 dark:text-white">{title}</h1>
                    <Link to="/confirmation" className="flex items-center justify-center w-10 h-10 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all relative text-primary">
                        <Icon name="shopping_bag" />
                        {cartCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary border-2 border-surface-light dark:border-surface-dark"></span>
                            </span>
                        )}
                    </Link>
                </div>
                <div className="w-full overflow-x-auto no-scrollbar pb-3 px-5 flex gap-3 snap-x">
                    <button className="snap-start shrink-0 h-9 px-5 rounded-full bg-primary text-white font-semibold text-[15px] shadow-lg shadow-primary/25 transition-transform active:scale-95">Tout</button>
                    <button className="snap-start shrink-0 h-9 px-5 rounded-full bg-surface-light dark:bg-surface-dark text-gray-600 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-white/10 font-medium text-[15px] transition-colors active:scale-95">Favoris</button>
                </div>
            </header>
            <main className="flex flex-col gap-4 px-5 py-4">
                {items.map(item => {
                    const qty = getQuantity(item.id);
                    return (
                        <div key={item.id} className="group flex flex-col p-3 bg-surface-light dark:bg-surface-dark rounded-[24px] shadow-sm active:scale-[0.99] transition-all duration-300 border border-white/50 dark:border-white/5">
                            <div className="flex gap-4">
                                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100 relative shadow-inner">
                                    {item.image ? (
                                        <div className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{backgroundImage: `url("${item.image}")`}}></div>
                                    ) : (
                                        <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No image</div>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col py-1 justify-between">
                                    <div>
                                        <h3 className="text-[17px] font-bold text-gray-900 dark:text-white leading-tight mb-1">{item.nameFR}</h3>
                                        <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{item.descriptionFR}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[17px] font-bold text-gray-900 dark:text-white">{item.price.toFixed(2)} €</span>
                                        {qty === 0 ? (
                                            <button 
                                                onClick={() => addToCart(item)}
                                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-90"
                                            >
                                                <Icon name="add" className="text-[20px]" />
                                            </button>
                                        ) : (
                                            <div className="flex h-9 items-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 px-1">
                                                <button onClick={() => removeFromCart(item.id)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors">
                                                    <Icon name="remove" className="text-[16px] font-bold" />
                                                </button>
                                                <span className="w-6 text-center text-[15px] font-bold">{qty}</span>
                                                <button onClick={() => addToCart(item)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors">
                                                    <Icon name="add" className="text-[16px] font-bold" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </main>
            <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
                <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light/95 dark:via-background-dark/95 to-transparent pointer-events-none"></div>
                <div className="relative max-w-md mx-auto px-6 pb-8 pt-4 pointer-events-auto">
                    {cartCount > 0 && nextLink ? (
                        <Link to={nextLink} className="w-full shadow-float bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-2 pr-5 pl-2 flex items-center justify-between gap-4 group active:scale-[0.98] transition-all duration-200">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/30 group-hover:bg-primary-dark transition-colors">
                                    {cartCount}
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                    <span className="text-[19px] font-bold text-gray-900 dark:text-white leading-none">{cartTotal.toFixed(2)} €</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-primary dark:text-white font-bold text-[17px] group-hover:translate-x-1 transition-transform">
                                Suivant
                                <Icon name="arrow_forward" className="text-[20px]" />
                            </div>
                        </Link>
                    ) : (
                        nextLink && (
                            <Link to={nextLink} className="block w-full text-center py-4 text-slate-400 font-bold hover:text-slate-600">
                                Passer cette étape
                            </Link>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

const ConfirmationScreen = ({ cart }: { cart: OrderItem[] }) => {
    const navigate = useNavigate();
    const subtotal = cart.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
    const total = subtotal; // Can add tax logic if needed

    return (
        <div className="relative min-h-screen w-full max-w-md mx-auto bg-background-light dark:bg-background-dark pb-32 shadow-2xl overflow-hidden border-x border-slate-100 dark:border-slate-900">
            <header className="sticky top-0 z-50 w-full transition-all duration-300">
                <div className="absolute inset-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"></div>
                <div className="relative flex items-center justify-between px-4 py-3">
                    <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white">
                        <Icon name="arrow_back" className="!text-[24px]" />
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Panier</h1>
                    <button className="flex size-10 items-center justify-center rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white">
                        <Icon name="more_horiz" className="!text-[24px]" />
                    </button>
                </div>
            </header>
            <main className="px-4 space-y-6 pt-6">
                <section className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Détails de la commande</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Veuillez vérifier les articles avant de choisir le paiement.</p>
                </section>
                <section className="bg-white dark:bg-slate-800/50 rounded-3xl p-5 shadow-apple dark:shadow-none dark:border dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Votre Sélection</h3>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{cart.reduce((a,b)=>a+b.quantity,0)} Articles</span>
                    </div>
                    <div className="space-y-6">
                        {cart.map((item) => (
                            <div key={item.menuItem.id} className="flex gap-4 group">
                                <div className="relative w-[72px] h-[72px] shrink-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 shadow-sm">
                                    {item.menuItem.image ? (
                                        <img alt={item.menuItem.nameFR} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={item.menuItem.image} />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-400 text-xs">No image</div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">x{item.quantity}</div>
                                </div>
                                <div className="flex-1 py-0.5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">{item.menuItem.nameFR}</h4>
                                            <span className="font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">{(item.menuItem.price * item.quantity).toFixed(2)}€</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{item.menuItem.price}€ / unité</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="my-6 relative">
                        <div aria-hidden="true" className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-slate-800 px-2 text-xs text-slate-300 dark:text-slate-600 uppercase tracking-widest">Total</span>
                        </div>
                    </div>
                    <div className="space-y-3 pt-1">
                        <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                            <span>Sous-total</span>
                            <span>{subtotal.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between items-end mt-4 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span className="font-bold text-slate-900 dark:text-white text-lg">Total</span>
                            <span className="font-extrabold text-primary text-2xl tracking-tight">{total.toFixed(2)} €</span>
                        </div>
                    </div>
                </section>
                <p className="text-center text-xs text-slate-400 dark:text-slate-600 px-8 pb-4 leading-relaxed">
                    Besoin d'autre chose ? Vous pourrez ajouter des articles à la commande ultérieurement.
                </p>
            </main>
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="w-full max-w-md mx-auto">
                    <Link to="/payment" className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-white p-4 shadow-float transition-all active:scale-[0.98] hover:shadow-lg hover:bg-red-600">
                        <span className="text-lg font-bold">Mode de paiement</span>
                        <Icon name="payments" className="!text-[24px]" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

const PaymentScreen = ({ onSubmit }: { onSubmit: (method: PaymentMethod) => void }) => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState<PaymentMethod | null>(null);

    const handleConfirm = () => {
        if (selected) {
            onSubmit(selected);
            navigate('/waiting');
        }
    };

    return (
        <div className="relative min-h-screen w-full max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden border-x border-slate-100 dark:border-slate-900 flex flex-col">
            <header className="sticky top-0 z-50 w-full transition-all duration-300">
                <div className="absolute inset-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"></div>
                <div className="relative flex items-center justify-between px-4 py-3">
                    <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white">
                        <Icon name="arrow_back" className="!text-[24px]" />
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Méthode de Paiement</h1>
                    <button className="flex size-10 items-center justify-center rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white">
                        <Icon name="more_horiz" className="!text-[24px]" />
                    </button>
                </div>
            </header>
            <main className="px-4 pt-6 pb-32 flex-grow overflow-y-auto no-scrollbar">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 px-1">Options de règlement</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-1">Indiquez au serveur comment vous souhaitez régler.</p>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { id: PaymentMethod.CARD, label: 'Carte Bleue', icon: 'credit_card', color: 'blue' },
                        { id: PaymentMethod.TICKET_CARD, label: 'Carte Ticket\nRestaurant', icon: 'card_membership', color: 'orange' },
                        { id: PaymentMethod.CASH, label: 'Espèce', icon: 'payments', color: 'emerald' },
                        { id: PaymentMethod.PAPER_TICKET, label: 'Ticket\nRestaurant', icon: 'local_activity', color: 'indigo' }
                    ].map((opt) => (
                        <button 
                            key={opt.id}
                            onClick={() => setSelected(opt.id)}
                            className={`group relative flex flex-col items-center justify-between gap-3 bg-white dark:bg-slate-800/50 rounded-3xl p-5 shadow-apple dark:shadow-none dark:border dark:border-slate-800 transition-all active:scale-[0.97] hover:bg-red-50/50 dark:hover:bg-slate-800 aspect-square border ${selected === opt.id ? 'border-primary ring-2 ring-primary bg-red-50/30' : 'border-transparent hover:border-primary/30 ring-2 ring-transparent'} outline-none`}
                        >
                            <div className="flex-1 flex items-center justify-center w-full">
                                <div className={`size-16 rounded-2xl bg-${opt.color}-50 dark:bg-white/5 flex items-center justify-center text-${opt.color}-600 dark:text-${opt.color}-400 group-hover:scale-110 transition-all duration-300`}>
                                    <Icon name={opt.icon} className="!text-[32px]" />
                                </div>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white text-center text-sm whitespace-pre-wrap">{opt.label}</span>
                            <div className={`absolute top-4 right-4 transition-opacity text-primary ${selected === opt.id ? 'opacity-100' : 'opacity-0'}`}>
                                <Icon name="check_circle" className="!text-[20px] fill-current" />
                            </div>
                        </button>
                    ))}
                </div>
            </main>
            <div className="absolute bottom-0 left-0 w-full z-40">
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800"></div>
                <div className="relative p-4 pb-8">
                    <button 
                        onClick={handleConfirm}
                        disabled={!selected}
                        className="w-full flex items-center justify-center gap-2 bg-primary disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-red-700 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-primary/30 shadow-glow transition-all active:scale-[0.98]"
                    >
                        <span>Envoyer au serveur</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const WaitingScreen = ({ cart }: { cart: OrderItem[] }) => {
    const total = cart.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
    return (
        <div className="relative min-h-screen w-full max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden border-x border-slate-100 dark:border-slate-900 flex flex-col">
            <header className="sticky top-0 z-50 w-full transition-all duration-300">
                <div className="absolute inset-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"></div>
                <div className="relative flex items-center justify-between px-4 py-3">
                    <button className="flex size-10 items-center justify-center rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white opacity-50 cursor-not-allowed">
                        <Icon name="arrow_back" className="!text-[24px]" />
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Commande Envoyée</h1>
                    <button className="flex size-10 items-center justify-center rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white">
                        <Icon name="more_horiz" className="!text-[24px]" />
                    </button>
                </div>
            </header>
            <main className="flex-1 px-6 pt-10 pb-32 flex flex-col items-center justify-center text-center space-y-8">
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow"></div>
                    <div className="relative size-24 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-full shadow-float flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <Icon name="hourglass_top" className="text-primary !text-[48px] animate-pulse" />
                    </div>
                </div>
                <div className="space-y-3 max-w-xs mx-auto">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">En attente de confirmation</h2>
                    <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                        Votre commande a été envoyée au serveur. Veuillez patienter un instant pour la validation.
                    </p>
                </div>
                <div className="w-full bg-white dark:bg-slate-800/50 rounded-3xl p-5 shadow-apple dark:shadow-none dark:border dark:border-slate-800 text-left">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Commande</p>
                            <p className="font-bold text-slate-900 dark:text-white">#{Math.floor(Math.random()*9000)+1000}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</p>
                            <p className="font-bold text-primary">{total.toFixed(2)} €</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {cart.map((item, i) => (
                             <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="bg-primary/10 text-primary px-1.5 rounded text-xs font-bold">{item.quantity}x</span>
                                    <span className="text-slate-700 dark:text-slate-200">{item.menuItem.nameFR}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-600 italic px-4">
                    Ne fermez pas cette page. La confirmation apparaîtra automatiquement ici.
                </p>
            </main>
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="absolute -top-12 left-0 w-full h-12 bg-gradient-to-t from-background-light/80 to-transparent dark:from-background-dark/80 pointer-events-none"></div>
                <div className="w-full max-w-md mx-auto">
                    <button 
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 p-4 cursor-not-allowed" 
                        disabled
                        onClick={() => window.location.reload()}
                    >
                        <Icon name="sync" className="!text-xl animate-spin" />
                        <span className="text-base font-medium">Attente du serveur...</span>
                    </button>
                    <button onClick={() => window.location.href="/"} className="mt-2 text-xs text-slate-400 underline w-full text-center">Nouvelle commande (Reset)</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Client View Wrapper ---

// Inner component that uses router hooks
const ClientViewInner: React.FC<{ menu: MenuItem[], onSubmitOrder: (items: OrderItem[], paymentMethod: PaymentMethod, type: OrderType) => void }> = ({ menu, onSubmitOrder }) => {
    const navigate = useNavigate();
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
    const [isCheckingOrder, setIsCheckingOrder] = useState(true);

    // Check for active order on mount
    useEffect(() => {
        const checkActiveOrder = async () => {
            try {
                const activeOrder = await fetchActiveOrder();
                if (activeOrder) {
                    // Restore cart and order type from active order
                    setCart(activeOrder.items);
                    setOrderType(activeOrder.type);
                    // Navigate to waiting screen
                    navigate('/waiting', { replace: true });
                }
            } catch (error: any) {
                // Silently handle auth errors - just log and continue
                // This is expected if anonymous auth is disabled
                if (!error?.message?.includes('anonymous') && !error?.message?.includes('auth')) {
                    console.error('Error checking for active order:', error);
                }
            } finally {
                setIsCheckingOrder(false);
            }
        };

        checkActiveOrder();
    }, [navigate]);

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.menuItem.id === item.id);
            if (existing) {
                return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { menuItem: item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => {
            const existing = prev.find(i => i.menuItem.id === itemId);
            if (existing && existing.quantity > 1) {
                return prev.map(i => i.menuItem.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => i.menuItem.id !== itemId);
        });
    };

    const handleOrderSubmit = (paymentMethod: PaymentMethod) => {
        onSubmitOrder(cart, paymentMethod, orderType);
    };

    // Filter menu items by category slug
    // Entrées (starters) and Salades are shown in starters section
    const starters = useMemo(() => 
      menu.filter(m => m.category === 'entrees' || m.category === 'salades'), 
      [menu]
    );
    // All other categories (Pho, Udon, Bols, Riz) are shown in mains section
    const mains = useMemo(() => 
      menu.filter(m => m.category && !['entrees', 'salades'].includes(m.category)), 
      [menu]
    );

    if (isCheckingOrder) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-lg">Chargement...</div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<HomeScreen orderType={orderType} setOrderType={setOrderType} />} />
            <Route 
                path="/starters" 
                element={
                    <MenuScreen 
                        title="Entrées" 
                        items={starters} 
                        cart={cart}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        nextLink="/mains"
                        prevLink="/"
                    />
                } 
            />
            <Route 
                path="/mains" 
                element={
                    <MenuScreen 
                        title="Plats" 
                        items={mains} 
                        cart={cart}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        nextLink="/confirmation"
                        prevLink="/starters"
                    />
                } 
            />
            <Route path="/confirmation" element={<ConfirmationScreen cart={cart} />} />
            <Route path="/payment" element={<PaymentScreen onSubmit={handleOrderSubmit} />} />
            <Route path="/waiting" element={<WaitingScreen cart={cart} />} />
        </Routes>
    );
};

const ClientView: React.FC<ClientViewProps> = ({ menu, onSubmitOrder }) => {
    return (
        <MemoryRouter>
            <ClientViewInner menu={menu} onSubmitOrder={onSubmitOrder} />
        </MemoryRouter>
    );
};

export default ClientView;