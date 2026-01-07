
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { Icons, CATEGORIES } from '../constants';
import { OrderStatus } from '../types';

const ManufacturerDashboard = () => {
  const { auth } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: CATEGORIES[0],
    brand: '',
    price: '',
    stock: '',
    moq: '',
    imageUrl: '',
    description: '',
    certifications: []
  });

  const loadData = async () => {
    if (!auth.user) return;
    setLoading(true);
    const [pData, oData] = await Promise.all([
      api.products.getAll(),
      api.orders.getByUser(auth.user.id, auth.user.role)
    ]);
    const mProducts = pData.filter((p) => p.manufacturerId === auth.user.id);
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

  const handleAddProduct = async (e) => {
    e.preventDefault();

    // Validation
    if (!newProduct.name || !newProduct.brand || !newProduct.price || !newProduct.stock || !newProduct.moq) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.products.create({
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        moq: parseInt(newProduct.moq),
        manufacturerId: auth.user.id
      });

      alert('Product added successfully!');
      setShowAddProduct(false);
      setNewProduct({
        name: '',
        category: CATEGORIES[0],
        brand: '',
        price: '',
        stock: '',
        moq: '',
        imageUrl: '',
        description: '',
        certifications: []
      });
      await loadData();
    } catch (err) {
      alert('Failed to add product. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCertification = (cert) => {
    setNewProduct(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

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
            <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${(lowStockCount / products.length) * 100}%` }}></div>
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

      {/* Product Management Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog</h2>
            <p className="text-sm text-slate-500 font-medium">Manage your product listings</p>
          </div>
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95"
          >
            <Icons.PackagePlus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center">
            <Icons.Box className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase text-sm mb-2">No Products Listed</p>
            <p className="text-slate-500 text-xs mb-6">Start adding products to your catalog</p>
            <button
              onClick={() => setShowAddProduct(true)}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                <div className="h-48 bg-slate-100 relative">
                  <img src={p.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-1 rounded-lg uppercase">{p.category}</span>
                    {p.stock < 20 && <span className="text-[8px] font-black bg-orange-500 text-white px-2 py-1 rounded-lg uppercase">Low Stock</span>}
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
                      <p className="text-[8px] font-black text-slate-400 uppercase">Unit Price</p>
                      <p className="text-xl font-black text-slate-900">${p.price.toLocaleString()}</p>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">MOQ: {p.moq}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 leading-none mb-2">Add New Product</h2>
                  <p className="text-sm text-slate-500 font-medium">List a new product in the marketplace</p>
                </div>
                <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <Icons.XCircle className="w-8 h-8 text-slate-300" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name *</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                      placeholder="e.g., Intel Core i9-13900K"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand *</label>
                    <input
                      type="text"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                      placeholder="e.g., Intel"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category *</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                      required
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Quantity *</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MOQ (Min Order Qty) *</label>
                    <input
                      type="number"
                      value={newProduct.moq}
                      onChange={(e) => setNewProduct({ ...newProduct, moq: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                      placeholder="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image URL</label>
                  <input
                    type="url"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 resize-none"
                    rows="3"
                    placeholder="Product description..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certifications</label>
                  <div className="flex gap-3">
                    {['CE', 'ISO', 'RoHS'].map(cert => (
                      <button
                        key={cert}
                        type="button"
                        onClick={() => toggleCertification(cert)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${newProduct.certifications.includes(cert)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                      >
                        {cert}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Adding Product...' : 'Add Product to Catalog'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturerDashboard;
