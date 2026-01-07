
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { OrderStatus, UserRole, PaymentStatus, PaymentMethod } from '../types';
import { Icons } from '../constants';

const OrdersHistory = () => {
   const { auth } = useAuth();
   const [orders, setOrders] = useState([]);
   const [loading, setLoading] = useState(true);
   const [showInvoice, setShowInvoice] = useState(null);
   const [settling, setSettling] = useState(null);

   const load = async () => {
      setLoading(true);
      const data = await api.orders.getByUser(auth.user.id, auth.user.role);
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
   };

   useEffect(() => { load(); }, [auth]);

   const handleSettle = async (orderId) => {
      setSettling(orderId);
      try {
         await api.orders.settleInvoice(orderId);
         await load();
      } finally {
         setSettling(null);
      }
   };

   if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400">LOADING LEDGER...</div>;

   return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Records</h1>
               <p className="text-slate-500 font-medium">B2B Trade Invoices & Fulfillment status.</p>
            </div>
         </div>

         <div className="space-y-6">
            {orders.map(order => (
               <div key={order.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                  <div className="p-8 flex flex-col lg:flex-row justify-between gap-8">
                     <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.invoiceNumber}</span>
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${order.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {order.paymentStatus} {order.paymentMethod === PaymentMethod.NET_30 && '(NET-30)'}
                           </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900">
                           {order.items.length} Component Group{order.items.length > 1 ? 's' : ''}
                        </h3>
                        <div className="flex gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                           <p>Placed: {new Date(order.createdAt).toLocaleDateString()}</p>
                           {order.dueDate && <p className="text-red-500">Due: {new Date(order.dueDate).toLocaleDateString()}</p>}
                        </div>
                     </div>

                     <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="text-right sm:mr-8">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payable</p>
                           <p className="text-2xl font-black text-slate-900">${order.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-3">
                           <button
                              onClick={() => setShowInvoice(order)}
                              className="px-6 py-3 border-2 border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all"
                           >
                              View Invoice
                           </button>
                           {auth.user.role === UserRole.SHOP_OWNER && order.paymentStatus === PaymentStatus.UNPAID && (
                              <button
                                 onClick={() => handleSettle(order.id)}
                                 disabled={!!settling}
                                 className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                              >
                                 {settling === order.id ? 'Settling...' : 'Settle Now'}
                              </button>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 px-8 py-4 flex justify-between items-center border-t border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${order.status === OrderStatus.DELIVERED ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status: {order.status}</span>
                     </div>
                     {order.trackingId && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Track: {order.carrier} #{order.trackingId}</p>
                     )}
                  </div>
               </div>
            ))}
         </div>

         {/* Invoice Modal */}
         {showInvoice && (
            <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl p-12 space-y-10 animate-in zoom-in duration-300">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-10">
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-600 mb-4">
                           <Icons.Box className="w-8 h-8" />
                           <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">ElectraTrade B2B</span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Tax Invoice No: {showInvoice.invoiceNumber}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase">Date: {new Date(showInvoice.createdAt).toLocaleString()}</p>
                     </div>
                     <button onClick={() => setShowInvoice(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <Icons.XCircle className="w-8 h-8 text-slate-300" />
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Supplier (Manufacturer)</h4>
                        <p className="text-lg font-black text-slate-900">Silicon Microchips Inc.</p>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed mt-2">1201 Tech Park, CA 94103<br />GSTIN: 27MMMMM1111M1Z1</p>
                     </div>
                     <div className="text-right">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Bill To (Retailer)</h4>
                        <p className="text-lg font-black text-slate-900">{auth.user.companyName}</p>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed mt-2">{auth.user.address}<br />GSTIN: {auth.user.gstNumber || 'N/A'}</p>
                     </div>
                  </div>

                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b-2 border-slate-900">
                           <th className="py-4 text-[10px] font-black uppercase text-slate-400">HSN</th>
                           <th className="py-4 text-[10px] font-black uppercase text-slate-400">Description</th>
                           <th className="py-4 text-[10px] font-black uppercase text-slate-400 text-right">Qty</th>
                           <th className="py-4 text-[10px] font-black uppercase text-slate-400 text-right">Rate</th>
                           <th className="py-4 text-[10px] font-black uppercase text-slate-400 text-right">Amount</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {showInvoice.items.map((item, idx) => (
                           <tr key={idx}>
                              <td className="py-6 text-xs font-bold text-slate-400">{item.product.hsnCode}</td>
                              <td className="py-6 font-black text-slate-900 text-sm">{item.product.name}</td>
                              <td className="py-6 text-right font-bold text-slate-700">{item.quantity}</td>
                              <td className="py-6 text-right font-bold text-slate-700">${item.product.price}</td>
                              <td className="py-6 text-right font-black text-slate-900">${(item.quantity * item.product.price).toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  <div className="flex justify-end pt-10 border-t border-slate-900">
                     <div className="w-full max-w-xs space-y-4">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                           <span>Subtotal</span>
                           <span>${showInvoice.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-4">
                           <span>GST (18%)</span>
                           <span>${showInvoice.gst.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-slate-900">
                           <span>Invoice Total</span>
                           <span>${showInvoice.totalAmount.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Terms & Conditions</p>
                     <p className="text-[9px] leading-relaxed text-slate-500 italic">
                        Certified electronic delivery. {showInvoice.paymentMethod === PaymentMethod.NET_30 ? 'Interest @24% PA applicable after due date.' : 'Full payment received. Thank you for your business.'}
                     </p>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default OrdersHistory;
