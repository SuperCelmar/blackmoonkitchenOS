import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderType, PaymentMethod, Table, MenuItem, OrderItem } from '../types';
import { Search, Plus, X, Trash } from 'lucide-react';

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
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  // View Mode State
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');
  const [listFilter, setListFilter] = useState<OrderStatus | 'ALL'>('ALL');

  // New Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrderType, setNewOrderType] = useState<OrderType>(OrderType.DINE_IN);
  const [newOrderCart, setNewOrderCart] = useState<OrderItem[]>([]);
  const [menuSearch, setMenuSearch] = useState('');

  useEffect(() => {
      setLocalTables(tables);
  }, [tables]);

  // --- MAP LOGIC ---
  const handleDragStart = (e: React.MouseEvent, id: string) => {
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

  const getTableStatus = (tableLabel: string) => {
      const activeOrder = orders.find(o => o.tableNumber === tableLabel && o.status !== OrderStatus.PAID && o.type === OrderType.DINE_IN);
      if (activeOrder) return { status: 'OCCUPIED', order: activeOrder };
      return { status: 'FREE', order: null };
  };

  const saveLayout = () => {
      onUpdateTables(localTables);
      setMapEditMode(false);
  };

  // --- DRAG AND DROP ORDERS ---
  const handleOrderDragStart = (e: React.DragEvent, orderId: string) => {
      setDraggedOrderId(orderId);
      e.dataTransfer.setData('text/plain', orderId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleTableDrop = (e: React.DragEvent, tableLabel: string) => {
      e.preventDefault();
      const orderId = e.dataTransfer.getData('text/plain');
      if (orderId) {
          onAssignTable(orderId, tableLabel);
          setDraggedOrderId(null);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
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

  const submitNewOrder = () => {
      if (newOrderCart.length === 0) return;
      const tableAssignment = newOrderType === OrderType.DINE_IN ? '?' : 'Takeaway';
      onCreateOrder(newOrderCart, PaymentMethod.CASH, newOrderType, tableAssignment);
      setShowOrderModal(false);
      setNewOrderCart([]);
      setMenuSearch('');
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
                                        <div className="font-bold text-gray-900 dark:text-white">{order.tableNumber !== '?' && order.tableNumber !== '' ? `Table ${order.tableNumber}` : 'À placer'}</div>
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

  const NewOrderModal = () => {
      if (!showOrderModal) return null;
      const total = newOrderCart.reduce((acc, i) => acc + (i.menuItem.price * i.quantity), 0);
      const filteredMenu = menu.filter(item => 
          item.nameFR.toLowerCase().includes(menuSearch.toLowerCase()) || 
          item.code.toLowerCase().includes(menuSearch.toLowerCase())
      );

      return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-body">
              <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-700">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-zinc-800">
                      <div>
                        <h2 className="font-display font-bold text-xl text-gray-800 dark:text-white">Nouvelle Commande</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Créer une commande manuelle</p>
                      </div>
                      <button onClick={() => setShowOrderModal(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                      {/* Left: Menu */}
                      <div className="w-2/3 flex flex-col border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900">
                          <div className="p-4 space-y-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-surface-dark">
                                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                                    <button onClick={() => setNewOrderType(OrderType.DINE_IN)} className={`flex-1 py-2 px-4 rounded-md font-bold text-sm transition-all ${newOrderType === OrderType.DINE_IN ? 'bg-white dark:bg-zinc-700 text-primary dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Sur Place</button>
                                    <button onClick={() => setNewOrderType(OrderType.TAKEAWAY)} className={`flex-1 py-2 px-4 rounded-md font-bold text-sm transition-all ${newOrderType === OrderType.TAKEAWAY ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>A Emporter</button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        value={menuSearch} 
                                        onChange={e => setMenuSearch(e.target.value)} 
                                        className="w-full pl-10 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Rechercher..."
                                    />
                                </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredMenu.map(item => (
                                    <button key={item.id} onClick={() => handleAddItem(item)} className="bg-white dark:bg-surface-dark p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all text-left flex flex-col justify-between h-full group">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-gray-800 dark:text-white group-hover:text-primary line-clamp-1">{item.nameFR}</span>
                                                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">{item.code}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{item.nameCN}</div>
                                        </div>
                                        <div className="font-bold text-primary dark:text-accent-gold">{item.price.toFixed(2)}€</div>
                                    </button>
                                ))}
                            </div>
                          </div>
                      </div>

                      {/* Right: Cart */}
                      <div className="w-1/3 flex flex-col bg-white dark:bg-surface-dark">
                          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Icon name="shopping_cart" className="text-lg"/> Panier ({newOrderCart.reduce((a, b) => a + b.quantity, 0)})
                            </h3>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-3">
                              {newOrderCart.map(item => (
                                  <div key={item.menuItem.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-800 dark:text-white">{item.menuItem.nameFR}</div>
                                        <div className="text-xs text-gray-500">{item.quantity} x {item.menuItem.price}€</div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <span className="font-bold text-gray-900 dark:text-white">{(item.menuItem.price * item.quantity).toFixed(2)}€</span>
                                          <button onClick={() => removeFromNewOrder(item.menuItem.id)} className="text-red-400 hover:text-red-600 p-1"><Trash size={16} /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800">
                              <div className="flex justify-between items-end mb-4">
                                  <span className="text-gray-500 dark:text-gray-400">Total</span>
                                  <span className="text-3xl font-display font-bold text-primary dark:text-accent-gold">{total.toFixed(2)}€</span>
                              </div>
                              <button onClick={submitNewOrder} disabled={newOrderCart.length === 0} className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                  Valider
                              </button>
                          </div>
                      </div>
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
                        <button onClick={() => { setShowOrderModal(true); setSelectedTableId(null); }} className="mt-6 text-primary hover:underline">Créer une commande pour cette table</button>
                    </div>
                )}
            </div>
          </div>
      );
  };

  const unassignedOrders = orders.filter(o => 
      o.status !== OrderStatus.PAID && 
      (
          (o.type === OrderType.DINE_IN && (o.tableNumber === '?' || o.tableNumber === '')) ||
          o.type === OrderType.TAKEAWAY
      )
  ).sort((a,b) => b.createdAt - a.createdAt);

  return (
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
                             <div 
                                key={order.id}
                                draggable={order.type === OrderType.DINE_IN}
                                onDragStart={(e) => handleOrderDragStart(e, order.id)}
                                className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-600 relative group cursor-grab active:cursor-grabbing hover:shadow-md transition-all ring-1 ring-transparent hover:ring-primary/20 ${draggedOrderId === order.id ? 'opacity-50 border-dashed border-primary' : ''}`}
                             >
                                <div className="corner-pattern corner-tl"></div>
                                <div className="corner-pattern corner-tr"></div>
                                <div className="corner-pattern corner-bl"></div>
                                <div className="corner-pattern corner-br"></div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Icon name={order.type === OrderType.TAKEAWAY ? "shopping_bag" : "drag_indicator"} className="text-gray-400 text-lg cursor-grab"/>
                                        <div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${order.type === OrderType.TAKEAWAY ? 'text-blue-500' : 'text-gray-400'}`}>
                                                {order.type === OrderType.TAKEAWAY ? 'À Emporter' : 'Sur Place'}
                                            </span>
                                            <h4 className="font-bold text-base text-gray-900 dark:text-white">#{order.id.slice(-4)}</h4>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                        order.status === OrderStatus.READY ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                        order.status === OrderStatus.VALIDATED ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                    }`}>
                                        {order.status === OrderStatus.READY ? 'PRÊT' : 
                                         order.status === OrderStatus.VALIDATED ? 'EN CUISINE' : 'NOUVEAU'}
                                    </span>
                                </div>
                                <div className="space-y-0.5 mb-3 pl-7 text-xs text-gray-600 dark:text-gray-300">
                                    {order.items.map((i, idx) => (
                                        <p key={idx} className="truncate">{i.quantity}x {i.menuItem.nameFR}</p>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pl-7 pt-2 border-t border-gray-50 dark:border-gray-700">
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Icon name="schedule" className="text-xs" /> {Math.floor((Date.now() - order.createdAt)/60000)} min
                                    </span>
                                    <div className="text-xs font-bold text-primary dark:text-accent-gold">{order.items.reduce((a,b)=>a+(b.quantity*b.menuItem.price),0).toFixed(2)}€</div>
                                </div>
                             </div>
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
                            {mapEditMode && <button onClick={() => {const newId = Date.now().toString(); setLocalTables([...localTables, { id: newId, label: '?', x: 100, y: 100, type: 'ROUND' }]);}} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold"><Plus size={16}/></button>}
                            <button onClick={() => setShowOrderModal(true)} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg shadow-red-900/20 transition-all transform active:scale-95 font-medium text-sm">
                                <Icon name="add" className="text-lg"/>
                                Nouvelle Commande
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative overflow-auto p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px]">
                        {localTables.map(table => {
                            const { status, order } = getTableStatus(table.label);
                            const isOccupied = status === 'OCCUPIED';
                            const isRect = table.type === 'RECT';
                            
                            return (
                              <div
                                  key={table.id}
                                  onMouseDown={(e) => handleDragStart(e, table.id)}
                                  onClick={() => !mapEditMode && setSelectedTableId(table.id)}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleTableDrop(e, table.label)}
                                  style={{ 
                                      left: table.x, 
                                      top: table.y,
                                      width: isRect ? 140 : 96,
                                      height: 96,
                                      cursor: mapEditMode ? 'move' : 'pointer',
                                      position: 'absolute'
                                  }}
                                  className={`flex flex-col items-center justify-center group transition-all duration-300 ${mapEditMode ? 'z-50' : 'z-10'}`}
                              >
                                 <div className={`
                                      relative flex items-center justify-center transition-colors shadow-sm
                                      ${isRect ? 'w-full h-24 rounded-lg' : 'w-24 h-24 rounded-full'}
                                      ${isOccupied 
                                          ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' 
                                          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary'}
                                  `}>
                                       {isRect ? (
                                          <>
                                            <div className={`absolute -left-2 top-2 bottom-2 w-2 rounded-l transition-colors ${isOccupied ? 'bg-red-200 dark:bg-red-800' : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-primary/30'}`}></div>
                                            <div className={`absolute -right-2 top-2 bottom-2 w-2 rounded-r transition-colors ${isOccupied ? 'bg-red-200 dark:bg-red-800' : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-primary/30'}`}></div>
                                          </>
                                      ) : (
                                          <>
                                            <div className={`absolute -top-3 w-8 h-2 rounded-full transition-colors ${isOccupied ? 'bg-red-200 dark:bg-red-800' : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-primary/30'}`}></div>
                                            <div className={`absolute -bottom-3 w-8 h-2 rounded-full transition-colors ${isOccupied ? 'bg-red-200 dark:bg-red-800' : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-primary/30'}`}></div>
                                          </>
                                      )}
                                      
                                      {order && order.status === OrderStatus.PENDING && (
                                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-[10px] font-bold z-20 animate-pulse">!</div>
                                      )}

                                      {mapEditMode ? (
                                        <input 
                                            value={table.label} 
                                            onChange={(e) => setLocalTables(localTables.map(t => t.id === table.id ? { ...t, label: e.target.value } : t))}
                                            className="w-10 text-center bg-transparent font-bold text-xl outline-none"
                                            onClick={e => e.stopPropagation()}
                                        />
                                      ) : (
                                        <span className={`font-display text-2xl font-bold transition-colors ${isOccupied ? 'text-red-800 dark:text-red-200' : 'text-gray-400 group-hover:text-primary'}`}>
                                            {table.label}
                                        </span>
                                      )}
                                  </div>
                                  <span className={`mt-3 text-sm font-bold px-2 py-0.5 rounded backdrop-blur-sm transition-colors ${isOccupied ? 'text-red-600 dark:text-red-400 bg-white/80 dark:bg-black/50' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                                      {isOccupied ? 'Occupé' : 'Libre'}
                                  </span>
                                  
                                   {mapEditMode && (
                                      <div className="absolute -top-2 -right-2 flex gap-1 z-50">
                                        <button onClick={(e) => {e.stopPropagation(); setLocalTables(localTables.map(t => t.id === table.id ? {...t, type: t.type === 'RECT' ? 'ROUND' : 'RECT'} : t))}} className="bg-blue-500 text-white p-1 rounded-full shadow-sm text-xs"><Icon name="sync_alt" className="text-xs font-bold"/></button>
                                        <button onClick={(e) => {e.stopPropagation(); setLocalTables(localTables.filter(t => t.id !== table.id))}} className="bg-red-500 text-white p-1 rounded-full shadow-sm text-xs"><Trash size={12}/></button>
                                      </div>
                                  )}
                              </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        ) : (
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#121212] p-6">
                <OrdersListView />
            </div>
        )}
        
        <NewOrderModal />
        <TableDetailModal />
    </div>
  );
};

export default WaiterView;