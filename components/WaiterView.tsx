import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderType, PaymentMethod, Table, MenuItem, OrderItem } from '../types';
import { Search, Plus, X, Trash } from 'lucide-react';
import { updateOrder, startMains } from '../services/menuService';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useOrderDnD } from '../hooks/useOrderDnD';
import { DraggableOrderCard } from './dnd/DraggableOrderCard';
import { DroppableTable } from './dnd/DroppableTable';
import { DragOverlayContent } from './dnd/DragOverlayContent';
import { ToastProvider, showOrderDropToast } from './ui/Toast';
import OrderCreationView from './OrderCreationView';

interface WaiterViewProps {
  orders: Order[];
  menu: MenuItem[];
  tables: Table[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateTables: (tables: Table[]) => void;
  onCreateOrder: (items: OrderItem[], paymentMethod: PaymentMethod, type: OrderType, tableNum: string) => void;
  onAssignTable: (orderId: string, tableLabel: string) => void;
}

// --- Helper Components for Icons to match HTML style ---
const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const WaiterView: React.FC<WaiterViewProps> = ({ orders, menu, tables, onUpdateStatus, onUpdateTables, onCreateOrder, onAssignTable }) => {
  const [mapEditMode, setMapEditMode] = useState(false);
  const [localTables, setLocalTables] = useState<Table[]>(tables);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // DnD sensors for touch and pointer support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    })
  );

  // DnD hook
  const {
    activeId,
    overId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleUndo,
    getActiveOrder,
    getOverTable,
    isTableValidForOrder,
    getTableStatus,
  } = useOrderDnD({
    orders,
    tables: localTables,
    onUpdateStatus,
    onAssignTable,
    onUndoDrop: () => {
      // Toast will handle the undo UI
    },
  });

  // View Mode State
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST' | 'CREATE_ORDER'>('MAP');
  const [listFilter, setListFilter] = useState<OrderStatus | 'ALL'>('ALL');

  // New Order State
  const [newOrderType, setNewOrderType] = useState<OrderType>(OrderType.DINE_IN);
  const [newOrderCart, setNewOrderCart] = useState<OrderItem[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedTableForNewOrder, setSelectedTableForNewOrder] = useState<Table | null>(null);

  // Order Edit Modal State
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<string | null>(null);
  const [editingNumberOfPeople, setEditingNumberOfPeople] = useState(false);
  const [tempNumberOfPeople, setTempNumberOfPeople] = useState<number>(1);

