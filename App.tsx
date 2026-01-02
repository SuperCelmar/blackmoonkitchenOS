import React, { useState } from 'react';
import { MenuItem, Order, OrderItem, OrderStatus, PaymentMethod, Table, OrderType } from './types';
import { INITIAL_MENU, INITIAL_TABLES } from './constants';
import ClientView from './components/ClientView';
import WaiterView from './components/WaiterView';
import KitchenView from './components/KitchenView';
import AdminView from './components/AdminView';
import { ChefHat, User, ClipboardList, Settings } from 'lucide-react';

enum View {
  CLIENT = 'CLIENT',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  ADMIN = 'ADMIN',
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CLIENT);
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);

  // Handle Client Order
  const handleClientSubmit = (items: OrderItem[], paymentMethod: PaymentMethod, type: OrderType) => {
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      tableNumber: type === OrderType.DINE_IN ? '?' : 'Takeaway', // Waiter will assign if Dine-in and table not known
      type,
      items,
      status: OrderStatus.PENDING,
      paymentMethod,
      createdAt: Date.now(),
    };
    setOrders(prev => [...prev, newOrder]);
  };

  // Handle Waiter Manual Order
  const handleWaiterCreateOrder = (items: OrderItem[], paymentMethod: PaymentMethod, type: OrderType, tableNum: string) => {
     const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        tableNumber: tableNum || '?',
        type,
        items,
        status: OrderStatus.VALIDATED, // Waiter created means auto-validated
        paymentMethod,
        createdAt: Date.now(),
     };
     setOrders(prev => [...prev, newOrder]);
  };

  const handleStatusUpdate = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleAssignTable = (orderId: string, tableLabel: string) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tableNumber: tableLabel } : o));
  };

  const renderView = () => {
    switch (currentView) {
      case View.CLIENT:
        return <ClientView menu={menu} onSubmitOrder={handleClientSubmit} />;
      case View.WAITER:
        return (
            <WaiterView 
                orders={orders} 
                menu={menu}
                tables={tables}
                onUpdateStatus={handleStatusUpdate} 
                onUpdateTables={setTables}
                onCreateOrder={handleWaiterCreateOrder}
                onAssignTable={handleAssignTable}
            />
        );
      case View.KITCHEN:
        return <KitchenView orders={orders} onUpdateStatus={handleStatusUpdate} />;
      case View.ADMIN:
        return <AdminView menu={menu} onUpdateMenu={setMenu} />;
      default:
        return <div>Error</div>;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-white text-zinc-900 overflow-hidden">
      {/* Role Switcher (For Demo Purposes) */}
      <div className="bg-zinc-900 text-white p-2 flex justify-center gap-4 text-xs shrink-0 z-50 shadow-md">
        <button 
            onClick={() => setCurrentView(View.CLIENT)} 
            className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${currentView === View.CLIENT ? 'bg-orange-600' : 'hover:bg-zinc-700'}`}
        >
            <User size={14} /> CLIENT
        </button>
        <button 
            onClick={() => setCurrentView(View.WAITER)} 
            className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${currentView === View.WAITER ? 'bg-blue-600' : 'hover:bg-zinc-700'}`}
        >
            <ClipboardList size={14} /> SERVEUR ({orders.filter(o => o.status === OrderStatus.PENDING).length})
        </button>
        <button 
            onClick={() => setCurrentView(View.KITCHEN)} 
            className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${currentView === View.KITCHEN ? 'bg-green-600' : 'hover:bg-zinc-700'}`}
        >
            <ChefHat size={14} /> CUISINE ({orders.filter(o => o.status === OrderStatus.VALIDATED).length})
        </button>
        <button 
            onClick={() => setCurrentView(View.ADMIN)} 
            className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${currentView === View.ADMIN ? 'bg-purple-600' : 'hover:bg-zinc-700'}`}
        >
            <Settings size={14} /> ADMIN
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-white">
        {renderView()}
      </div>
    </div>
  );
};

export default App;