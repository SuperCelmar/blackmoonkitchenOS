import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderItem, OrderType } from '../types';
import { Bell } from 'lucide-react';

interface KitchenViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const KitchenView: React.FC<KitchenViewProps> = ({ orders, onUpdateStatus }) => {
  const kitchenOrders = orders.filter(o => o.status === OrderStatus.VALIDATED).sort((a,b) => a.createdAt - b.createdAt);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select first if none selected
  useEffect(() => {
    if (!selectedId && kitchenOrders.length > 0) {
        setSelectedId(kitchenOrders[0].id);
    }
  }, [kitchenOrders, selectedId]);

  const focusedOrder = kitchenOrders.find(o => o.id === selectedId) || kitchenOrders[0];

  const renderItemCard = (item: OrderItem, idx: number) => (
    <div key={idx} className="bg-zinc-800 p-5 rounded-xl border-l-4 border-yellow-500 shadow-lg flex flex-col justify-between min-h-[140px]">
        <div className="flex justify-between items-start border-b border-zinc-700/50 pb-3 mb-3">
            <span className="text-5xl font-black text-yellow-500 tracking-tighter">{item.menuItem.code}</span>
            <span className="text-5xl font-black text-white">x{item.quantity}</span>
        </div>
        <div>
            <h4 className="text-3xl font-bold text-white leading-tight mb-1">{item.menuItem.nameCN}</h4>
            <p className="text-lg text-zinc-500 font-medium truncate">{item.menuItem.nameFR}</p>
        </div>
    </div>
  );

  const getTableLabel = (order: Order) => {
      if (order.type === OrderType.TAKEAWAY) {
          return "外卖";
      }
      return `Table ${order.tableNumber}`;
  }

  const renderOrderDetails = () => {
      if (!focusedOrder) return null;

      // Filter by category slugs: entrees and salades are starters, others are mains
      const starters = focusedOrder.items.filter(i => 
        i.menuItem.category === 'entrees' || i.menuItem.category === 'salades'
      );
      const mains = focusedOrder.items.filter(i => 
        i.menuItem.category && !['entrees', 'salades'].includes(i.menuItem.category)
      );
      
      const hasKitchenItems = starters.length > 0 || mains.length > 0;

      return (
        <>
            <div className="p-6 bg-zinc-800 border-b border-zinc-700 flex justify-between items-center shadow-md z-10">
                <div>
                    <h2 className="text-4xl font-bold mb-1 text-white">{getTableLabel(focusedOrder)}</h2>
                    <span className="text-zinc-400 font-mono text-lg">#{focusedOrder.id.slice(-4)}</span>
                </div>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto bg-zinc-900">
                {!hasKitchenItems && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4">
                        <span className="text-6xl opacity-20">☕️ 🍰</span>
                        <p className="text-xl">Drinks & Desserts only (handled by waiter)</p>
                    </div>
                )}

                {starters.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-2xl font-black text-zinc-500 mb-6 flex items-center gap-4">
                            <span>ENTRÉES (前菜)</span>
                            <span className="text-sm bg-zinc-800 px-3 py-1 rounded-full text-zinc-400">{starters.reduce((a,b) => a+b.quantity, 0)} items</span>
                            <div className="h-px bg-zinc-800 flex-1"></div>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {starters.map(renderItemCard)}
                        </div>
                    </div>
                )}

                {mains.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-zinc-500 mb-6 flex items-center gap-4">
                            <span>PLATS (主菜)</span>
                            <span className="text-sm bg-zinc-800 px-3 py-1 rounded-full text-zinc-400">{mains.reduce((a,b) => a+b.quantity, 0)} items</span>
                            <div className="h-px bg-zinc-800 flex-1"></div>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {mains.map(renderItemCard)}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-zinc-700 bg-zinc-800 z-10">
                <button 
                    onClick={() => {
                        onUpdateStatus(focusedOrder.id, OrderStatus.READY);
                        setSelectedId(null);
                    }}
                    className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 transition-colors text-white py-5 rounded-xl text-2xl font-bold shadow-lg flex items-center justify-center gap-4 group"
                >
                    <Bell size={32} className="group-hover:animate-bounce"/>
                    <span>READY / 完成</span>
                </button>
            </div>
        </>
      );
  };

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden font-sans">
      {/* Sidebar Queue */}
      <div className="w-1/3 max-w-sm border-r border-zinc-700 flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-700 bg-zinc-800/50 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
                Queue (队列) 
                <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full text-sm">{kitchenOrders.length}</span>
            </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
            {kitchenOrders.map(order => {
                const itemCount = order.items.filter(i => 
                  i.menuItem.category === 'entrees' || 
                  i.menuItem.category === 'salades' || 
                  (i.menuItem.category && !['entrees', 'salades'].includes(i.menuItem.category))
                ).reduce((acc, i) => acc + i.quantity, 0);
                return (
                    <div 
                        key={order.id}
                        onClick={() => setSelectedId(order.id)}
                        className={`p-5 border-b border-zinc-700/50 cursor-pointer transition-all duration-200 ${
                            selectedId === order.id ? 'bg-blue-900/50 border-l-4 border-l-blue-500' : 'hover:bg-zinc-800/50 border-l-4 border-l-transparent'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className={`text-xl font-bold ${selectedId === order.id ? 'text-white' : 'text-zinc-300'}`}>{getTableLabel(order)}</span>
                            <span className="text-sm text-zinc-500 font-mono">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="text-zinc-400 text-sm">#{order.id.slice(-4)}</span>
                             <span className={`px-2 py-0.5 rounded text-xs font-bold ${itemCount > 0 ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-zinc-600'}`}>
                                {itemCount} items
                             </span>
                        </div>
                    </div>
                );
            })}
            {kitchenOrders.length === 0 && (
                <div className="p-12 text-center text-zinc-600 flex flex-col items-center">
                    <span className="text-4xl mb-2 opacity-50">😴</span>
                    <span>No orders pending</span>
                </div>
            )}
        </div>
      </div>

      {/* Main Focus View */}
      <div className="flex-1 flex flex-col bg-zinc-900 relative">
         {focusedOrder ? renderOrderDetails() : (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-700">
                 <Bell size={64} className="mb-4 opacity-20"/>
                 <h2 className="text-3xl font-bold opacity-40">Waiting for orders...</h2>
             </div>
         )}
      </div>
    </div>
  );
};

export default KitchenView;