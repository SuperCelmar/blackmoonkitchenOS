import React, { useState, useEffect } from 'react';
import { MenuItem, Order, OrderItem, OrderStatus, PaymentMethod, Table, OrderType } from './types';
import { Category } from './services/supabaseClient';
import { INITIAL_TABLES } from './constants';
import ClientView from './components/ClientView';
import WaiterView from './components/WaiterView';
import KitchenView from './components/KitchenView';
import AdminView from './components/AdminView';
import DevLogin from './components/DevLogin';
import { ChefHat, User, ClipboardList, Settings, LogOut } from 'lucide-react';
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
import { getCurrentUser, signOut, onAuthStateChange, AuthUser } from './services/authService';

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication state on mount
  useEffect(() => {
    let isMounted = true;
    const authStartTime = Date.now();
    console.log('[Auth] Starting authentication check...');
    
    const timeout = setTimeout(() => {
      if (isMounted && checkingAuth) {
        const elapsed = Date.now() - authStartTime;
        console.warn(`[Auth] Timeout after ${elapsed}ms - forcing login screen`);
        setCheckingAuth(false);
      }
    }, 15000); // 15 seconds timeout (increased from 5s for slow networks)

    const checkAuth = async () => {
      try {
        console.log('[Auth] Calling getCurrentUser()...');
        const sessionStartTime = Date.now();
        const currentUser = await getCurrentUser();
        const sessionElapsed = Date.now() - sessionStartTime;
        
        console.log(`[Auth] getCurrentUser() completed in ${sessionElapsed}ms`);
        console.log('[Auth] Current user:', currentUser ? {
          id: currentUser.id,
          email: currentUser.email,
          role: currentUser.role
        } : 'null');
        
        if (isMounted) {
          setUser(currentUser);
          if (currentUser?.role === 'dev') {
            console.log('[Auth] ✓ Dev user authenticated successfully');
          } else if (currentUser) {
            console.log(`[Auth] ⚠ User authenticated but role is '${currentUser.role}', not 'dev'`);
          } else {
            console.log('[Auth] ⚠ No user session found');
          }
        }
      } catch (error: any) {
        const elapsed = Date.now() - authStartTime;
        console.error(`[Auth] Error checking auth after ${elapsed}ms:`, error);
        console.error('[Auth] Error details:', {
          message: error?.message,
          code: error?.code,
          status: error?.status
        });
      } finally {
        const totalElapsed = Date.now() - authStartTime;
        console.log(`[Auth] Auth check completed in ${totalElapsed}ms`);
        if (isMounted) {
          setCheckingAuth(false);
          clearTimeout(timeout);
        }
      }
    };

    checkAuth();

    // Listen to auth state changes
    console.log('[Auth] Setting up auth state change listener...');
    const { data: { subscription } } = onAuthStateChange((authUser) => {
      console.log('[Auth] Auth state changed:', authUser ? {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role
      } : 'null');
      
      if (isMounted) {
        // Only update if we don't already have a user, or if the new user is null (sign out)
        // This prevents race conditions during login where handleLoginSuccess sets the user
        // but the auth listener might temporarily receive an incomplete state.
        setUser(prevUser => {
          if (!authUser) {
            console.log('[Auth] Listener: Clearing user (sign out)');
            return null;
          }
          if (!prevUser || prevUser.id !== authUser.id || (authUser.role && !prevUser.role)) {
            console.log('[Auth] Listener: Updating user state');
            return authUser;
          }
          console.log('[Auth] Listener: Ignoring redundant update');
          return prevUser;
        });
      }
    });

    return () => {
      console.log('[Auth] Cleaning up auth check...');
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

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

  // Load orders on mount and subscribe to changes (only when authenticated as dev)
  useEffect(() => {
    if (!user || user.role !== 'dev') {
      return;
    }

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
  }, [user]);

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

  const handleLoginSuccess = (authUser: AuthUser) => {
    console.log('[Auth] handleLoginSuccess: Received user:', authUser.email, 'with role:', authUser.role);
    if (authUser.role !== 'dev') {
      console.warn('[Auth] handleLoginSuccess: User is authenticated but NOT a dev. Stay on login screen.');
      alert('Accès refusé. Vous devez avoir le rôle "dev" pour accéder à cette interface.');
      return;
    }
    console.log('[Auth] handleLoginSuccess: Setting user and transitioning view...');
    setUser(authUser);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setOrders([]);
    } catch (error) {
      console.error('Error signing out:', error);
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

  // Show login screen if not authenticated as dev
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Vérification de l'authentification...</div>
      </div>
    );
  }

  if (!user || user.role !== 'dev') {
    return <DevLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-white text-zinc-900 overflow-hidden">
      {/* Role Switcher (Visible when authenticated as dev) */}
      <div className="bg-zinc-900 text-white p-2 flex justify-between items-center gap-4 text-xs shrink-0 z-50 shadow-md">
        <div className="flex justify-center gap-4 flex-1">
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
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-xs">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 px-3 py-1 rounded transition-colors hover:bg-zinc-700"
            title="Déconnexion"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-white">
        {renderView()}
      </div>
    </div>
  );
};

export default App;