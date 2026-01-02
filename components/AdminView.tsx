import React, { useState } from 'react';
import { MenuItem, Category } from '../types';
import { generateMenuDescription } from '../services/geminiService';
import { Sparkles, Save, Plus } from 'lucide-react';

interface AdminViewProps {
  menu: MenuItem[];
  onUpdateMenu: (menu: MenuItem[]) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ menu, onUpdateMenu }) => {
  const [items, setItems] = useState<MenuItem[]>(menu);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDescriptionGen = async (id: string, nameFR: string, nameCN: string) => {
    setLoadingId(id);
    const desc = await generateMenuDescription(nameFR, nameCN);
    setItems(prev => prev.map(item => item.id === id ? { ...item, descriptionFR: desc } : item));
    setLoadingId(null);
  };

  const handleChange = (id: string, field: keyof MenuItem, value: string | number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = () => {
    onUpdateMenu(items);
    alert("Menu updated!");
  };

  const addNew = () => {
      const newItem: MenuItem = {
          id: Date.now().toString(),
          code: 'N00',
          nameFR: 'Nouveau Plat',
          nameCN: '新菜',
          descriptionFR: '',
          price: 0,
          category: Category.MAIN,
          image: 'https://picsum.photos/200/200'
      };
      setItems([...items, newItem]);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestion du Menu</h1>
        <div className="flex gap-4">
            <button onClick={addNew} className="flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded hover:bg-zinc-50">
                <Plus size={20}/> Ajouter
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                <Save size={20}/> Enregistrer
            </button>
        </div>
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="border p-6 rounded-xl shadow-sm bg-gray-50 grid grid-cols-12 gap-4 items-start">
            
            {/* Image Preview */}
            <div className="col-span-2">
                <img src={item.image} className="w-full h-24 object-cover rounded bg-gray-200" alt="preview"/>
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
                        value={item.category}
                        onChange={(e) => handleChange(item.id, 'category', e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
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
                        value={item.nameCN}
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
                        value={item.descriptionFR}
                        onChange={(e) => handleChange(item.id, 'descriptionFR', e.target.value)}
                        className="w-full p-2 border rounded text-sm h-20 text-gray-600"
                    />
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Prix (€)</label>
                    <input 
                        type="number"
                        value={item.price}
                        onChange={(e) => handleChange(item.id, 'price', parseFloat(e.target.value))}
                        className="w-full p-2 border rounded font-mono"
                    />
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminView;
