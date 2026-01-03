import React, { useState, useEffect } from 'react';
import { MenuItem, Order, OrderItem, OrderStatus, PaymentMethod, Table, OrderType } from './types';
import { Category } from './services/supabaseClient';
import { INITIAL_TABLES } from './constants';
import ClientView from './components/ClientView';
import WaiterView from './components/WaiterView';
import KitchenView from './components/KitchenView';
import AdminView from './components/AdminView';
import { ChefHat, User, ClipboardList, Settings } from 'lucide-react';
import { 
  fetchMenuItems,
  fetchAllMenuItems,
  fetchCategories,
  updateMenuItems,
  createOrder, 
  fetchOrdersWithItems, 
  updateOrderStatus, 
  updateOrderTable,
  subscribeToOrders 
} from './services/menuService';

enum View {
  CLIENT = 'CLIENT',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  ADMIN = 'ADMIN',
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CLIENT);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [adminMenu, setAdminMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [loading, setLoading] = useState(true);

  // Load menu items and categories on mount (no authentication required)
  useEffect(() => {
    const initialize = async () => {
      try {
        // Menu items and categories are publicly readable, no auth needed
        const [items, cats, adminItems] = await Promise.all([
          fetchMenuItems(),
          fetchCategories(),
          fetchAllMenuItems()
        ]);
        setMenu(items);
        setCategories(cats);
        setAdminMenu(adminItems);
      } catch (error) {
        console.error('Failed to load menu:', error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  // Load orders on mount and subscribe to changes
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const allOrders = await fetchOrdersWithItems();
        setOrders(allOrders);
      } catch (error) {
        console.error('Failed to load orders:', error);
      }
    };
    loadOrders();

    // Subscribe to order changes
    const unsubscribe = subscribeToOrders((order) => {
      setOrders(prev => {
        const existingIndex = prev.findIndex(o => o.id === order.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = order;
          return updated;
        } else {
          return [order, ...prev];
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle Client Order
  const handleClientSubmit = async (items: OrderItem[], paymentMethod: PaymentMethod, type: OrderType) => {
    try {
      const tableNumber = type === OrderType.DINE_IN ? null : 'Takeaway';
      await createOrder(items, paymentMethod, type, tableNumber);
      // Order will be added via subscription
    } catch (error: any) {
      console.error('Failed to create order:', error);
      // Provide more specific error message if auth-related
      if (error?.message?.includes('anonymous') || error?.message?.includes('auth')) {
        alert('Erreur d\'authentification. Veuillez contacter le support.');
      } else {
        alert('Erreur lors de la création de la commande. Veuillez réessayer.');
      }
    }
  };

  // Handle Waiter Manual Order
  const handleWaiterCreateOrder = async (items: OrderItem[], paymentMethod: PaymentMethod, type: OrderType, tableNum: string) => {
    try {
      const order = await createOrder(items, paymentMethod, type, tableNum || null);
      // Auto-validate waiter orders
      await updateOrderStatus(order.id, OrderStatus.VALIDATED);
      // Order will be updated via subscription
    } catch (error: any) {
      console.error('Failed to create waiter order:', error);
      // Provide more specific error message if auth-related
      if (error?.message?.includes('anonymous') || error?.message?.includes('auth')) {
        alert('Erreur d\'authentification. Veuillez contacter le support.');
      } else {
        alert('Erreur lors de la création de la commande. Veuillez réessayer.');
      }
    }
  };

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      // Order will be updated via subscription
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Erreur lors de la mise à jour du statut. Veuillez réessayer.');
    }
  };

  const handleAssignTable = async (orderId: string, tableLabel: string) => {
    try {
      await updateOrderTable(orderId, tableLabel);
      // Order will be updated via subscription
    } catch (error) {
      console.error('Failed to assign table:', error);
      alert('Erreur lors de l\'attribution de la table. Veuillez réessayer.');
    }
  };

  // Handle menu update from admin panel
  const handleUpdateMenu = async (updatedMenu: MenuItem[]) => {
    try {
      await updateMenuItems(updatedMenu);
      // Reload both admin menu and public menu
      const [items, adminItems] = await Promise.all([
        fetchMenuItems(),
        fetchAllMenuItems()
      ]);
      setMenu(items);
      setAdminMenu(adminItems);
      alert('Menu mis à jour avec succès!');
    } catch (error) {
      console.error('Failed to update menu:', error);
      alert('Erreur lors de la mise à jour du menu. Veuillez réessayer.');
    }
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-lg">Chargement...</div>
        </div>
      );
    }

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
        return <AdminView menu={adminMenu} categories={categories} onUpdateMenu={handleUpdateMenu} />;
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