  // Optimistic state: track orders that have been dropped to hide them immediately
  const [droppedOrderIds, setDroppedOrderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
      setLocalTables(tables);
  }, [tables]);

  // Clean up droppedOrderIds when orders are updated via subscription
  // Remove orders from dropped set once they have a tableNumber assigned
  useEffect(() => {
    setDroppedOrderIds(prev => {
      const updated = new Set(prev);
      let changed = false;
      
      prev.forEach(orderId => {
        const order = orders.find(o => o.id === orderId);
        // Remove from dropped set if order now has a table number assigned
        if (order && order.tableNumber && order.tableNumber !== '?' && order.tableNumber !== '') {
          updated.delete(orderId);
          changed = true;
        }
      });
      
      return changed ? updated : prev;
    });
  }, [orders]);

  // --- MAP LOGIC ---
  const handleTableDragStart = (e: React.MouseEvent, id: string) => {
    if (!mapEditMode) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const tableIndex = localTables.findIndex(t => t.id === id);
    const startLeft = localTables[tableIndex].x;
    const startTop = localTables[tableIndex].y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        
        setLocalTables(prev => {
            const newTables = [...prev];
            newTables[tableIndex] = {
                ...newTables[tableIndex],
                x: Math.max(0, startLeft + dx),
                y: Math.max(0, startTop + dy)
            };
            return newTables;
        });
    };

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const saveLayout = () => {
      onUpdateTables(localTables);
      setMapEditMode(false);
  };

  // Enhanced drag end handler with toast
  const handleDragEndWithToast = async (event: { active: any; over: any }) => {
    const orderId = event.active?.id;
    const tableId = event.over?.id;
    
    // Check order status before drop
    const orderBeforeDrop = orders.find((o) => o.id === orderId);
    const table = localTables.find((t) => t.id === tableId);
    
    // Check if this is a valid drop before marking as dropped
    const isValidDrop = orderId && tableId && table && orderBeforeDrop && 
      orderBeforeDrop.type === OrderType.DINE_IN &&
      isTableValidForOrder(table, orderId);
    
    // Optimistically mark order as dropped immediately if valid
    if (isValidDrop && orderId) {
      setDroppedOrderIds(prev => new Set(prev).add(orderId));
    }
    
    await handleDragEnd(event);
    
    // Show toast if drop was successful (order was pending and is now validated)
    if (isValidDrop && orderBeforeDrop.status === OrderStatus.PENDING) {
      showOrderDropToast(table.label, () => {
        // When undo is called, remove from dropped set and call original undo
        if (orderId) {
          setDroppedOrderIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(orderId);
            return newSet;
          });
        }
        handleUndo();
      });
    } else if (!isValidDrop && orderId) {
      // If drop was invalid, remove from dropped set (shouldn't happen, but safety check)
      setDroppedOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // --- NEW ORDER LOGIC ---
  const handleAddItem = (item: MenuItem) => {
      setNewOrderCart(prev => {
          const exist = prev.find(i => i.menuItem.id === item.id);
          if (exist) return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
          return [...prev, { menuItem: item, quantity: 1 }];
      });
  };

  const removeFromNewOrder = (itemId: string) => {
    setNewOrderCart(prev => prev.filter(i => i.menuItem.id !== itemId));
  };

  const submitNewOrder = (items: OrderItem[], type: OrderType, tableLabel: string) => {
      if (items.length === 0) return;
      onCreateOrder(items, PaymentMethod.CASH, type, tableLabel);
      setViewMode('MAP');
      setNewOrderCart([]);
      setSelectedTableForNewOrder(null);
  };

  // --- CATEGORY MAPPING ---
  const getDisplayCategory = (categorySlug: string | null): 'Entrée' | 'Plat' | 'Dessert' | 'Boisson' | 'Autre' => {
    if (!categorySlug) return 'Autre';
    const entrees = ['entrees', 'salades'];
    const plats = ['pho', 'udon', 'riz', 'bols-riz-blanc', 'nouilles-sautees', 'bo-bun', 'plaque-chauffante', 'pimente', 'soupes-traditionnelles'];
    const desserts = ['desserts'];
    const boissons = ['boissons', 'vins'];
    
    if (entrees.includes(categorySlug)) return 'Entrée';
    if (plats.includes(categorySlug)) return 'Plat';
    if (desserts.includes(categorySlug)) return 'Dessert';
    if (boissons.includes(categorySlug)) return 'Boisson';
    return 'Autre';
  };

  // --- COMPONENTS ---

  const OrdersListView = () => {
    const filtered = orders.filter(o => listFilter === 'ALL' || o.status === listFilter).sort((a,b) => b.createdAt - a.createdAt);
    
    return (
        <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-2 overflow-x-auto items-center justify-between bg-white dark:bg-zinc-800">
                <div className="flex gap-2">
                    {(['ALL', OrderStatus.PENDING, OrderStatus.VALIDATED, OrderStatus.READY, OrderStatus.PAID] as const).map(f => (
                        <button 
                            key={f} 
                            onClick={() => setListFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${listFilter === f ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            {f === 'ALL' ? 'Tout' : (f === OrderStatus.PENDING ? 'En Attente' : f === OrderStatus.VALIDATED ? 'En Cuisine' : f === OrderStatus.READY ? 'Prêt' : 'Payé')}
                        </button>
                    ))}
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">
                    {filtered.length} Commandes
                </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#121212] p-4">
                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Table / Type</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Détails</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filtered.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4 font-mono text-sm font-bold text-gray-700 dark:text-gray-300">#{order.id.slice(-4)}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{order.tableNumber && order.tableNumber !== '?' && order.tableNumber !== '' ? `Table ${order.tableNumber}` : order.type === OrderType.DINE_IN ? 'À placer' : 'À Emporter'}</div>
                                        <div className="text-xs text-gray-500">{order.type === OrderType.TAKEAWAY ? 'À Emporter' : 'Sur Place'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                                            order.status === OrderStatus.VALIDATED ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                                            order.status === OrderStatus.READY ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                order.status === OrderStatus.PENDING ? 'bg-yellow-500' :
                                                order.status === OrderStatus.VALIDATED ? 'bg-blue-500' :
                                                order.status === OrderStatus.READY ? 'bg-green-500' :
                                                'bg-gray-500'
                                            }`}></span>
                                            {order.status === OrderStatus.PENDING ? 'En Attente' : order.status === OrderStatus.VALIDATED ? 'En Cuisine' : order.status === OrderStatus.READY ? 'Prêt' : 'Payé'}
                                        </span>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                                            {order.items.map(i => `${i.quantity}x ${i.menuItem.nameFR}`).join(', ')}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">
                                        {order.items.reduce((a,b) => a + (b.quantity * b.menuItem.price), 0).toFixed(2)}€
                                    </td>
                                    <td className="p-4 text-right">
                                        {order.status === OrderStatus.PENDING && (
                                            <button onClick={() => onUpdateStatus(order.id, OrderStatus.VALIDATED)} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all">
                                                Valider
                                            </button>
                                        )}
                                        {order.status === OrderStatus.READY && (
                                            <button onClick={() => onUpdateStatus(order.id, OrderStatus.PAID)} className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all">
                                                Encaisser
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                            <Icon name="assignment" className="text-4xl mb-3 opacity-20"/>
                            <p>Aucune commande trouvée.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const TableDetailModal = () => {
      const selectedTable = localTables.find(t => t.id === selectedTableId);
      if (!selectedTable || !selectedTableId) return null;
      
      const { status, order } = getTableStatus(selectedTable.label);
      
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedTableId(null)}></div>
            <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-surface-dark text-left shadow-2xl transition-all sm:w-full sm:max-w-2xl flex flex-col max-h-[90vh]">
                <div className="bg-primary px-4 py-4 sm:px-6 flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <Icon name="table_restaurant" className="text-white text-2xl"/>
                        </div>
                        <div>
                            <h3 className="text-lg font-display font-bold leading-6 text-white" id="modal-title">Table {selectedTable.label}</h3>
                            <p className="text-red-100 text-xs mt-0.5">{order ? `Commande #${order.id.slice(-4)}` : 'Libre'}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedTableId(null)} className="rounded-full p-2 text-red-100 hover:bg-white/10 hover:text-white transition-colors focus:outline-none">
                        <span className="sr-only">Fermer</span>
                        <Icon name="close" className="text-2xl"/>
                    </button>
                </div>

                {order ? (
                    <>
                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#121212] p-4 sm:p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">État de la commande</span>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${order.status === OrderStatus.PENDING ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-3 w-3 ${order.status === OrderStatus.PENDING ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{order.status === OrderStatus.PENDING ? 'En Attente' : order.status === OrderStatus.VALIDATED ? 'En Cuisine' : 'Prêt'}</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between text-right">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total à Payer</span>
                                <span className="font-display font-bold text-2xl text-primary dark:text-red-400">{order.items.reduce((acc, i) => acc + (i.quantity * i.menuItem.price), 0).toFixed(2)} €</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Icon name="list_alt" className="text-gray-400 text-sm"/>
                                    Détails de la Commande
                                </h4>
                            </div>
                            <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 text-sm">{item.quantity}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{item.menuItem.nameFR}</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{(item.quantity * item.menuItem.price).toFixed(2)} €</p>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.menuItem.code}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 justify-between items-center">
                        <div className="flex w-full sm:w-auto gap-2">
                             <button className="flex-1 sm:flex-none justify-center rounded-lg bg-white dark:bg-surface-dark px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2" type="button">
                                <Icon name="print" className="text-lg" />
                                Ticket
                            </button>
                        </div>
                        <div className="flex w-full sm:w-auto gap-2">
                            {order.status === OrderStatus.PENDING && (
                                <button onClick={() => { onUpdateStatus(order.id, OrderStatus.VALIDATED); }} className="flex-1 sm:flex-none justify-center rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 flex items-center gap-2">
                                    <Icon name="check_circle" className="text-lg"/> Valider
                                </button>
                            )}
                            {order.status === OrderStatus.VALIDATED && !order.mainsStarted && (
                                <button 
                                    onClick={async () => { 
                                        try {
                                            await startMains(order.id);
                                        } catch (error) {
                                            console.error('Error starting mains:', error);
                                        }
                                    }} 
                                    className="flex-1 sm:flex-none justify-center rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 flex items-center gap-2 animate-pulse"
                                >
                                    <Icon name="local_fire_department" className="text-lg"/> COMMENCER LES PLATS
                                </button>
                            )}
                            {order.status !== OrderStatus.PAID && (
                                <button onClick={() => { onUpdateStatus(order.id, OrderStatus.PAID); setSelectedTableId(null); }} className="flex-1 sm:flex-none justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover flex items-center gap-2">
                                    <Icon name="euro_symbol" className="text-lg"/> Encaisser
                                </button>
                            )}
                        </div>
                    </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
                        <Icon name="table_restaurant" className="text-6xl mb-4 opacity-20"/>
                        <p className="text-lg font-medium">Cette table est libre.</p>
                        <button onClick={() => { 
                            setNewOrderType(OrderType.DINE_IN);
                            setSelectedTableForNewOrder(selectedTable);
                            setViewMode('CREATE_ORDER');
                            setSelectedTableId(null); 
                        }} className="mt-6 text-primary font-bold hover:underline">Créer une commande pour cette table</button>
                    </div>
                )}
            </div>
          </div>
      );
  };

  const OrderEditModal = () => {
    const order = orders.find(o => o.id === selectedOrderForEdit);
    if (!order || !selectedOrderForEdit) return null;

    // Group items by display category
    const groupedItems: Record<'Entrée' | 'Plat' | 'Dessert' | 'Boisson' | 'Autre', OrderItem[]> = {
      'Entrée': [],
      'Plat': [],
      'Dessert': [],
      'Boisson': [],
      'Autre': []
    };

    order.items.forEach(item => {
      const category = getDisplayCategory(item.menuItem.category);
      groupedItems[category].push(item);
    });

    const handleSave = async () => {
      if (order.type === OrderType.DINE_IN && tempNumberOfPeople !== (order.numberOfPeople || 1)) {
        await updateOrder(order.id, { numberOfPeople: tempNumberOfPeople });
      }
      setSelectedOrderForEdit(null);
      setEditingNumberOfPeople(false);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedOrderForEdit(null)}></div>
        <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-surface-dark text-left shadow-2xl transition-all sm:w-full sm:max-w-2xl flex flex-col max-h-[90vh]">
          <div className="bg-primary px-4 py-4 sm:px-6 flex justify-between items-center z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <Icon name="edit" className="text-white text-2xl"/>
              </div>
              <div>
                <h3 className="text-lg font-display font-bold leading-6 text-white">Modifier la commande</h3>
                <p className="text-red-100 text-xs mt-0.5">
                  {order.type === OrderType.DINE_IN ? 'Sur Place' : 'À Emporter'}
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedOrderForEdit(null)} className="rounded-full p-2 text-red-100 hover:bg-white/10 hover:text-white transition-colors focus:outline-none">
              <span className="sr-only">Fermer</span>
              <Icon name="close" className="text-2xl"/>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#121212] p-4 sm:p-6 space-y-6">
            {/* Number of People Section */}
            {order.type === OrderType.DINE_IN && (
              <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="group" className="text-gray-500 text-xl"/>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Nombre de personnes</span>
                      {editingNumberOfPeople ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={tempNumberOfPeople}
                            onChange={(e) => setTempNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm font-bold"
                            autoFocus
                            onBlur={() => setEditingNumberOfPeople(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingNumberOfPeople(false);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <span 
                          className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors mt-1 block"
                          onClick={() => setEditingNumberOfPeople(true)}
                        >
                          {order.numberOfPeople || 1}
                        </span>
                      )}
                    </div>
                  </div>
                  {!editingNumberOfPeople && (
                    <button
                      onClick={() => setEditingNumberOfPeople(true)}
                      className="text-primary hover:text-primary-hover transition-colors"
                    >
                      <Icon name="edit" className="text-lg"/>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Order Items by Category */}
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                <Icon name="list_alt" className="text-gray-400 text-sm"/>
                Détails de la commande
              </h4>
              <div className="space-y-4">
                {(['Entrée', 'Plat', 'Dessert', 'Boisson'] as const).map(category => {
                  if (groupedItems[category].length === 0) return null;
                  return (
                    <div key={category} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <h5 className="font-bold text-sm text-gray-800 dark:text-white">{category}</h5>
                      </div>
                      <div className="divide-y divide-gray-50 dark:divide-gray-700">
                        {groupedItems[category].map((item, idx) => (
                          <div key={idx} className="p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 text-sm">
                              {item.quantity}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                  {item.menuItem.nameFR}
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {(item.quantity * item.menuItem.price).toFixed(2)} €
                                </p>
                              </div>
                              {item.menuItem.code && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {item.menuItem.code}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {groupedItems['Autre'].length > 0 && (
                  <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <h5 className="font-bold text-sm text-gray-800 dark:text-white">Autre</h5>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                      {groupedItems['Autre'].map((item, idx) => (
                        <div key={idx} className="p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 text-sm">
                            {item.quantity}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                {item.menuItem.nameFR}
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {(item.quantity * item.menuItem.price).toFixed(2)} €
                              </p>
                            </div>
                            {item.menuItem.code && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.menuItem.code}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 justify-end items-center">
            <button
              onClick={() => setSelectedOrderForEdit(null)}
              className="px-6 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-200 bg-white dark:bg-surface-dark rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Icon name="save" className="text-lg"/>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const unassignedOrders = orders.filter(o => 
      !droppedOrderIds.has(o.id) &&
      o.status !== OrderStatus.PAID && 
      (
          (o.type === OrderType.DINE_IN && (!o.tableNumber || o.tableNumber === '?' || o.tableNumber === '')) ||
          o.type === OrderType.TAKEAWAY
      )
  ).sort((a,b) => b.createdAt - a.createdAt);

  const activeOrder = getActiveOrder();

  if (viewMode === 'CREATE_ORDER') {
    return (
      <OrderCreationView 
        menu={menu}
        tables={localTables}
        initialOrderType={newOrderType}
        initialTable={selectedTableForNewOrder}
        onCancel={() => setViewMode('MAP')}
        onSubmit={submitNewOrder}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEndWithToast}
    >
      <ToastProvider />
      <div className="bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-200 font-body antialiased h-screen flex flex-col overflow-hidden transition-colors duration-300">
          <header className="bg-primary text-white shadow-lg z-30 flex-shrink-0">
              <div className="px-6 h-16 flex items-center justify-between">
                  <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3">
                          <Icon name="restaurant_menu" className="text-3xl"/>
                          <h1 className="font-display font-bold text-2xl tracking-wide">Le Gourmet</h1>
                      </div>
                      <nav className="hidden md:flex items-center gap-2">
                          <button 
                              onClick={() => setViewMode('MAP')} 
                              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${viewMode === 'MAP' ? 'bg-red-900/40 text-white' : 'text-red-100 hover:bg-red-900/20'}`}
                          >
                              <Icon name="dashboard" className="text-sm"/> Vue d'ensemble
                          </button>
                          <button 
                              onClick={() => setViewMode('LIST')} 
                              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 relative transition-colors ${viewMode === 'LIST' ? 'bg-red-900/40 text-white' : 'text-red-100 hover:bg-red-900/20'}`}
                          >
                              <Icon name="receipt_long" className="text-sm"/> Commandes
                              {unassignedOrders.length > 0 && <span className="bg-accent-gold text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">{unassignedOrders.length}</span>}
                          </button>
                      </nav>
                  </div>
                  <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-red-100 hover:text-white transition-colors text-sm font-medium">
                          <Icon name="logout" className="text-xl"/>
                          <span className="hidden lg:block">Déconnexion</span>
                      </button>
                  </div>
              </div>
          </header>

        {viewMode === 'MAP' ? (
             <main className="flex-1 overflow-hidden p-6 gap-6 grid grid-cols-1 lg:grid-cols-12 bg-gray-50 dark:bg-[#121212]">
                {/* Sidebar / Queue - Responsive Column */}
                <section className="lg:col-span-3 flex flex-col h-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                        <h3 className="font-display font-bold text-base text-gray-800 dark:text-white flex items-center gap-2">
                            <Icon name="notifications_active" className="text-primary dark:text-red-400 text-xl"/>
                            Commandes en file
                        </h3>
                        <span className="bg-primary/10 text-primary dark:text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{unassignedOrders.length} En attente</span>
                    </div>
                    <div className="overflow-y-auto flex-1 p-3 space-y-3 scrollbar-hide">
                        {unassignedOrders.map(order => (
                            <DraggableOrderCard
                                key={order.id}
                                order={order}
                                onClick={() => {
                                    if (activeId !== order.id) {
                                        setSelectedOrderForEdit(order.id);
                                        setTempNumberOfPeople(order.numberOfPeople || 1);
                                    }
                                }}
                            />
                        ))}
                        {unassignedOrders.length === 0 && (
                             <div className="text-center p-8 text-gray-400 text-sm italic">Aucune commande en attente.</div>
                        )}
                    </div>
                </section>

                {/* Map Area - Responsive Column */}
                <section className="lg:col-span-9 flex flex-col h-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center bg-gray-50/50 dark:bg-gray-800/30 gap-4">
                        <div>
                            <h3 className="font-display font-bold text-xl text-gray-800 dark:text-white">Plan de Salle</h3>
                            <div className="flex gap-4 mt-2 text-xs font-medium">
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500"></span> Libre</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700"></span> Occupé</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white dark:bg-gray-800 border-2 border-primary animate-pulse"></span> Nouvelle Commande</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <button onClick={() => mapEditMode ? saveLayout() : setMapEditMode(true)} className={`text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm ${mapEditMode ? 'bg-green-50 text-green-700 border-green-200' : ''}`}>
                                <Icon name={mapEditMode ? "save" : "edit"} className="text-lg"/>
                                {mapEditMode ? "Sauvegarder" : "Éditer"}
                            </button>
                            {mapEditMode && <button onClick={() => {const newId = Date.now().toString(); setLocalTables([...localTables, { id: newId, label: '?', x: 100, y: 100, type: 'ROUND', capacity: 4 }]);}} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold"><Plus size={16}/></button>}
                            <button onClick={() => { setViewMode('CREATE_ORDER'); setNewOrderType(OrderType.DINE_IN); setSelectedTableForNewOrder(null); }} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg shadow-red-900/20 transition-all transform active:scale-95 font-medium text-sm">
                                <Icon name="add" className="text-lg"/>
                                Nouvelle Commande
                            </button>
                        </div>
                    </div>

                    <div 
                        className="flex-1 relative overflow-auto p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px] transition-all duration-300"
                    >
                        {localTables.map(table => {
                            const { status, order: tableOrder } = getTableStatus(table.label);
                            const isOccupied = status === 'OCCUPIED';
                            const isValidDrop = activeId ? isTableValidForOrder(table, activeId) : true;
                            const isDragging = !!activeId;
                            
                            return (
                                <DroppableTable
                                    key={table.id}
                                    table={table}
                                    isOccupied={isOccupied}
                                    isValidDrop={isValidDrop}
                                    isDragging={isDragging}
                                    order={tableOrder}
                                    onClick={() => !mapEditMode && setSelectedTableId(table.id)}
                                    onMouseDown={(e) => mapEditMode && handleTableDragStart(e, table.id)}
                                    onLabelChange={(label) => setLocalTables(localTables.map(t => t.id === table.id ? { ...t, label } : t))}
                                    mapEditMode={mapEditMode}
                                />
                            );
                        })}
                        
                        {mapEditMode && localTables.map(table => (
                            <div key={`edit-${table.id}`} className="absolute -top-2 -right-2 flex gap-1 z-50" style={{ left: table.x + (table.type === 'RECT' ? 140 : 96), top: table.y }}>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLocalTables(localTables.map(t => t.id === table.id ? {...t, type: t.type === 'RECT' ? 'ROUND' : 'RECT'} : t));
                                    }} 
                                    className="bg-blue-500 text-white p-1 rounded-full shadow-sm text-xs"
                                >
                                    <Icon name="sync_alt" className="text-xs font-bold"/>
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLocalTables(localTables.filter(t => t.id !== table.id));
                                    }} 
                                    className="bg-red-500 text-white p-1 rounded-full shadow-sm text-xs"
                                >
                                    <Trash size={12}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        ) : (
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#121212] p-6">
                <OrdersListView />
            </div>
        )}
        
        <TableDetailModal />
        <OrderEditModal />
        
        <DragOverlay>
          {activeOrder ? <DragOverlayContent order={activeOrder} /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default WaiterView;