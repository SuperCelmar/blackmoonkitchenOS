import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order } from '../types';
import { Category } from '../services/supabaseClient';
import { generateMenuDescription } from '../services/geminiService';
import { uploadMenuImage, fetchTodayRevenue, fetchAllPaidOrders } from '../services/menuService';
import { Sparkles, Save, Plus, Upload, Euro, Clock } from 'lucide-react';

interface AdminViewProps {
  menu: MenuItem[];
  categories: Category[];
  onUpdateMenu: (menu: MenuItem[]) => Promise<void>;
}

type AdminTab = 'menu' | 'revenue';

const AdminView: React.FC<AdminViewProps> = ({ menu, categories, onUpdateMenu }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('menu');
  const [items, setItems] = useState<MenuItem[]>(menu);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [todayRevenue, setTodayRevenue] = useState<{ total: number; orders: Order[] }>({ total: 0, orders: [] });
  const [allTimeRevenue, setAllTimeRevenue] = useState<{ total: number; orders: Order[] }>({ total: 0, orders: [] });
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingAllTime, setLoadingAllTime] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [allTimeError, setAllTimeError] = useState<string | null>(null);

  // Update items when menu prop changes
  useEffect(() => {
    setItems(menu);
  }, [menu]);

  // Load today's revenue and all-time revenue when revenue tab is active
  useEffect(() => {
    if (activeTab === 'revenue') {
      loadTodayRevenue();
      loadAllTimeRevenue();
    }
  }, [activeTab]);

  const loadTodayRevenue = async () => {
    setLoadingRevenue(true);
    setRevenueError(null);
    try {
      const revenue = await fetchTodayRevenue();
      setTodayRevenue(revenue);
    } catch (error: any) {
      console.error('Error loading revenue:', error);
      const errorMessage = error?.message || 'Erreur inconnue lors du chargement des ventes';
      setRevenueError(errorMessage);
      // Set empty state on error
      setTodayRevenue({ total: 0, orders: [] });
    } finally {
      setLoadingRevenue(false);
    }
  };

  const loadAllTimeRevenue = async () => {
    setLoadingAllTime(true);
    setAllTimeError(null);
    try {
      const revenue = await fetchAllPaidOrders();
      setAllTimeRevenue(revenue);
    } catch (error: any) {
      console.error('Error loading all-time revenue:', error);
      const errorMessage = error?.message || 'Erreur inconnue lors du chargement des ventes totales';
      setAllTimeError(errorMessage);
      // Set empty state on error
      setAllTimeRevenue({ total: 0, orders: [] });
    } finally {
      setLoadingAllTime(false);
    }
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    const grouped = new Map<string, MenuItem[]>();
    
    // Add items with categories
    items.forEach(item => {
      const categorySlug = item.category || 'uncategorized';
      if (!grouped.has(categorySlug)) {
        grouped.set(categorySlug, []);
      }
      grouped.get(categorySlug)!.push(item);
    });

    // Sort categories by display_order
    const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);
    
    // Create array of [categorySlug, items] pairs, sorted by category display_order
    const result: Array<[string, MenuItem[]]> = [];
    
    // Add categorized items in order
    sortedCategories.forEach(cat => {
      if (grouped.has(cat.slug)) {
        result.push([cat.slug, grouped.get(cat.slug)!]);
        grouped.delete(cat.slug);
      }
    });
    
    // Add any remaining uncategorized items
    grouped.forEach((items, slug) => {
      result.push([slug, items]);
    });

    return result;
  }, [items, categories]);

  const handleDescriptionGen = async (id: string, nameFR: string, nameCN: string | null) => {
    setLoadingId(id);
    const desc = await generateMenuDescription(nameFR, nameCN || '');
    setItems(prev => prev.map(item => item.id === id ? { ...item, descriptionFR: desc } : item));
    setLoadingId(null);
  };

  const handleChange = (id: string, field: keyof MenuItem, value: string | number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateMenu(items);
    } catch (error) {
      console.error('Error saving menu:', error);
    } finally {
      setSaving(false);
    }
  };

  const addNew = () => {
      // Default to first category if available, otherwise null
      const defaultCategory = categories.length > 0 ? categories[0].slug : null;
      const newItem: MenuItem = {
          id: Date.now().toString(),
          code: 'N00',
          nameFR: 'Nouveau Plat',
          nameCN: '新菜',
          descriptionFR: '',
          price: 0,
          category: defaultCategory,
          image: null,
          isPopular: false,
          isAvailable: true,
      };
      setItems([...items, newItem]);
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    setUploadingImageId(itemId);
    try {
      const imageUrl = await uploadMenuImage(file, itemId);
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, image: imageUrl } : item));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors du téléchargement de l\'image. Veuillez réessayer.');
    } finally {
      setUploadingImageId(null);
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getPaymentMethodLabel = (method: string | null | undefined): string => {
    const labels: Record<string, string> = {
      'CARD': 'Carte',
      'TICKET_CARD': 'Ticket Restaurant',
      'CASH': 'Espèces',
      'PAPER_TICKET': 'Ticket Papier'
    };
    return method ? labels[method] || method : 'Non spécifié';
  };

  // Get category name by slug
  const getCategoryName = (slug: string | null): string => {
    if (!slug) return 'Non catégorisé';
    const category = categories.find(cat => cat.slug === slug);
    return category ? category.name_fr : slug;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-shrink-0 p-8 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Administration</h1>
          {activeTab === 'menu' && (
            <div className="flex gap-4">
                <button 
                  onClick={addNew} 
                  className="flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded hover:bg-zinc-50"
                >
                    <Plus size={20}/> Ajouter
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={20}/> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-300 mb-6">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-3 font-semibold text-lg transition-colors ${
              activeTab === 'menu'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Carte
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-6 py-3 font-semibold text-lg transition-colors ${
              activeTab === 'revenue'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chiffre d'Affaires
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'menu' && (
          <div className="p-8 pt-4 max-w-6xl mx-auto w-full">
            {groupedItems.map(([categorySlug, categoryItems]) => (
              <div key={categorySlug} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-300">
                  {getCategoryName(categorySlug)}
                </h2>
                <div className="space-y-6">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="border p-6 rounded-xl shadow-sm bg-gray-50 grid grid-cols-12 gap-4 items-start">
                      
                      {/* Image Preview with Upload */}
                      <div className="col-span-2">
                          <label className="cursor-pointer block">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(item.id, file);
                                }
                              }}
                              disabled={uploadingImageId === item.id}
                            />
                            {item.image ? (
                              <div className="relative group">
                                <img src={item.image} className="w-full h-24 object-cover rounded bg-gray-200" alt="preview"/>
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded flex items-center justify-center transition-all">
                                  <Upload size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-24 rounded bg-gray-200 flex flex-col items-center justify-center text-gray-400 text-xs hover:bg-gray-300 transition-colors">
                                {uploadingImageId === item.id ? (
                                  <span className="text-xs">Téléchargement...</span>
                                ) : (
                                  <>
                                    <Upload size={20} className="mb-1"/>
                                    <span>Cliquer pour ajouter</span>
                                  </>
                                )}
                              </div>
                            )}
                          </label>
                      </div>

                    {/* Fields */}
                    <div className="col-span-10 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Code</label>
                            <input 
                                value={item.code}
                                onChange={(e) => handleChange(item.id, 'code', e.target.value)}
                                className="w-full p-2 border rounded font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Category</label>
                            <select 
                                value={item.category || ''}
                                onChange={(e) => handleChange(item.id, 'category', e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Non catégorisé</option>
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.slug}>
                                    {cat.name_fr}
                                  </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Nom (FR)</label>
                            <input 
                                value={item.nameFR}
                                onChange={(e) => handleChange(item.id, 'nameFR', e.target.value)}
                                className="w-full p-2 border rounded font-semibold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Nom (CN)</label>
                            <input 
                                value={item.nameCN || ''}
                                onChange={(e) => handleChange(item.id, 'nameCN', e.target.value)}
                                className="w-full p-2 border rounded font-semibold"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase flex justify-between">
                                <span>Description (FR)</span>
                                <button 
                                    onClick={() => handleDescriptionGen(item.id, item.nameFR, item.nameCN)}
                                    disabled={loadingId === item.id}
                                    className="text-purple-600 text-xs flex items-center gap-1 hover:underline disabled:opacity-50"
                                >
                                    <Sparkles size={12}/> {loadingId === item.id ? 'Génération...' : 'Générer avec IA'}
                                </button>
                            </label>
                            <textarea 
                                value={item.descriptionFR || ''}
                                onChange={(e) => handleChange(item.id, 'descriptionFR', e.target.value)}
                                className="w-full p-2 border rounded text-sm h-20 text-gray-600"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Prix (€)</label>
                            <input 
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => handleChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border rounded font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Disponible</label>
                            <select
                                value={item.isAvailable ? 'true' : 'false'}
                                onChange={(e) => handleChange(item.id, 'isAvailable', e.target.value === 'true')}
                                className="w-full p-2 border rounded"
                            >
                                <option value="true">Oui</option>
                                <option value="false">Non</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Populaire</label>
                            <select
                                value={item.isPopular ? 'true' : 'false'}
                                onChange={(e) => handleChange(item.id, 'isPopular', e.target.value === 'true')}
                                className="w-full p-2 border rounded"
                            >
                                <option value="true">Oui</option>
                                <option value="false">Non</option>
                            </select>
                        </div>
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="p-8 pt-4 max-w-6xl mx-auto w-full">
            {loadingRevenue ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-gray-500">Chargement...</div>
              </div>
            ) : revenueError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="text-red-800 font-semibold mb-2">Erreur</div>
                <div className="text-red-600">{revenueError}</div>
                <button
                  onClick={loadTodayRevenue}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <>
                {/* Today's Total */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 mb-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="bg-white bg-opacity-20 rounded-full p-4">
                      <Euro size={32} className="text-white"/>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium opacity-90">Total d'aujourd'hui</div>
                      <div className="text-white text-4xl font-bold">{todayRevenue.total.toFixed(2)} €</div>
                      <div className="text-white text-xs opacity-75 mt-1">{todayRevenue.orders.length} commande{todayRevenue.orders.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>

                {/* All-Time Aggregation */}
                {loadingAllTime ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                    <div className="text-center text-gray-500">Chargement des statistiques totales...</div>
                  </div>
                ) : allTimeError ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                    <div className="text-red-800 font-semibold mb-2">Erreur</div>
                    <div className="text-red-600 text-sm">{allTimeError}</div>
                    <button
                      onClick={loadAllTimeRevenue}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-8 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white bg-opacity-20 rounded-full p-3">
                          <Euro size={24} className="text-white"/>
                        </div>
                        <div>
                          <div className="text-white text-xs font-medium opacity-90 uppercase tracking-wider">Total Toutes Périodes</div>
                          <div className="text-white text-3xl font-bold">{allTimeRevenue.total.toFixed(2)} €</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
                      <div className="text-center">
                        <div className="text-white text-xs opacity-75 mb-1">Total Commandes</div>
                        <div className="text-white text-xl font-bold">{allTimeRevenue.orders.length}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white text-xs opacity-75 mb-1">Panier Moyen</div>
                        <div className="text-white text-xl font-bold">
                          {allTimeRevenue.orders.length > 0 
                            ? (allTimeRevenue.total / allTimeRevenue.orders.length).toFixed(2) 
                            : '0.00'} €
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-white text-xs opacity-75 mb-1">Dernière Commande</div>
                        <div className="text-white text-sm font-semibold">
                          {allTimeRevenue.orders.length > 0 
                            ? formatDate(allTimeRevenue.orders[0].createdAt)
                            : 'Aucune'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order History */}
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">Historique des commandes d'aujourd'hui</h2>
                  <div className="text-sm text-gray-500 mt-1">{todayRevenue.orders.length} commande{todayRevenue.orders.length !== 1 ? 's' : ''} payée{todayRevenue.orders.length !== 1 ? 's' : ''}</div>
                </div>

                {todayRevenue.orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Aucune commande payée aujourd'hui
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayRevenue.orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <Clock size={16} className="text-gray-400"/>
                            <span className="font-semibold text-gray-700">{formatTime(order.createdAt)}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">
                              {order.tableNumber || (order.type === 'TAKEAWAY' ? 'À emporter' : 'Table non assignée')}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-800">{(order.totalAmount || 0).toFixed(2)} €</div>
                            <div className="text-sm text-gray-500">{getPaymentMethodLabel(order.paymentMethod)}</div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="text-sm text-gray-600">
                            {order.items.map((item, idx) => (
                              <span key={idx}>
                                {item.quantity}x {item.menuItem.nameFR}
                                {idx < order.items.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
