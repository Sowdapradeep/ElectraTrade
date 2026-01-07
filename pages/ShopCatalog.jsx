
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useCart, useAuth, useCatalog } from '../App';
import { Icons, CATEGORIES } from '../constants';

const ShopCatalog = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [comparing, setComparing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiRecs, setAiRecs] = useState('');

  const [filters, setFilters] = useState({
    brand: 'All',
    maxPrice: 2000,
    certification: 'All'
  });

  const { addToCart, cart } = useCart();
  const { auth } = useAuth();
  const { search, selectedCategory } = useCatalog();

  const load = async () => {
    setLoading(true);
    const data = await api.products.getAll();
    setProducts(data);
    if (auth.user) {
      const recs = await api.ai.getRecommendations(auth.user.id);
      setAiRecs(recs);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = products;
    if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
    if (filters.brand !== 'All') result = result.filter(p => p.brand === filters.brand);
    if (filters.certification !== 'All') result = result.filter(p => p.certifications?.includes(filters.certification));
    result = result.filter(p => p.price <= filters.maxPrice);
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    setFilteredProducts(result);
  }, [products, selectedCategory, filters, search]);

  const toggleCompare = (p) => {
    setComparing(prev => prev.find(item => item.id === p.id) ? prev.filter(item => item.id !== p.id) : [...prev, p].slice(0, 3));
  };

  return (
    <div className="w-full px-4 py-12 flex gap-12 relative">
      {/* Filter Sidebar */}
      <aside className="w-64 shrink-0 space-y-10 hidden lg:block">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Technical Filters</h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Manufacturer</label>
              <select
                value={filters.brand}
                onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
              >
                <option value="All">All Brands</option>
                <option value="Intel">Intel</option>
                <option value="AMD">AMD</option>
                <option value="NVIDIA">NVIDIA</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Certification</label>
              <div className="space-y-2">
                {['CE', 'ISO', 'RoHS'].map(c => (
                  <button
                    key={c}
                    onClick={() => setFilters({ ...filters, certification: filters.certification === c ? 'All' : c })}
                    className={`w-full text-left px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filters.certification === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {c} Compliance
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Price Ceiling (${filters.maxPrice})</label>
              <input
                type="range" min="0" max="5000" step="100"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {aiRecs && (
          <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-3">Smart Kit Recs</p>
            <p className="text-[10px] font-medium text-indigo-900 leading-relaxed italic">"{aiRecs.slice(0, 150)}..."</p>
          </div>
        )}
      </aside>

      <div className="flex-1 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white rounded-[20px] border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
              <div className="h-36 bg-slate-50 overflow-hidden relative">
                <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute top-4 left-4 flex gap-2">
                  {p.certifications?.map((c) => (
                    <span key={c} className="bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded uppercase">{c}</span>
                  ))}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{p.brand}</span>
                  <button onClick={() => toggleCompare(p)} className={`text-[8px] font-black uppercase tracking-widest hover:text-blue-600 ${comparing.find(item => item.id === p.id) ? 'text-blue-600' : 'text-slate-400'}`}>
                    {comparing.find(item => item.id === p.id) ? 'Selected' : '+ Compare'}
                  </button>
                </div>
                <h3 className="font-bold text-slate-900 mb-3 text-sm leading-tight line-clamp-2">{p.name}</h3>

                {p.pricingTiers && p.pricingTiers.length > 0 && (
                  <div className="mb-3 bg-green-50 rounded-lg p-2 border border-green-100">
                    <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mb-1">Volume Pricing</p>
                    <div className="space-y-0.5">
                      {p.pricingTiers.map((tier, idx) => (
                        <div key={idx} className="flex justify-between text-[9px] font-medium text-slate-600">
                          <span>{tier.minQuantity}+</span>
                          <span className="text-slate-900 font-bold">${tier.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-auto space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Wholesale Unit</p>
                      <p className="text-xl font-black text-slate-900">${p.price.toLocaleString()}</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">MOQ: {p.moq}u</span>
                  </div>
                  <button
                    onClick={() => addToCart({ productId: p.id, product: p, quantity: p.moq })}
                    className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Drawer */}
      {comparing.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-white border border-slate-200 shadow-2xl rounded-[40px] px-10 py-8 flex items-center gap-10 animate-in slide-in-from-bottom-20 duration-500 max-w-4xl w-full">
          <div className="flex-1 grid grid-cols-3 gap-8">
            {comparing.map(p => (
              <div key={p.id} className="flex items-center gap-4">
                <img src={p.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-black text-slate-900 truncate">{p.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{p.price} / unit</p>
                </div>
                <button onClick={() => toggleCompare(p)} className="text-slate-300 hover:text-red-500"><Icons.XCircle className="w-4 h-4" /></button>
              </div>
            ))}
            {comparing.length < 3 && <div className="border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">Select more</div>}
          </div>
          <button
            onClick={() => alert("Redirecting to detailed technical matrix...")}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            Compare Specs
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopCatalog;
