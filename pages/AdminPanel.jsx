
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Icons } from '../constants';
import { UserRole, OrderStatus, PaymentStatus } from '../types';



const AdminPanel = () => {
   const [activeTab, setActiveTab] = useState('OVERVIEW');
   const [loading, setLoading] = useState(true);

   // Platform Data
   const [allOrders, setAllOrders] = useState([]);
   const [allProducts, setAllProducts] = useState([]);
   const [allUsers, setAllUsers] = useState([]);
   const [pendingUsers, setPendingUsers] = useState([]);
   const [settings, setSettings] = useState({});

   // Inspection State
   const [tradeSearch, setTradeSearch] = useState('');
   const [inspectedPartner, setInspectedPartner] = useState(null);
   const [partnerView, setPartnerView] = useState('all'); // 'all' or 'audit'

   const loadData = async () => {
      setLoading(true);
      try {
         const [orders, products, users, pending, config] = await Promise.all([
            api.orders.getByUser('admin', UserRole.ADMIN),
            api.products.getAll(),
            api.admin.getAllUsers(),
            api.admin.getPendingUsers(),
            api.admin.getSettings()
         ]);
         setAllOrders(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
         setAllProducts(products);
         setAllUsers(users);
         setPendingUsers(pending);
         setSettings(config);
      } catch (err) {
         console.error("Failed to load platform data", err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadData();
   }, []);

   const saveSettings = async () => {
      try {
         await api.admin.updateSettings(settings);
         alert('Platform configuration updated.');
      } catch (err) {
         alert('Failed to update settings.');
      }
   };

   const handleApprove = async (userId) => {
      try {
         await api.admin.approveUser(userId);
         setInspectedPartner(null);
         await loadData();
      } catch (err) {
         alert('Verification failed.');
      }
   };

   const handleReject = async (userId) => {
      if (!window.confirm("Reject this partner application?")) return;
      try {
         await api.admin.rejectUser(userId);
         setInspectedPartner(null);
         await loadData();
      } catch (err) {
         alert('Operation failed.');
      }
   };

   const settledOrders = allOrders.filter(o => o.status !== OrderStatus.CANCELLED);
   const stats = {
      totalVolume: settledOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      platformProfit: settledOrders.reduce((sum, o) => sum + (o.totalAmount * 0.05), 0), // Assuming 5% markup
      activeOrders: allOrders.filter(o => [OrderStatus.PENDING, OrderStatus.APPROVED, OrderStatus.SHIPPED].includes(o.status)).length,
      pendingVerifications: allUsers.filter(u => !u.isApproved && !u.isRejected).length
   };

   const getPartnerName = (id) => allUsers.find(u => u.id === id)?.companyName || 'Unknown Corp';

   return (
      <div className="max-w-7xl mx-auto px-4 py-10">
         {/* Admin Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100">
                  <Icons.LayoutDashboard className="w-8 h-8" />
               </div>
               <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise Console</h1>
                  <p className="text-slate-500 font-medium">B2B Network Management & Oversight</p>
               </div>
            </div>
            <div className="flex gap-3">
               <button
                  onClick={loadData}
                  className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
               >
                  <Icons.History className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Reconcile Ledger
               </button>
            </div>
         </div>

         {/* Control Tabs */}
         <div className="flex items-center gap-1 bg-slate-200/50 p-1.5 rounded-2xl w-fit border border-slate-200 mb-10 overflow-x-auto no-scrollbar">
            {[
               { id: 'OVERVIEW', label: 'Dashboard', icon: Icons.LayoutDashboard },
               { id: 'PARTNERS', label: 'Verification', icon: Icons.Users, badge: stats.pendingVerifications },
               { id: 'TRADE', label: 'Trade Ledger', icon: Icons.ShoppingCart },
               { id: 'INVENTORY', label: 'Global Catalog', icon: Icons.Box },
               { id: 'SETTINGS', label: 'Platform Config', icon: Icons.Plus },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${activeTab === tab.id
                     ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                     : 'text-slate-500 hover:text-slate-900'
                     }`}
               >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge > 0 && (
                     <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        {tab.badge}
                     </span>
                  )}
               </button>
            ))}
         </div>

         {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
               <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying Global Nodes...</span>
            </div>
         ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

               {activeTab === 'OVERVIEW' && (
                  <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-100 flex flex-col justify-between group overflow-hidden relative">
                           <div className="relative z-10">
                              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Network Volume</p>
                              <p className="text-4xl font-black tracking-tighter">${stats.totalVolume.toLocaleString()}</p>
                           </div>
                           <Icons.ShoppingCart className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-500 opacity-20" />
                        </div>
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Platform Revenue</p>
                              <p className="text-4xl font-black text-slate-900 tracking-tighter">${stats.platformProfit.toLocaleString()}</p>
                           </div>
                           <p className="text-[9px] font-bold text-green-600 uppercase mt-4">+12.5% vs Last Month</p>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Procurement</p>
                              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.activeOrders}</p>
                           </div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-4">Orders in Fulfillment</p>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Partner Requests</p>
                              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.pendingVerifications}</p>
                           </div>
                           <p className="text-[9px] font-bold text-orange-500 uppercase mt-4">Awaiting Verification</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
                           <div className="flex justify-between items-center mb-8">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Network Activity</h3>
                              <button onClick={() => setActiveTab('TRADE')} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Full Ledger</button>
                           </div>
                           <div className="space-y-4">
                              {allOrders.slice(0, 5).map(order => (
                                 <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-slate-400">
                                          <Icons.Box className="w-5 h-5" />
                                       </div>
                                       <div>
                                          <p className="text-xs font-black text-slate-900">{order.invoiceNumber}</p>
                                          <p className="text-[10px] text-slate-500 font-medium">{getPartnerName(order.shopOwnerId)}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-xs font-black text-slate-900">${order.totalAmount.toLocaleString()}</p>
                                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                          {order.status}
                                       </span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col justify-between">
                           <div>
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Trade Compliance</h3>
                              <div className="space-y-6">
                                 <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                       <span>Tax Filings</span>
                                       <span className="text-green-400">Synced</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                       <div className="h-full w-full bg-green-400"></div>
                                    </div>
                                 </div>
                                 <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                       <span>Partner KYC</span>
                                       <span className="text-orange-400">92%</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                       <div className="h-full w-[92%] bg-orange-400"></div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="pt-8 mt-8 border-t border-white/5">
                              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                 "The platform is currently operating at 98.4% uptime across all regional B2B nodes."
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'PARTNERS' && (
                  <div className="space-y-10">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Partner Registry & Verification</h2>
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                           <button
                              onClick={() => setPartnerView('all')}
                              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${partnerView === 'all'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                 }`}
                           >
                              All Partners
                           </button>
                           <button
                              onClick={() => setPartnerView('audit')}
                              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${partnerView === 'audit'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                 }`}
                           >
                              Compliance Audit
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(partnerView === 'audit'
                           ? allUsers.filter(u => !u.isApproved && !u.isRejected)
                           : allUsers
                        ).map(user => (
                           <div key={user.id} className="bg-white rounded-[32px] border border-slate-200 p-8 hover:shadow-xl transition-all group flex flex-col justify-between">
                              <div className="space-y-6">
                                 <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl font-black text-indigo-600 border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                       {user.companyName.charAt(0)}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${user.isApproved ? 'bg-green-50 text-green-600 border border-green-100' :
                                       user.isRejected ? 'bg-red-50 text-red-600 border border-red-100' :
                                          'bg-orange-50 text-orange-600 border border-orange-100'
                                       }`}>
                                       {user.isApproved ? 'Verified' : user.isRejected ? 'Rejected' : 'Pending Verification'}
                                    </span>
                                 </div>
                                 <div>
                                    <h3 className="font-black text-slate-900 text-lg leading-none mb-1">{user.companyName}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
                                 </div>
                                 <div className="space-y-2">
                                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                       <span className="font-bold text-slate-900">Address:</span> {user.address}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                       <span className="font-bold text-slate-900">GSTIN:</span> {user.gstNumber || 'NOT_LINKED'}
                                    </p>
                                 </div>
                              </div>

                              <div className="pt-8 flex gap-2">
                                 <button
                                    onClick={() => setInspectedPartner(user)}
                                    className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                                 >
                                    Inspect Docs
                                 </button>
                                 {!user.isApproved && !user.isRejected && (
                                    <button
                                       onClick={() => handleApprove(user.id)}
                                       className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                                    >
                                       Verify
                                    </button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {activeTab === 'TRADE' && (
                  <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                     <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Transaction History</h3>
                        <div className="relative w-full md:w-64">
                           <input
                              type="text"
                              placeholder="Search Invoice / Partner..."
                              value={tradeSearch}
                              onChange={(e) => setTradeSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                           />
                           <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                 <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Invoice</th>
                                 <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Buyer Entity</th>
                                 <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Total Value</th>
                                 <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center">Payment</th>
                                 <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center">Status</th>
                                 <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Date</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {allOrders.filter(o => o.invoiceNumber.includes(tradeSearch.toUpperCase())).map(order => (
                                 <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6 font-black text-slate-900 text-xs">{order.invoiceNumber}</td>
                                    <td className="px-8 py-6">
                                       <p className="text-xs font-black text-slate-700">{getPartnerName(order.shopOwnerId)}</p>
                                    </td>
                                    <td className="px-8 py-6 font-black text-slate-900 text-xs">${order.totalAmount.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-center">
                                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${order.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                          {order.paymentStatus}
                                       </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                       <span className="text-[10px] font-bold text-slate-500 uppercase">{order.status}</span>
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase">
                                       {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {activeTab === 'SETTINGS' && (
                  <div className="max-w-2xl mx-auto space-y-10">
                     <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm space-y-10">
                        <div>
                           <h3 className="text-xl font-black text-slate-900">Regional Economics</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configure global B2B trade parameters.</p>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Markup (%)</label>
                              <input
                                 type="number"
                                 value={settings.baseMarkupRate}
                                 onChange={e => setSettings({ ...settings, baseMarkupRate: Number(e.target.value) })}
                                 className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maximum Credit Allowance ($)</label>
                              <input
                                 type="number"
                                 value={settings.maxMarkupCap}
                                 onChange={e => setSettings({ ...settings, maxMarkupCap: Number(e.target.value) })}
                                 className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100"
                              />
                           </div>
                        </div>

                        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-between">
                           <div>
                              <p className="text-sm font-black text-indigo-900">AI Intelligence Core</p>
                              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Gemini-powered forecasting for all partners.</p>
                           </div>
                           <button
                              onClick={() => setSettings({ ...settings, aiSupportEnabled: !settings.aiSupportEnabled })}
                              className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${settings.aiSupportEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'}`}
                           >
                              <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                           </button>
                        </div>

                        <button
                           onClick={saveSettings}
                           className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
                        >
                           Commit Platform State
                        </button>
                     </div>
                  </div>
               )}

               {activeTab === 'INVENTORY' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {allProducts.map(p => (
                        <div key={p.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                           <div className="h-48 bg-slate-100 relative">
                              <img src={p.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                              <div className="absolute top-4 left-4 flex gap-2">
                                 <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-1 rounded-lg uppercase">{p.category}</span>
                              </div>
                           </div>
                           <div className="p-6 flex-1 flex flex-col justify-between">
                              <div>
                                 <div className="flex justify-between items-start mb-1">
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{p.brand}</span>
                                    <span className="text-[9px] font-bold text-slate-400">Stock: {p.stock}</span>
                                 </div>
                                 <h4 className="font-black text-slate-900 leading-tight line-clamp-2">{p.name}</h4>
                              </div>
                              <div className="mt-6 flex justify-between items-end border-t border-slate-50 pt-4">
                                 <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Trade Value</p>
                                    <p className="text-xl font-black text-slate-900">${p.price.toLocaleString()}</p>
                                 </div>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase italic">Supplier: {getPartnerName(p.manufacturerId)}</p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}

         {/* Partner Inspection Modal */}
         {inspectedPartner && (
            <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                  <div className="p-10 space-y-10">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-5">
                           <div className="w-16 h-16 bg-indigo-50 rounded-[28px] flex items-center justify-center text-3xl font-black text-indigo-600">
                              {inspectedPartner.companyName.charAt(0)}
                           </div>
                           <div>
                              <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">{inspectedPartner.companyName}</h2>
                              <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">{inspectedPartner.role}</p>
                           </div>
                        </div>
                        <button onClick={() => setInspectedPartner(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                           <Icons.XCircle className="w-8 h-8 text-slate-300" />
                        </button>
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Business Contact</p>
                           <p className="text-sm font-black text-slate-900">{inspectedPartner.name}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Official Email</p>
                           <p className="text-sm font-black text-slate-900">{inspectedPartner.email}</p>
                        </div>
                        <div className="col-span-2 space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Headquarters Address</p>
                           <p className="text-sm font-bold text-slate-700 leading-relaxed">{inspectedPartner.address}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Taxation ID (GSTIN)</p>
                           <p className="text-sm font-black text-indigo-600">{inspectedPartner.gstNumber || 'PENDING_REGISTRATION'}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry Date</p>
                           <p className="text-sm font-black text-slate-900">{new Date(inspectedPartner.createdAt || Date.now()).toLocaleDateString()}</p>
                        </div>
                     </div>

                     <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                           <Icons.CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-900 mb-1">Due Diligence Pending</p>
                           <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                              By verifying this partner, you authorize their access to the ElectraTrade B2B network and grant them trade capabilities according to their role.
                           </p>
                        </div>
                     </div>
                  </div>
                  <div className="bg-slate-50 p-8 border-t border-slate-100 flex gap-4">
                     <button
                        onClick={() => handleReject(inspectedPartner.id)}
                        className="flex-1 py-4 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                     >
                        Reject Application
                     </button>
                     {!inspectedPartner.isApproved && (
                        <button
                           onClick={() => handleApprove(inspectedPartner.id)}
                           className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                        >
                           Approve & Onboard Partner
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminPanel;
