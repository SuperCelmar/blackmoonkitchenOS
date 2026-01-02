import React, { useState, useEffect } from 'react';
import { MenuItem, OrderItem, Category, PaymentMethod, OrderType } from '../types';
import { ShoppingCart, Check, CreditCard, Banknote, Ticket, Clock, Utensils, ShoppingBag } from 'lucide-react';

interface ClientViewProps {
  menu: MenuItem[];
  onSubmitOrder: (items: OrderItem[], paymentMethod: PaymentMethod, type: OrderType) => void;
}

const ClientView: React.FC<ClientViewProps> = ({ menu, onSubmitOrder }) => {
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [step, setStep] = useState<Category | 'CONFIRM' | 'PAYMENT' | 'STATUS'>(Category.STARTER);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [submittedTime, setSubmittedTime] = useState<number | null>(null);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
     setCart(prev => prev.filter(i => i.menuItem.id !== itemId));
  };

  const getItemsByCategory = (cat: Category) => menu.filter(m => m.category === cat);

  const totalAmount = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  const handleSubmit = () => {
      if (selectedPayment && orderType) {
          onSubmitOrder(cart, selectedPayment, orderType);
          setSubmittedTime(Date.now());
          setStep('STATUS');
      }
  };

  // Timer Component
  const OrderTimer = () => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if(!submittedTime) return;
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - submittedTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="text-center my-8">
            <div className="w-40 h-40 rounded-full border-4 border-orange-500 flex items-center justify-center mx-auto mb-4 bg-white shadow-lg animate-pulse">
                <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto text-orange-500 mb-1"/>
                    <span className="text-3xl font-bold text-zinc-800">{formatTime(elapsed)}</span>
                </div>
            </div>
            <p className="text-zinc-500">Temps écoulé depuis la commande</p>
        </div>
    );
  };

  // 1. Order Type Selection
  if (!orderType) {
      return (
          <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6 gap-6">
              <h1 className="text-white text-3xl font-bold mb-8">Bienvenue / Welcome</h1>
              <button 
                onClick={() => { setOrderType(OrderType.DINE_IN); setStep(Category.STARTER); }}
                className="w-full max-w-sm bg-orange-600 hover:bg-orange-500 text-white p-8 rounded-2xl flex flex-col items-center gap-4 transition-transform active:scale-95"
              >
                  <Utensils size={48} />
                  <span className="text-xl font-bold">Sur Place (Dine-in)</span>
              </button>
              <button 
                onClick={() => { setOrderType(OrderType.TAKEAWAY); setStep(Category.STARTER); }}
                className="w-full max-w-sm bg-zinc-800 hover:bg-zinc-700 text-white p-8 rounded-2xl flex flex-col items-center gap-4 transition-transform active:scale-95 border border-zinc-700"
              >
                  <ShoppingBag size={48} />
                  <span className="text-xl font-bold">A Emporter (Takeaway)</span>
              </button>
          </div>
      )
  }

  // 4. Status View
  if (step === 'STATUS') {
      return (
          <div className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center justify-center">
              <div className="bg-green-100 p-4 rounded-full text-green-600 mb-6">
                  <Check size={48} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-800 text-center mb-2">Commande Envoyée !</h2>
              <p className="text-zinc-500 text-center mb-8">La cuisine prépare vos plats.</p>
              
              <OrderTimer />

              <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-sm border border-zinc-200">
                  <h3 className="font-bold border-b pb-2 mb-4">Récapitulatif ({orderType === OrderType.DINE_IN ? 'Sur place' : 'A emporter'})</h3>
                  {cart.map((item, i) => (
                      <div key={i} className="flex justify-between py-1 text-sm">
                          <span>{item.quantity}x {item.menuItem.nameFR}</span>
                          <span className="font-medium">{(item.menuItem.price * item.quantity).toFixed(2)}€</span>
                      </div>
                  ))}
                  <div className="border-t mt-4 pt-4 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-orange-600">{totalAmount.toFixed(2)}€</span>
                  </div>
              </div>

              <button 
                onClick={() => { setOrderType(null); setCart([]); setSubmittedTime(null); setSelectedPayment(null); }}
                className="mt-12 text-zinc-400 text-sm underline hover:text-zinc-600"
              >
                  Nouvelle commande
              </button>
          </div>
      );
  }

  const renderMenuStep = (currentCat: Category, nextStep: Category | 'CONFIRM') => (
    <div className="pb-24">
      <div className="px-4 mt-6 flex justify-between items-end">
        <h2 className="text-2xl font-bold text-zinc-800">
            {currentCat === Category.STARTER && 'Entrées'}
            {currentCat === Category.MAIN && 'Plats'}
            {currentCat === Category.DESSERT && 'Desserts'}
        </h2>
        <span className="text-xs font-bold px-2 py-1 bg-zinc-100 rounded text-zinc-500">
            {orderType === OrderType.DINE_IN ? 'SUR PLACE' : 'A EMPORTER'}
        </span>
      </div>
      
      <div className="space-y-4 px-4 mt-4">
        {getItemsByCategory(currentCat).map(item => {
          const inCart = cart.find(i => i.menuItem.id === item.id);
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden flex">
              <img src={item.image} alt={item.nameFR} className="w-24 h-24 object-cover" />
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900">{item.nameFR}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2">{item.descriptionFR}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-orange-600">{item.price.toFixed(2)}€</span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium active:scale-95 transition"
                  >
                    {inCart ? `Ajouté (${inCart.quantity})` : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-zinc-200 shadow-lg">
        <button 
          onClick={() => setStep(nextStep)}
          className="w-full bg-zinc-900 text-white py-3 rounded-lg font-semibold text-lg flex justify-between px-6 items-center"
        >
          <span>Suivant</span>
          <span>{totalAmount.toFixed(2)}€</span>
        </button>
      </div>
    </div>
  );

  if (step === 'PAYMENT') {
    return (
      <div className="p-4 h-full flex flex-col">
        <h2 className="text-2xl font-bold mb-6 text-center">Moyen de paiement</h2>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {[
            { id: PaymentMethod.CARD, label: 'Carte Bancaire', icon: <CreditCard className="w-8 h-8"/> },
            { id: PaymentMethod.TICKET_CARD, label: 'Carte Ticket', icon: <CreditCard className="w-8 h-8"/> },
            { id: PaymentMethod.CASH, label: 'Espèces', icon: <Banknote className="w-8 h-8"/> },
            { id: PaymentMethod.PAPER_TICKET, label: 'Ticket Resto', icon: <Ticket className="w-8 h-8"/> },
          ].map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPayment(method.id as PaymentMethod)}
              className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                selectedPayment === method.id 
                  ? 'border-orange-500 bg-orange-50 text-orange-600' 
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
              }`}
            >
              {method.icon}
              <span className="font-medium text-sm">{method.label}</span>
            </button>
          ))}
        </div>
        <button
          disabled={!selectedPayment}
          onClick={handleSubmit}
          className="w-full bg-orange-600 disabled:bg-zinc-300 text-white py-4 rounded-xl font-bold text-xl mt-4"
        >
          Envoyer la commande
        </button>
      </div>
    );
  }

  if (step === 'CONFIRM') {
    return (
      <div className="p-4 bg-zinc-50 min-h-screen pb-32">
        <h2 className="text-2xl font-bold mb-6">Récapitulatif</h2>
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          {cart.map(item => (
            <div key={item.menuItem.id} className="flex justify-between items-center border-b border-zinc-100 last:border-0 pb-2 last:pb-0">
              <div className="flex gap-3 items-center">
                 <div className="bg-orange-100 text-orange-800 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">
                   {item.quantity}x
                 </div>
                 <div>
                   <p className="font-medium">{item.menuItem.nameFR}</p>
                   <p className="text-xs text-zinc-400">{item.menuItem.price}€ /u</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <p className="font-semibold">{(item.menuItem.price * item.quantity).toFixed(2)}€</p>
                 <button onClick={() => removeFromCart(item.menuItem.id)} className="text-red-500 text-sm">X</button>
              </div>
            </div>
          ))}
          <div className="pt-4 flex justify-between items-center border-t border-zinc-100">
             <span className="font-bold text-lg">Total</span>
             <span className="font-bold text-xl text-orange-600">{totalAmount.toFixed(2)}€</span>
          </div>
        </div>
        
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-zinc-200">
          <button 
            onClick={() => setStep('PAYMENT')}
            className="w-full bg-zinc-900 text-white py-3 rounded-lg font-semibold text-lg"
          >
            Confirmer et Payer
          </button>
          <button 
             onClick={() => setStep(Category.DESSERT)}
             className="w-full mt-2 text-zinc-500 py-2 text-sm"
          >
             Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen">
      <div className="flex sticky top-0 bg-white z-10 border-b border-zinc-200 overflow-x-auto">
         {Object.values(Category).map((cat) => (
           <button
             key={cat}
             onClick={() => setStep(cat)}
             className={`flex-1 py-4 text-sm font-medium uppercase tracking-wide border-b-2 transition-colors ${
               step === cat ? 'border-orange-500 text-orange-600' : 'border-transparent text-zinc-400'
             }`}
           >
             {cat === Category.STARTER ? 'Entrée' : cat === Category.MAIN ? 'Plat' : 'Dessert'}
           </button>
         ))}
      </div>
      {renderMenuStep(step, step === Category.STARTER ? Category.MAIN : step === Category.MAIN ? Category.DESSERT : 'CONFIRM')}
    </div>
  );
};

export default ClientView;
