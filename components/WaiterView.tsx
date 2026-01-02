import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderType, PaymentMethod, Table, MenuItem, OrderItem } from '../types';
import { CheckCircle, Clock, XCircle, List, Plus, Map, Move, Save, Trash, Search, GripVertical, ChevronRight, User, X } from 'lucide-react';

interface WaiterViewProps {
  orders: Order[];
  menu: MenuItem[];
  tables: Table[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateTables: (tables: Table[]) => void;
  onCreateOrder: (items: OrderItem[], paymentMethod: PaymentMethod, type: OrderType, tableNum: string) => void;
  onAssignTable: (orderId: string, tableLabel: string) => void;
}

const WaiterView: React.FC<WaiterViewProps> = ({ orders, menu, tables, onUpdateStatus, onUpdateTables, onCreateOrder, onAssignTable }) => {
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');
  const [mapEditMode, setMapEditMode] = useState(false);
  const [localTables, setLocalTables] = useState<Table[]>(tables);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // Drag State
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  
  // New Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrderType, setNewOrderType] = useState<OrderType>(OrderType.DINE_IN);
  const [newOrderCart, setNewOrderCart] = useState<OrderItem[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  
  // Filters
  const [listFilter, setListFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY'>('ALL');

  useEffect(() => {
      setLocalTables(tables);
  }, [tables]);

  // --- MAP LOGIC ---
  const handleDragStart = (e: React.MouseEvent, id: string) => {
    if (!mapEditMode) return;
    e.preventDefault(); // Prevent default to ensure fluid drag without text selection
    
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
      // Find order that is NOT paid and matches table
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
      // Always assign to queue ('?') for Dine In manually created orders
      const tableAssignment = newOrderType === OrderType.DINE_IN ? '?' : 'Takeaway';
      onCreateOrder(newOrderCart, PaymentMethod.CASH, newOrderType, tableAssignment);
      setShowOrderModal(false);
      setNewOrderCart([]);
      setMenuSearch('');
  };

  // --- RENDER HELPERS ---
  const renderNewOrderModal = () => {
      if (!showOrderModal) return null;
      const total = newOrderCart.reduce((acc, i) => acc + (i.menuItem.price * i.quantity), 0);
      
      const filteredMenu = menu.filter(item => 
          item.nameFR.toLowerCase().includes(menuSearch.toLowerCase()) || 
          item.code.toLowerCase().includes(menuSearch.toLowerCase())
      );

      return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ring-1 ring-zinc-200">
                  {/* Modal Header */}
                  <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
                      <div>
                        <h2 className="font-bold text-xl text-zinc-800">Nouvelle Commande</h2>
                        <p className="text-xs text-zinc-500">Créer une commande manuelle</p>
                      </div>
                      <button 
                        onClick={() => setShowOrderModal(false)}
                        className="p-2 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition"
                      >
                          <XCircle size={24} />
                      </button>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                      {/* Left: Menu Selection */}
                      <div className="w-2/3 flex flex-col border-r border-zinc-200 bg-gray-50">
                          
                          {/* Top Controls */}
                          <div className="p-4 space-y-4 border-b border-zinc-200 bg-white">
                                {/* Type Toggle */}
                                <div className="flex bg-zinc-100 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setNewOrderType(OrderType.DINE_IN)} 
                                        className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
                                            newOrderType === OrderType.DINE_IN 
                                            ? 'bg-white text-orange-600 shadow-sm' 
                                            : 'text-zinc-500 hover:text-zinc-800'
                                        }`}
                                    >
                                        Sur Place
                                    </button>
                                    <button 
                                        onClick={() => setNewOrderType(OrderType.TAKEAWAY)} 
                                        className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
                                            newOrderType === OrderType.TAKEAWAY 
                                            ? 'bg-white text-blue-600 shadow-sm' 
                                            : 'text-zinc-500 hover:text-zinc-800'
                                        }`}
                                    >
                                        A Emporter
                                    </button>
                                </div>

                                <div className="flex gap-4">
                                    {/* Search */}
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-3 text-zinc-400" size={18} />
                                        <input 
                                            type="text" 
                                            value={menuSearch} 
                                            onChange={e => setMenuSearch(e.target.value)} 
                                            className="w-full pl-10 p-2.5 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 outline-none placeholder:text-zinc-400"
                                            placeholder="Rechercher un plat (nom ou code)..."
                                        />
                                    </div>
                                </div>
                          </div>

                          {/* Menu Grid */}
                          <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredMenu.map(item => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => handleAddItem(item)} 
                                        className="bg-white p-3 rounded-xl shadow-sm border border-zinc-100 hover:border-orange-500 hover:shadow-md transition-all group text-left flex flex-col justify-between h-full"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-zinc-800 group-hover:text-orange-600 line-clamp-1">{item.nameFR}</span>
                                                <span className="text-xs font-mono bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">{item.code}</span>
                                            </div>
                                            <div className="text-xs text-zinc-500 line-clamp-2 mb-2">{item.nameCN}</div>
                                        </div>
                                        <div className="font-bold text-orange-600">{item.price.toFixed(2)}€</div>
                                    </button>
                                ))}
                            </div>
                          </div>
                      </div>

                      {/* Right: Cart Summary */}
                      <div className="w-1/3 flex flex-col bg-white border-l border-zinc-200">
                          <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                            <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                                <List size={18}/> Panier ({newOrderCart.reduce((a, b) => a + b.quantity, 0)})
                            </h3>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-4 space-y-3">
                              {newOrderCart.map(item => (
                                  <div key={item.menuItem.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                      <div className="flex-1">
                                        <div className="font-medium text-zinc-800">{item.menuItem.nameFR}</div>
                                        <div className="text-xs text-zinc-500">{item.quantity} x {item.menuItem.price}€</div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <span className="font-bold text-zinc-900">{(item.menuItem.price * item.quantity).toFixed(2)}€</span>
                                          <button onClick={() => removeFromNewOrder(item.menuItem.id)} className="text-red-400 hover:text-red-600 p-1">
                                              <Trash size={16} />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              {newOrderCart.length === 0 && (
                                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50">
                                      <List size={48} className="mb-2" />
                                      <p>Le panier est vide</p>
                                  </div>
                              )}
                          </div>

                          <div className="p-4 border-t border-zinc-200 bg-zinc-50">
                              <div className="flex justify-between items-end mb-4">
                                  <span className="text-zinc-500">Total à payer</span>
                                  <span className="text-3xl font-bold text-zinc-900">{total.toFixed(2)}€</span>
                              </div>
                              <button 
                                onClick={submitNewOrder} 
                                disabled={newOrderCart.length === 0}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold text-lg disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed shadow-lg transition-all flex justify-center items-center gap-2"
                              >
                                  <CheckCircle size={20} /> Valider la commande
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const TableDetailPanel = () => {
      const selectedTable = localTables.find(t => t.id === selectedTableId);
      if (!selectedTable) return null;
      
      const { status, order } = getTableStatus(selectedTable.label);
      
      return (
          <div className="absolute top-0 right-0 h-full w-[400px] bg-white shadow-2xl border-l border-zinc-200 z-30 transform transition-transform duration-300 flex flex-col">
              <div className="p-6 bg-zinc-900 text-white flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold">Table {selectedTable.label}</h2>
                    <p className={`font-mono text-sm mt-1 uppercase font-bold tracking-wider ${status === 'OCCUPIED' ? 'text-red-400' : 'text-green-400'}`}>
                        {status === 'OCCUPIED' ? 'Occupé' : 'Libre'}
                    </p>
                  </div>
                  <button onClick={() => setSelectedTableId(null)} className="text-zinc-400 hover:text-white transition">
                      <X size={24} />
                  </button>
              </div>

              {order ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                          <div className="flex items-center gap-2 text-sm text-zinc-600">
                              <Clock size={16}/> 
                              Arrivé à {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-bold ${
                              order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 
                              order.status === OrderStatus.VALIDATED ? 'bg-blue-100 text-blue-700' :
                              order.status === OrderStatus.READY ? 'bg-green-100 text-green-700' : ''
                          }`}>
                              {order.status}
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start">
                                  <div className="flex gap-3">
                                      <div className="bg-orange-100 text-orange-800 w-6 h-6 flex items-center justify-center rounded text-sm font-bold mt-0.5">
                                          {item.quantity}
                                      </div>
                                      <div>
                                          <p className="font-medium text-zinc-800">{item.menuItem.nameFR}</p>
                                          <p className="text-xs text-zinc-400">{item.menuItem.price}€</p>
                                      </div>
                                  </div>
                                  <span className="font-bold text-zinc-800">{(item.menuItem.price * item.quantity).toFixed(2)}€</span>
                              </div>
                          ))}
                      </div>

                      <div className="p-4 border-t border-zinc-200 bg-zinc-50 space-y-3">
                          <div className="flex justify-between items-end text-xl font-bold text-zinc-900 mb-2">
                              <span>Total</span>
                              <span>{order.items.reduce((acc, i) => acc + (i.quantity * i.menuItem.price), 0).toFixed(2)}€</span>
                          </div>
                          
                          {order.status === OrderStatus.PENDING && (
                              <button 
                                onClick={() => onUpdateStatus(order.id, OrderStatus.VALIDATED)}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm transition"
                              >
                                  Valider la commande
                              </button>
                          )}
                          
                          {order.status !== OrderStatus.PENDING && (
                              <button 
                                onClick={() => {onUpdateStatus(order.id, OrderStatus.PAID); setSelectedTableId(null);}}
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg font-bold shadow-sm transition flex items-center justify-center gap-2"
                              >
                                  <CheckCircle size={18}/> Encaisser et Libérer
                              </button>
                          )}
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
                      <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                      </div>
                      <p>Cette table est libre.</p>
                      <p className="text-sm mt-2">Glissez une commande depuis la liste d'attente pour l'assigner ici.</p>
                  </div>
              )}
          </div>
      );
  };

  const renderMapView = () => {
      // Filter orders that are unassigned ('?') or just PENDING (waiting to be seated)
      const unassignedOrders = orders.filter(o => 
          (o.tableNumber === '?' || o.tableNumber === '') && o.status !== OrderStatus.PAID && o.type === OrderType.DINE_IN
      );

      return (
      <div className="flex h-full relative overflow-hidden">
          {/* Pending Orders Sidebar */}
          <div className="w-80 bg-white border-r border-zinc-200 flex flex-col z-10 shadow-lg">
             <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                 <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                    <User size={18}/> En attente ({unassignedOrders.length})
                 </h3>
                 <p className="text-xs text-zinc-500 mt-1">Glissez vers une table</p>
             </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-50/50">
                 {unassignedOrders.map(order => (
                     <div 
                        key={order.id}
                        draggable
                        onDragStart={(e) => handleOrderDragStart(e, order.id)}
                        className={`bg-white p-3 rounded-xl border-2 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${draggedOrderId === order.id ? 'border-orange-400 opacity-50' : 'border-zinc-200 hover:border-orange-300'}`}
                     >
                         <div className="flex justify-between items-start mb-2">
                             <span className="font-mono text-xs text-zinc-400">#{order.id.slice(-4)}</span>
                             <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">À PLACER</span>
                         </div>
                         <div className="font-bold text-zinc-800 mb-1">
                             {order.items.reduce((acc, i) => acc + i.quantity, 0)} articles
                         </div>
                         <div className="text-xs text-zinc-500 line-clamp-2">
                             {order.items.map(i => i.menuItem.nameFR).join(', ')}
                         </div>
                         <div className="mt-2 pt-2 border-t border-zinc-100 flex justify-between items-center text-xs text-zinc-400">
                             <div className="flex items-center gap-1">
                                <Clock size={12}/> {Math.floor((Date.now() - order.createdAt)/60000)} min
                             </div>
                             <GripVertical size={14} className="text-zinc-300 group-hover:text-orange-400"/>
                         </div>
                     </div>
                 ))}
                 {unassignedOrders.length === 0 && (
                     <div className="text-center p-8 text-zinc-400 text-sm italic">
                         Aucune commande en attente de placement.
                     </div>
                 )}
             </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative bg-zinc-100 overflow-hidden select-none" 
               style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              
              {/* Map Controls */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="bg-white shadow-lg rounded-lg p-2 flex gap-2 border border-zinc-200">
                    <button onClick={() => mapEditMode ? saveLayout() : setMapEditMode(true)} 
                        className={`p-2 rounded-md transition-all ${mapEditMode ? 'bg-green-100 text-green-700' : 'hover:bg-zinc-100 text-zinc-700'}`}
                        title={mapEditMode ? "Sauvegarder" : "Modifier le plan"}
                    >
                        {mapEditMode ? <Save size={20}/> : <Move size={20}/>}
                    </button>
                    {mapEditMode && (
                        <button onClick={() => {
                            const newId = Date.now().toString();
                            setLocalTables([...localTables, { id: newId, label: '?', x: 100, y: 100, type: 'RECT' }]);
                        }} className="p-2 rounded-md hover:bg-zinc-100 bg-blue-50 text-blue-600">
                            <Plus size={20}/>
                        </button>
                    )}
                </div>
              </div>

              {/* Tables */}
              {localTables.map(table => {
                  const { status, order } = getTableStatus(table.label);
                  const isOccupied = status === 'OCCUPIED';
                  const isSelected = selectedTableId === table.id;
                  
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
                              width: 140,
                              height: 80,
                              borderRadius: '8px',
                              cursor: mapEditMode ? 'move' : 'pointer',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                          }}
                          className={`absolute flex flex-col items-center justify-center transition-transform transition-colors duration-200 border-2 ${
                              mapEditMode 
                                 ? 'border-blue-400 bg-white border-dashed text-zinc-800' 
                                 : isSelected
                                    ? 'ring-4 ring-orange-400 border-orange-600 z-20 scale-105'
                                    : isOccupied 
                                        ? 'bg-white border-red-500 shadow-red-200' 
                                        : 'bg-white border-zinc-200 hover:border-orange-300 hover:scale-105'
                          }`}
                      >
                          {mapEditMode ? (
                              <input 
                                value={table.label} 
                                onChange={(e) => {
                                    const newTables = localTables.map(t => t.id === table.id ? { ...t, label: e.target.value } : t);
                                    setLocalTables(newTables);
                                }}
                                className="w-16 text-center text-lg font-bold bg-transparent outline-none text-inherit"
                                autoFocus
                              />
                          ) : (
                              <>
                                <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-[6px] ${isOccupied ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <span className="font-bold text-3xl tracking-tight text-zinc-800">{table.label}</span>
                                
                                {isOccupied ? (
                                    <div className="mt-1 flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Occupé</span>
                                        <span className="text-xs text-zinc-500 font-mono flex items-center gap-0.5">
                                            <Clock size={10} /> {order ? Math.floor((Date.now() - order.createdAt)/60000) : 0}m
                                        </span>
                                    </div>
                                ) : (
                                    <span className="mt-1 text-[10px] font-bold text-green-600 uppercase tracking-wider">Libre</span>
                                )}
                              </>
                          )}
                          {mapEditMode && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setLocalTables(localTables.filter(t => t.id !== table.id)) }}
                                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md transform hover:scale-110 transition"
                              >
                                 <Trash size={12}/>
                              </button>
                          )}
                      </div>
                  );
              })}
          </div>

          <TableDetailPanel />
      </div>
  )};

  const renderListView = () => {
      const filteredOrders = orders.filter(o => {
          if (listFilter === 'DINE_IN') return o.type === OrderType.DINE_IN;
          if (listFilter === 'TAKEAWAY') return o.type === OrderType.TAKEAWAY;
          return true;
      }).sort((a, b) => b.createdAt - a.createdAt);

      return (
          <div className="p-4 bg-gray-50 h-full overflow-y-auto w-full">
              <div className="flex gap-2 mb-4">
                  <button onClick={() => setListFilter('ALL')} className={`px-4 py-2 rounded-full text-sm font-bold transition ${listFilter === 'ALL' ? 'bg-zinc-800 text-white' : 'bg-white border text-zinc-700'}`}>Tous</button>
                  <button onClick={() => setListFilter('DINE_IN')} className={`px-4 py-2 rounded-full text-sm font-bold transition ${listFilter === 'DINE_IN' ? 'bg-orange-500 text-white' : 'bg-white border text-zinc-700'}`}>Sur Place</button>
                  <button onClick={() => setListFilter('TAKEAWAY')} className={`px-4 py-2 rounded-full text-sm font-bold transition ${listFilter === 'TAKEAWAY' ? 'bg-blue-500 text-white' : 'bg-white border text-zinc-700'}`}>A Emporter</button>
              </div>

              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                 {filteredOrders.map(order => (
                     <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 flex flex-col justify-between hover:border-orange-200">
                         <div>
                             <div className="flex justify-between items-start mb-3">
                                 <div className="flex items-center gap-2">
                                     <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wide ${order.type === OrderType.DINE_IN ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                         {order.type === OrderType.DINE_IN ? 'Sur Place' : 'Emporter'}
                                     </span>
                                     <span className={`text-xs px-2 py-1 rounded-md font-bold ${
                                         order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                                         order.status === OrderStatus.VALIDATED ? 'bg-blue-100 text-blue-700' :
                                         order.status === OrderStatus.READY ? 'bg-green-100 text-green-700' :
                                         'bg-gray-100 text-gray-500'
                                     }`}>
                                         {order.status}
                                     </span>
                                 </div>
                                 <span className="font-mono text-zinc-400 text-xs">#{order.id.slice(-4)}</span>
                             </div>

                             <div className="mb-4">
                                <span className="font-bold text-2xl text-zinc-800 block mb-1">
                                     {order.type === OrderType.DINE_IN ? `Table ${order.tableNumber}` : `Client`}
                                </span>
                                <div className="text-sm text-zinc-500 flex items-center gap-1">
                                     <Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                     <span className="text-zinc-400 ml-1">• {Math.floor((Date.now() - order.createdAt)/60000)} min</span>
                                </div>
                             </div>

                             <div className="space-y-1 mb-4 bg-zinc-50 p-2 rounded-lg">
                                 {order.items.slice(0, 3).map((item, idx) => (
                                     <div key={idx} className="text-sm flex justify-between text-zinc-700">
                                        <span>{item.quantity}x {item.menuItem.nameFR}</span>
                                     </div>
                                 ))}
                                 {order.items.length > 3 && <div className="text-xs text-zinc-400 italic">+ {order.items.length - 3} autres...</div>}
                             </div>
                         </div>

                         <div className="grid grid-cols-2 gap-2 mt-2">
                             {order.status === OrderStatus.PENDING && (
                                 <button 
                                    onClick={() => onUpdateStatus(order.id, OrderStatus.VALIDATED)}
                                    className="col-span-2 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm active:scale-95 transition"
                                 >
                                     Valider
                                 </button>
                             )}
                             {order.status === OrderStatus.READY && (
                                 <button 
                                    onClick={() => onUpdateStatus(order.id, OrderStatus.PAID)}
                                    className="col-span-2 bg-zinc-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-zinc-900 shadow-sm active:scale-95 transition"
                                 >
                                     Encaisser
                                 </button>
                             )}
                             {order.status === OrderStatus.VALIDATED && (
                                 <div className="col-span-2 text-center text-xs text-zinc-400 font-medium py-2">En cuisine...</div>
                             )}
                         </div>
                     </div>
                 ))}
                 {filteredOrders.length === 0 && (
                     <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-400">
                         <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                            <List size={32} />
                         </div>
                         <p>Aucune commande trouvée</p>
                     </div>
                 )}
              </div>
          </div>
      );
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
        <div className="flex flex-col h-full w-full">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 px-4 py-3 flex justify-between items-center shadow-sm z-20 shrink-0">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setViewMode('MAP')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'MAP' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'text-zinc-600 hover:bg-zinc-50'}`}
                    >
                        <Map size={18} /> <span className="hidden sm:inline">Salle</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('LIST')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'LIST' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'text-zinc-600 hover:bg-zinc-50'}`}
                    >
                        <List size={18} /> <span className="hidden sm:inline">Commandes</span>
                    </button>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowOrderModal(true)}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-orange-500/30 active:scale-95 transition-all font-bold"
                    >
                        <Plus size={20} /> <span className="hidden sm:inline">Nouvelle Commande</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0 relative bg-zinc-100">
                {viewMode === 'MAP' ? renderMapView() : renderListView()}
            </div>

            {renderNewOrderModal()}
        </div>
    </div>
  );
};

export default WaiterView;