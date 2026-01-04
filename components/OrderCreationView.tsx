import React, { useState, useMemo } from 'react';
import { MenuItem, OrderItem, OrderType, Table, OrderStatus } from '../types';
import { Search, ChevronLeft, ShoppingCart, Plus, Minus, X, Info, Trash } from 'lucide-react';

interface OrderCreationViewProps {
  menu: MenuItem[];
  tables: Table[];
  initialOrderType: OrderType;
  initialTable?: Table | null;
  initialCart?: OrderItem[];
  onCancel: () => void;
  onSubmit: (items: OrderItem[], type: OrderType, tableLabel: string) => void;
}

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const OrderCreationView: React.FC<OrderCreationViewProps> = ({
  menu,
  tables,
  initialOrderType,
  initialTable,
  initialCart = [],
  onCancel,
  onSubmit
}) => {
  const [orderType, setOrderType] = useState<OrderType>(initialOrderType);
  const [selectedTable, setSelectedTable] = useState<Table | null>(initialTable || null);
  const [cart, setCart] = useState<OrderItem[]>(initialCart);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [noteOrder, setNoteOrder] = useState('');

  const categories = useMemo(() => {
    // Custom order for categories based on the screenshot/restaurant flow
    const catOrder = ['entrees', 'salades', 'plats', 'riz', 'boissons', 'desserts'];
    const cats = new Set(menu.map(item => item.category).filter(Boolean));
    const sortedCats = Array.from(cats).sort((a, b) => {
      const indexA = catOrder.indexOf(a as string);
      const indexB = catOrder.indexOf(b as string);
      if (indexA === -1 && indexB === -1) return (a as string).localeCompare(b as string);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    return ['ALL', ...sortedCats] as string[];
  }, [menu]);

  const getCategoryLabel = (slug: string) => {
    switch (slug) {
      case 'ALL': return 'Tout';
      case 'entrees': return 'Entrées';
      case 'salades': return 'Salades';
      case 'plats': return 'Plats';
      case 'riz': return 'Riz';
      case 'boissons': return 'Boissons';
      case 'desserts': return 'Desserts';
      default: return slug.charAt(0).toUpperCase() + slug.slice(1);
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'ALL': return 'menu';
      case 'entrees': return 'tapas';
      case 'salades': return 'eco';
      case 'plats': return 'restaurant';
      case 'riz': return 'rice_bowl';
      case 'boissons': return 'local_bar';
      case 'desserts': return 'icecream';
      default: return 'category';
    }
  };

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesSearch = item.nameFR.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory && item.isAvailable;
    });
  }, [menu, searchQuery, selectedCategory]);

  const handleAddItem = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.menuItem.id === itemId) {
          const newQty = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(i => i.quantity > 0);
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = () => {
    if (cart.length === 0) return;
    const tableLabel = orderType === OrderType.DINE_IN ? (selectedTable?.label || '?') : 'Takeaway';
    onSubmit(cart, orderType, tableLabel);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-950 overflow-hidden relative">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 h-16 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-600 dark:text-zinc-400" />
          </button>
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">
              Nouvelle Commande
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
              <span className={`px-2 py-0.5 rounded-full ${orderType === OrderType.DINE_IN ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                {orderType === OrderType.DINE_IN ? 'Sur Place' : 'À Emporter'}
              </span>
              {orderType === OrderType.DINE_IN && selectedTable && (
                <span className="bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  Table {selectedTable.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher par nom ou code..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          {orderType === OrderType.DINE_IN && (
            <select 
              className="bg-gray-100 dark:bg-zinc-800 border-none rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              value={selectedTable?.id || ''}
              onChange={(e) => setSelectedTable(tables.find(t => t.id === e.target.value) || null)}
            >
              <option value="">Choisir une table</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>Table {t.label}</option>
              ))}
            </select>
          )}
          <button 
            onClick={() => setOrderType(orderType === OrderType.DINE_IN ? OrderType.TAKEAWAY : OrderType.DINE_IN)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
             <Icon name={orderType === OrderType.DINE_IN ? "takeout_dining" : "restaurant"} className="text-lg text-gray-600 dark:text-zinc-400"/>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <aside className="w-20 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col shrink-0 overflow-y-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex flex-col items-center justify-center py-6 px-1 transition-all duration-300 min-h-[80px] border-b border-gray-100 dark:border-zinc-800/50 ${
                selectedCategory === cat 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <span className={`text-[13px] font-bold tracking-tight text-center leading-tight break-words px-2 ${selectedCategory === cat ? 'text-white' : ''}`}>
                {getCategoryLabel(cat)}
              </span>
            </button>
          ))}
        </aside>

        {/* Menu Grid */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-zinc-950">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredMenu.map(item => {
              const cartItem = cart.find(i => i.menuItem.id === item.id);
              const quantity = cartItem?.quantity || 0;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="group bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all flex flex-col text-left overflow-hidden relative active:scale-[0.98]"
                >
                  <div className="aspect-[4/3] w-full relative overflow-hidden bg-gray-100 dark:bg-zinc-800">
                    {item.image ? (
                      <img src={item.image} alt={item.nameFR} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Icon name="image_not_supported" className="text-4xl" />
                      </div>
                    )}
                    
                    {/* Dish Code - Elevated for scan-ability */}
                    <div className="absolute top-2 right-2 bg-zinc-900/90 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-1 rounded-md border border-white/10 z-10 shadow-lg">
                      {item.code}
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-2 left-2 bg-white/80 dark:bg-black/40 backdrop-blur-md text-gray-900 dark:text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-black/5 dark:border-white/10">
                      {getCategoryLabel(item.category || 'Autre')}
                    </div>

                    {/* Quantity Indicator - Non-obstructive corner badge */}
                    {quantity > 0 && (
                      <div className="absolute bottom-2 right-2 flex items-center justify-center animate-in zoom-in duration-300 z-10">
                        <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-xl ring-2 ring-white dark:ring-zinc-900">
                          {quantity}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-1 gap-1">
                    <div>
                      <h4 className="font-bold text-[14px] text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors pr-1">
                        {item.nameFR}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-500 line-clamp-1 italic font-medium mt-0.5">
                        {item.nameCN}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-display font-black text-lg text-primary dark:text-primary-light">
                          {item.price.toFixed(2)}€
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:shadow-md group-hover:shadow-primary/20">
                        <Plus size={16} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredMenu.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Icon name="search_off" className="text-6xl mb-4 opacity-20" />
              <p className="text-lg">Aucun article trouvé</p>
              <button 
                onClick={() => {setSearchQuery(''); setSelectedCategory('ALL');}}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Floating Cart Button */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-8 right-8 z-40 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white w-16 h-16 rounded-2xl shadow-apple hover:shadow-float flex items-center justify-center group hover:scale-110 active:scale-95 transition-all duration-500 border border-gray-200 dark:border-white/10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <ShoppingCart size={28} className="relative z-10 group-hover:text-primary transition-colors" />
        {totalItems > 0 && (
          <span className="absolute top-3 right-3 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-lg animate-in zoom-in duration-300">
            {totalItems}
          </span>
        )}
      </button>

      {/* Cart Widget Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-500"
            onClick={() => setIsCartOpen(false)}
          ></div>
          <div className="relative w-full max-w-lg h-full bg-white dark:bg-zinc-950 text-gray-900 dark:text-white shadow-2xl flex flex-col transform animate-in slide-in-from-right duration-500 ease-out border-l border-gray-200 dark:border-white/5">
            <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center glass-effect sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <ShoppingCart size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-black text-2xl tracking-tight uppercase italic text-gray-900 dark:text-white">Votre Panier</h3>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-bold uppercase tracking-widest">{totalItems} articles sélectionnés</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-all duration-300 border border-gray-200 dark:border-white/5 group"
              >
                <X size={24} className="text-gray-600 dark:text-zinc-400 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-hide">
              {cart.map(item => (
                <div key={item.menuItem.id} className="flex gap-4 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900/40 border border-gray-100 dark:border-white/5 group hover:bg-white dark:hover:bg-zinc-900 hover:shadow-apple transition-all duration-300 relative overflow-hidden">
                  {/* Corner Patterns */}
                  <div className="corner-pattern corner-tl opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  <div className="corner-pattern corner-tr opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  <div className="corner-pattern corner-bl opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  <div className="corner-pattern corner-br opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0 border border-gray-100 dark:border-white/5 group-hover:scale-105 transition-transform duration-500">
                    <img src={item.menuItem.image || ''} alt={item.menuItem.nameFR} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm truncate pr-4 text-gray-900 dark:text-white group-hover:text-primary transition-colors">{item.menuItem.nameFR}</h4>
                      <span className="font-display font-black text-base text-primary">{(item.menuItem.price * item.quantity).toFixed(2)}€</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] text-gray-500 dark:text-zinc-500 font-mono bg-gray-200 dark:bg-white/5 px-1 py-0.5 rounded uppercase">{item.menuItem.code}</span>
                      <span className="text-[9px] text-gray-400 dark:text-zinc-600 font-bold italic">{item.menuItem.nameCN}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-gray-200/50 dark:bg-black rounded-lg p-0.5 gap-1 border border-gray-300 dark:border-white/5">
                        <button 
                          onClick={() => handleUpdateQuantity(item.menuItem.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-white transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-black text-sm min-w-[24px] text-center text-gray-900 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.menuItem.id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-white transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button 
                        onClick={() => handleUpdateQuantity(item.menuItem.id, -item.quantity)}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 dark:text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-20 relative group">
                  <div className="corner-pattern corner-tl opacity-20"></div>
                  <div className="corner-pattern corner-tr opacity-20"></div>
                  <div className="corner-pattern corner-bl opacity-20"></div>
                  <div className="corner-pattern corner-br opacity-20"></div>
                  
                  <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse-slow"></div>
                    <ShoppingCart size={40} className="text-gray-300 dark:text-zinc-700 relative z-10" />
                  </div>
                  <h4 className="font-display font-bold text-2xl uppercase tracking-tighter italic text-gray-800 dark:text-zinc-500 mb-2">Votre panier est vide</h4>
                  <p className="text-sm text-gray-400 dark:text-zinc-600 font-medium">Commencez à ajouter des délices</p>
                </div>
              )}
            </div>

            <div className="p-8 glass-effect border-t border-gray-100 dark:border-white/5 space-y-8 sticky bottom-0 z-20">
              {/* Cohesive Grounded Block for Notes and Prices */}
              <div className="bg-gray-50/80 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-inner">
                <div className="p-4 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-zinc-400 group focus-within:text-primary transition-colors">
                    <Icon name="notes" className="text-xl group-focus-within:scale-110 transition-transform" />
                    <input 
                      type="text" 
                      placeholder="Ajouter une note à la commande..." 
                      className="bg-transparent border-none focus:ring-0 outline-none flex-1 text-sm text-gray-900 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                      value={noteOrder}
                      onChange={(e) => setNoteOrder(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-zinc-400 font-black uppercase text-[11px] tracking-[0.2em] mb-1">Sous-Total</span>
                    <span className="text-5xl font-display font-black text-primary italic tracking-tighter drop-shadow-sm">{totalAmount.toFixed(2)}€</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                      <span>TVA (incluse)</span>
                      <Info size={12} />
                    </div>
                    <p className="text-sm font-black text-gray-900 dark:text-zinc-300 tracking-tight">{(totalAmount * 0.1).toFixed(2)}€</p>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-bold">10.00%</span>
                  </div>
                </div>
              </div>

              <button 
                disabled={cart.length === 0}
                onClick={handleSubmit}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-gray-200 dark:disabled:bg-zinc-800 disabled:text-gray-400 dark:disabled:text-zinc-600 disabled:shadow-none disabled:translate-y-0 text-white py-5 rounded-2xl font-black text-xl shadow-float flex items-center justify-center gap-4 transition-all hover:-translate-y-1 active:translate-y-0 uppercase tracking-tight overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                <span className="relative z-10">Valider la Commande</span>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center relative z-10">
                  <ChevronLeft size={24} className="rotate-180" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCreationView;

