import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, OrderItem, OrderType } from '../types';
import { Bell, Clock, StickyNote, List, Check } from 'lucide-react';
import { updateOrderItemPrepared } from '../services/menuService';

interface KitchenViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const KitchenView: React.FC<KitchenViewProps> = ({ orders, onUpdateStatus }) => {
  const kitchenOrders = orders.filter(o => o.status === OrderStatus.VALIDATED).sort((a,b) => a.createdAt - b.createdAt);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [sidebarTab, setSidebarTab] = useState<'queue' | 'summary'>('queue');
  const previousOrderCountRef = useRef(0);

  // Auto-select first if none selected
  useEffect(() => {
    if (!selectedId && kitchenOrders.length > 0) {
        setSelectedId(kitchenOrders[0].id);
    }
  }, [kitchenOrders, selectedId]);

  // Timer update interval (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // New order audio alert
  useEffect(() => {
    if (kitchenOrders.length > previousOrderCountRef.current && previousOrderCountRef.current > 0) {
      // New order detected - play sound
      try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Higher pitch for attention
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.warn('Could not play audio alert:', error);
      }
    }
    previousOrderCountRef.current = kitchenOrders.length;
  }, [kitchenOrders.length]);

  const focusedOrder = kitchenOrders.find(o => o.id === selectedId) || kitchenOrders[0];

  // Aggregate items for bulk prep summary
  const bulkPrepSummary = React.useMemo(() => {
    const itemMap = new Map<string, { code: string; nameCN: string | null; nameFR: string; totalQuantity: number }>();
    
    kitchenOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.menuItem.code;
        const existing = itemMap.get(key);
        if (existing) {
          existing.totalQuantity += item.quantity;
        } else {
          itemMap.set(key, {
            code: key,
            nameCN: item.menuItem.nameCN,
            nameFR: item.menuItem.nameFR,
            totalQuantity: item.quantity,
          });
        }
      });
    });
    
    return Array.from(itemMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [kitchenOrders]);

  // Format elapsed time helper
  const formatElapsedTime = (createdAt: number): { minutes: number; display: string; colorClass: string; isBlinking: boolean } => {
    const elapsedMs = currentTime - createdAt;
    const minutes = Math.floor(elapsedMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    let display: string;
    if (hours > 0) {
      display = `${hours}h ${remainingMinutes}m`;
    } else {
      display = `${minutes}m`;
    }
    
    let colorClass: string;
    let isBlinking = false;
    if (minutes < 10) {
      colorClass = 'text-zinc-400';
    } else if (minutes < 20) {
      colorClass = 'text-yellow-500';
    } else {
      colorClass = 'text-red-500';
      isBlinking = true;
    }
    
    return { minutes, display, colorClass, isBlinking };
  };

  const handleItemClick = async (item: OrderItem) => {
    if (!item.orderItemId) return;
    
    const newPreparedStatus = !item.isPrepared;
    try {
      await updateOrderItemPrepared(item.orderItemId, newPreparedStatus);
    } catch (error) {
      console.error('Error updating item prepared status:', error);
    }
  };

  const renderItemCard = (item: OrderItem, idx: number) => {
    const isPrepared = item.isPrepared || false;
    
    return (
      <div 
        key={idx} 
        onClick={() => handleItemClick(item)}
        className={`bg-zinc-800 p-5 rounded-xl border-l-4 shadow-lg flex flex-col justify-between min-h-[140px] cursor-pointer transition-all duration-200 hover:bg-zinc-750 ${
          isPrepared 
            ? 'border-zinc-600 opacity-50 line-through' 
            : 'border-yellow-500'
        }`}
      >
          <div className="flex justify-between items-start border-b border-zinc-700/50 pb-3 mb-3">
              <span className={`text-5xl font-black tracking-tighter ${isPrepared ? 'text-zinc-600' : 'text-yellow-500'}`}>
                  {item.menuItem.code}
              </span>
              <div className="flex items-center gap-2">
                  {isPrepared && (
                      <Check size={24} className="text-green-500" />
                  )}
                  <span className={`text-5xl font-black ${isPrepared ? 'text-zinc-600' : 'text-white'}`}>
                      x{item.quantity}
                  </span>
              </div>
          </div>
          <div>
              <h4 className={`text-3xl font-bold leading-tight mb-1 ${isPrepared ? 'text-zinc-600' : 'text-white'}`}>
                  {item.menuItem.nameCN}
              </h4>
              <p className={`text-lg font-medium truncate ${isPrepared ? 'text-zinc-700' : 'text-zinc-500'}`}>
                  {item.menuItem.nameFR}
              </p>
              {item.notes && (
                  <div className={`mt-2 flex items-start gap-2 border rounded-lg p-2 ${
                      isPrepared 
                          ? 'bg-zinc-700/20 border-zinc-600/50' 
                          : 'bg-yellow-500/20 border-yellow-500/50'
                  }`}>
                      <StickyNote size={16} className={`flex-shrink-0 mt-0.5 ${isPrepared ? 'text-zinc-600' : 'text-yellow-500'}`} />
                      <p className={`text-sm font-bold leading-tight ${isPrepared ? 'text-zinc-600' : 'text-yellow-300'}`}>
                          {item.notes}
                      </p>
                  </div>
              )}
          </div>
      </div>
    );
  };

  const getTableLabel = (order: Order) => {
      if (order.type === OrderType.TAKEAWAY) {
          return "外卖";
      }
      if (!order.tableNumber || order.tableNumber === '?' || order.tableNumber === '') {
          return "À placer";
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
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-4xl font-bold text-white">{getTableLabel(focusedOrder)}</h2>
                        {focusedOrder.mainsStarted && (
                            <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-black text-xl animate-pulse flex items-center gap-2">
                                <Bell size={20} />
                                <span>FIRE! / 开始主菜</span>
                            </div>
                        )}
                    </div>
                    <span className="text-zinc-400 font-mono text-lg">#{focusedOrder.id.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-2">
                    {(() => {
                        const elapsed = formatElapsedTime(focusedOrder.createdAt);
                        return (
                            <div className={`flex items-center gap-2 ${elapsed.colorClass} ${elapsed.isBlinking ? 'animate-pulse' : ''}`}>
                                <Clock size={20} />
                                <span className="text-xl font-bold font-mono">{elapsed.display}</span>
                            </div>
                        );
                    })()}
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
                            {starters.map((item, idx) => renderItemCard(item, idx))}
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
                            {mains.map((item, idx) => renderItemCard(item, idx))}
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
            <div className="flex items-center justify-between mb-3">
                <h1 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
                    {sidebarTab === 'queue' ? 'Queue (队列)' : 'Summary (汇总)'}
                    {sidebarTab === 'queue' && (
                        <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full text-sm">{kitchenOrders.length}</span>
                    )}
                </h1>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setSidebarTab('queue')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                        sidebarTab === 'queue' 
                            ? 'bg-yellow-500 text-zinc-900' 
                            : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                    }`}
                >
                    Queue
                </button>
                <button
                    onClick={() => setSidebarTab('summary')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1 ${
                        sidebarTab === 'summary' 
                            ? 'bg-yellow-500 text-zinc-900' 
                            : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                    }`}
                >
                    <List size={14} />
                    Summary
                </button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'queue' ? (
                <>
                    {kitchenOrders.map(order => {
                        const elapsed = formatElapsedTime(order.createdAt);
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
                                <div className="flex items-center justify-between mt-2">
                                    {order.type === OrderType.TAKEAWAY && (
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-500">打包</span>
                                    )}
                                    <div className={`flex items-center gap-1 ml-auto ${elapsed.colorClass} ${elapsed.isBlinking ? 'animate-pulse' : ''}`}>
                                        <Clock size={14} />
                                        <span className="text-sm font-bold font-mono">{elapsed.display}</span>
                                    </div>
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
                </>
            ) : (
                <div className="p-4 space-y-3">
                    {bulkPrepSummary.length === 0 ? (
                        <div className="p-12 text-center text-zinc-600 flex flex-col items-center">
                            <span className="text-4xl mb-2 opacity-50">📋</span>
                            <span>No items to prepare</span>
                        </div>
                    ) : (
                        bulkPrepSummary.map((item, idx) => (
                            <div 
                                key={idx}
                                className="bg-zinc-800 p-4 rounded-xl border-l-4 border-yellow-500 shadow-lg"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-3xl font-black text-yellow-500 tracking-tighter">{item.code}</span>
                                    <span className="text-3xl font-black text-white">x{item.totalQuantity}</span>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white leading-tight mb-1">{item.nameCN || item.nameFR}</h4>
                                    {item.nameCN && (
                                        <p className="text-sm text-zinc-500 font-medium truncate">{item.nameFR}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
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