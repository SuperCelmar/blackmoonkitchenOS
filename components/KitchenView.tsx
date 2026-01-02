import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { CheckSquare, Bell } from 'lucide-react';

interface KitchenViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const KitchenView: React.FC<KitchenViewProps> = ({ orders, onUpdateStatus }) => {
  const kitchenOrders = orders.filter(o => o.status === OrderStatus.VALIDATED).sort((a,b) => a.createdAt - b.createdAt);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select first if none selected
  React.useEffect(() => {
    if (!selectedId && kitchenOrders.length > 0) {
        setSelectedId(kitchenOrders[0].id);
    }
  }, [kitchenOrders, selectedId]);

  const focusedOrder = kitchenOrders.find(o => o.id === selectedId) || kitchenOrders[0];

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden font-sans">
      {/* Sidebar Queue */}
      <div className="w-1/3 border-r border-zinc-700 flex flex-col">
        <div className="p-4 border-b border-zinc-700 bg-zinc-800">
            <h1 className="text-2xl font-bold text-yellow-500">Queue (队列) - {kitchenOrders.length}</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
            {kitchenOrders.map(order => (
                <div 
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={`p-5 border-b border-zinc-700 cursor-pointer transition-colors ${
                        selectedId === order.id ? 'bg-blue-900' : 'hover:bg-zinc-800'
                    }`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold">Table {order.tableNumber}</span>
                        <span className="text-sm text-zinc-400">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="text-zinc-400">
                        {order.items.reduce((acc, i) => acc + i.quantity, 0)} items
                    </div>
                </div>
            ))}
            {kitchenOrders.length === 0 && (
                <div className="p-8 text-center text-zinc-500">
                    No orders / 暂无订单
                </div>
            )}
        </div>
      </div>

      {/* Main Focus View */}
      <div className="w-2/3 flex flex-col bg-zinc-900">
         {focusedOrder ? (
             <>
                <div className="p-6 bg-zinc-800 border-b border-zinc-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-4xl font-bold mb-1">Table {focusedOrder.tableNumber}</h2>
                        <span className="text-zinc-400">Order #{focusedOrder.id.slice(-4)}</span>
                    </div>
                    <div className="text-right">
                         <div className="text-yellow-400 font-bold text-xl">VALIDATED / 已确认</div>
                    </div>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-4">
                        {focusedOrder.items.map((item, idx) => (
                            <div key={idx} className="bg-zinc-800 p-4 rounded flex justify-between items-center border-l-8 border-yellow-500">
                                <div>
                                    {/* Chinese name prominent for kitchen */}
                                    <h3 className="text-3xl font-bold text-white mb-1">{item.menuItem.nameCN}</h3>
                                    <p className="text-xl text-zinc-400">{item.menuItem.nameFR}</p>
                                    <p className="text-sm text-zinc-500 mt-1">Code: {item.menuItem.code}</p>
                                </div>
                                <div className="text-5xl font-bold text-yellow-500">
                                    x{item.quantity}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-700 bg-zinc-800">
                    <button 
                        onClick={() => {
                            onUpdateStatus(focusedOrder.id, OrderStatus.READY);
                            setSelectedId(null);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-lg text-3xl font-bold shadow-lg flex items-center justify-center gap-4"
                    >
                        <Bell size={40}/>
                        READY / 完成
                    </button>
                </div>
             </>
         ) : (
             <div className="flex-1 flex items-center justify-center text-zinc-600">
                 <h2 className="text-3xl">Waiting for orders...</h2>
             </div>
         )}
      </div>
    </div>
  );
};

export default KitchenView;
