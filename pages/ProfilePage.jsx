
import React, { useState } from 'react';
import { useAuth } from '../App';
import { api } from '../services/api';
import { Icons } from '../constants';
import { UserRole } from '../types';

const ProfilePage = () => {
   const { auth, setAuth } = useAuth();
   const [loading, setLoading] = useState(false);
   const [formData, setFormData] = useState({
      name: auth.user?.name || '',
      companyName: auth.user?.companyName || '',
      address: auth.user?.address || '',
      gstNumber: auth.user?.gstNumber || '',
   });

   const isManufacturer = auth.user?.role === UserRole.MANUFACTURER;
   const isShopOwner = auth.user?.role === UserRole.SHOP_OWNER;

   const handleUpdate = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
         const updatedUser = await api.auth.updateProfile(auth.user.id, formData);
         setAuth((prev) => ({ ...prev, user: updatedUser }));
         alert('Business profile updated.');
      } catch (err) {
         alert(err.message || 'Failed.');
      } finally {
         setLoading(false);
      }
   };

   const creditUsagePercent = isShopOwner ? (auth.user.creditUsed / auth.user.creditLimit) * 100 : 0;

   return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
         <div className="flex justify-between items-end">
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">Corporate Command</h1>
               <p className="text-slate-500 font-medium">B2B Trade Identity & Financial Ledger.</p>
            </div>
            <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Verified Partner</span>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-8">
               {isShopOwner && (
                  <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl shadow-slate-200 space-y-10 relative overflow-hidden group">
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Trade Credit Health</p>
                        <p className="text-5xl font-black tracking-tighter">${(auth.user.creditLimit - auth.user.creditUsed).toLocaleString()}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Available for Procurement</p>

                        <div className="mt-12 space-y-4">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">Total Line of Credit</span>
                              <span>${auth.user.creditLimit.toLocaleString()}</span>
                           </div>
                           <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${creditUsagePercent}%` }}></div>
                           </div>
                           <p className="text-[9px] font-bold text-slate-500 uppercase">Consuming {creditUsagePercent.toFixed(1)}% of your allowance.</p>
                        </div>
                     </div>
                     <Icons.History className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
                  </div>
               )}

               <div className="bg-white p-8 rounded-[40px] border border-slate-200 space-y-6 shadow-sm">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Compliance Status</h3>
                  <div className="space-y-4">
                     <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                        <span>GST Registration</span>
                        <span className="text-green-600">Active</span>
                     </div>
                     <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                        <span>TDS Compliance</span>
                        <span className="text-green-600">Verified</span>
                     </div>
                     <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                        <span>Tax Residence</span>
                        <span className="text-slate-900">Domestic (Tier 1)</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-2">
               <form onSubmit={handleUpdate} className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm space-y-10">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Business Intelligence Profile</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Entity Name</label>
                        <input type="text" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-slate-900" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GSTIN (Tax ID)</label>
                        <input type="text" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-slate-900" />
                     </div>
                     <div className="space-y-3 col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Address</label>
                        <textarea rows={4} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-700" />
                     </div>
                  </div>

                  <div className="flex justify-end pt-6">
                     <button type="submit" disabled={loading} className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                        {loading ? 'Syncing...' : 'Update Corporate Identity'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
};

export default ProfilePage;
