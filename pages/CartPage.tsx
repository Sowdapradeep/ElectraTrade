
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart, useAuth } from '../App';
import { Icons } from '../constants';
import { api } from '../services/api';
import { PaymentMethod, GST_RATE } from '../types';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { auth } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(PaymentMethod.DIRECT);
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const gst = subtotal * GST_RATE;
  const total = subtotal + gst;

  const handleCheckout = async () => {
    if (!auth.user) return;
    setCheckingOut(true);
    try {
      await api.orders.create(auth.user.id, cart, selectedMethod);
      clearCart();
      alert(`Success! Order placed using ${selectedMethod.replace('_', ' ')} logic.`);
      navigate('/orders');
    } catch (err: any) {
      alert(err.message || 'Failed to place order.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="bg-blue-50 p-8 rounded-full text-blue-200"><Icons.ShoppingCart className="w-16 h-16" /></div>
        <h2 className="text-2xl font-bold text-slate-900">Wholesale cart is empty</h2>
        <Link to="/catalog" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Browse Catalog</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bulk Procurement Cart</h1>
          <button onClick={clearCart} className="text-xs font-black text-red-500 uppercase tracking-widest hover:underline">Reset Cart</button>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {cart.map(item => (
            <div key={item.productId} className="p-8 flex flex-col sm:flex-row gap-8 group">
              <img src={item.product.imageUrl} className="w-24 h-24 rounded-2xl object-cover border border-slate-100 group-hover:scale-105 transition-transform" alt="" />
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{item.product.name}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">HSN: {item.product.hsnCode} &bull; Unit: ${item.product.price}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors"><Icons.Trash2 className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-3 hover:bg-slate-200 text-slate-600 disabled:opacity-30" disabled={item.quantity <= item.product.moq}><Icons.Minus className="w-4 h-4" /></button>
                    <span className="px-5 text-sm font-black w-14 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-3 hover:bg-slate-200 text-slate-600"><Icons.Plus className="w-4 h-4" /></button>
                  </div>
                  <span className="text-xl font-black text-slate-900">${(item.product.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-1 space-y-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl space-y-8 sticky top-28">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Settlement Options</h2>
          
          <div className="space-y-4">
             <button 
               onClick={() => setSelectedMethod(PaymentMethod.DIRECT)}
               className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${selectedMethod === PaymentMethod.DIRECT ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
             >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Method 01</p>
                <p className="text-sm font-black text-slate-900 uppercase">Immediate Settlement</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">Standard Bank Transfer / Credit Card</p>
             </button>
             <button 
               onClick={() => setSelectedMethod(PaymentMethod.NET_30)}
               className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${selectedMethod === PaymentMethod.NET_30 ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
             >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Method 02</p>
                <div className="flex items-center justify-between">
                   <p className="text-sm font-black text-slate-900 uppercase">Net-30 Trade Credit</p>
                   <Icons.CheckCircle2 className={`w-4 h-4 ${selectedMethod === PaymentMethod.NET_30 ? 'text-blue-600' : 'text-slate-200'}`} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-1">Pay within 30 days. Uses network limit.</p>
             </button>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-8">
             <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
             <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Tax (GST 18%)</span><span>${gst.toLocaleString()}</span></div>
             <div className="flex justify-between text-2xl font-black text-slate-900 pt-4"><span>Total Amount</span><span>${total.toLocaleString()}</span></div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={checkingOut}
            className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {checkingOut ? 'Authenticating Trade...' : 'Initialize Procurement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
