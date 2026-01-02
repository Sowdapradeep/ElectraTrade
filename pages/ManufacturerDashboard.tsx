
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { Icons } from '../constants';
import { OrderStatus } from '../types';

const ManufacturerDashboard = () => {
  const { auth } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!auth.user) return;
    const [pData, oData] = await Promise.all([
      api.products.getAll(),
      api.orders.getByUser(auth.user.id, auth.user.role)
    ]);
    const mProducts = pData.filter((p: any) => p.manufacturerId === auth.user.id);
    setProducts(mProducts);
    setOrders(oData);
    
    // Get AI Prediction
    const aiText = await api.ai.predictDemand(auth.user.id);
    setPrediction(aiText);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const lowStockCount = products.filter(p => p.stock < 20).length;

  // Visual Sparkline Data (Simulated)
  const sparklineData = [30, 45, 35, 60, 55, 80, 75];

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400">SYNCING CORE SYSTEMS...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Supply Command</h1>
          <p className="text-slate-500 font-medium">Distribution intelligence for {auth.user.companyName}.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <Icons.CheckCircle2 className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Status</p>
                <p className="text-sm font-bold text-slate-900">Online & Syncing</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Card with Sparkline */}
        <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden lg:col-span-2 group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Cumulative Trade Revenue</p>
            <p className="text-6xl font-black tracking-tighter">${totalRevenue.toLocaleString()}</p>
            
            <div className="mt-12 flex items-end gap-2 h-24">
              {sparklineData.map((val, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-blue-500/20 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-500"
                  style={{ height: `${val}%` }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <span>Q1 2024</span>
              <span>Projected Growth +24%</span>
            </div>
          </div>
          <Icons.LayoutDashboard className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5" />
        </div>

        {/* AI Insight Card */}
        <div className="bg-indigo-600 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-200">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                 <Icons.Box className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Gemini Demand Forecast</p>
           </div>
           <p className="text-sm leading-relaxed font-medium italic opacity-90 mb-8 line-clamp-6">
              "{prediction}"
           </p>
           <button onClick={loadData} className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
              Re-run Simulation
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Low Stock Alerts</p>
           <p className={`text-4xl font-black ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{lowStockCount}</p>
           <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${(lowStockCount/products.length)*100}%` }}></div>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Procurement</p>
           <p className="text-4xl font-black text-slate-900">{orders.filter(o => o.status === OrderStatus.PENDING).length}</p>
           <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Awaiting Dispatch</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Satisfaction</p>
           <p className="text-4xl font-black text-slate-900">4.9/5</p>
           <p className="text-[9px] font-bold text-green-600 uppercase mt-2">Elite Supplier Tier</p>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerDashboard;
