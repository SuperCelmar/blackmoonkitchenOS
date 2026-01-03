import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem } from '../types';
import { Category } from '../services/supabaseClient';
import { generateMenuDescription } from '../services/geminiService';
import { Sparkles, Save, Plus } from 'lucide-react';

interface AdminViewProps {
  menu: MenuItem[];
  categories: Category[];
  onUpdateMenu: (menu: MenuItem[]) => Promise<void>;
}

const AdminView: React.FC<AdminViewProps> = ({ menu, categories, onUpdateMenu }) => {
  const [items, setItems] = useState<MenuItem[]>(menu);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Update items when menu prop changes
  useEffect(() => {
    setItems(menu);
  }, [menu]);

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
          <h1 className="text-3xl font-bold text-gray-800">Gestion du Menu</h1>
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 pt-4 max-w-6xl mx-auto w-full">
          {groupedItems.map(([categorySlug, categoryItems]) => (
            <div key={categorySlug} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-300">
                {getCategoryName(categorySlug)}
              </h2>
              <div className="space-y-6">
                {categoryItems.map((item) => (
                  <div key={item.id} className="border p-6 rounded-xl shadow-sm bg-gray-50 grid grid-cols-12 gap-4 items-start">
                    
                    {/* Image Preview */}
                    <div className="col-span-2">
                        {item.image ? (
                            <img src={item.image} className="w-full h-24 object-cover rounded bg-gray-200" alt="preview"/>
                        ) : (
                            <div className="w-full h-24 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No image</div>
                        )}
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
      </div>
    </div>
  );
};

export default AdminView;
