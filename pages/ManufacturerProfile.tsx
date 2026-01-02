
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useCart, useAuth } from '../App';
import { Icons } from '../constants';
import { UserRole } from '../types';

const ManufacturerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [manufacturer, setManufacturer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [allReviews, setAllReviews] = useState<Record<string, any[]>>({});
  
  const { addToCart, cart } = useCart();
  const { auth } = useAuth();
  const navigate = useNavigate();

  const loadProfile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [mDetails, mProducts] = await Promise.all([
        api.users.getPartnerDetails(id),
        api.products.getByManufacturer(id)
      ]);

      // Fetch reviews for their products
      const reviewPromises = mProducts.map(p => api.products.getReviews(p.id));
      const reviewsResults = await Promise.all(reviewPromises);
      const reviewsMap: Record<string, any[]> = {};
      mProducts.forEach((p, i) => {
        reviewsMap[p.id] = reviewsResults[i];
      });

      setManufacturer(mDetails);
      setProducts(mProducts);
      setAllReviews(reviewsMap);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const handleAddToCart = (product: any) => {
    if (!auth.user) {
      navigate('/login');
      return;
    }
    if (auth.user.role !== UserRole.SHOP_OWNER) {
      alert("Only Retailers can add products to cart.");
      return;
    }
    addToCart({
      productId: product.id,
      product,
      quantity: product.moq
    });
  };

  const handleBuyNow = async (product: any) => {
    if (!auth.user) {
      navigate('/login');
      return;
    }
    if (auth.user.role !== UserRole.SHOP_OWNER) {
      alert("Only Retailers can initiate direct purchases.");
      return;
    }

    if (product.stock < product.moq) {
      alert("Insufficient stock for the minimum order quantity.");
      return;
    }

    const confirmPurchase = window.confirm(`Direct Purchase: Proceed to order the minimum quantity (${product.moq} units) of ${product.name} for $${(product.price * product.moq).toFixed(2)}?`);
    if (!confirmPurchase) return;

    setPurchasingId(product.id);
    try {
      await api.orders.create(auth.user.id, [{
        productId: product.id,
        product,
        quantity: product.moq
      }]);
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      alert('Checkout failed. Please try again.');
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving Partner Intelligence...</p>
    </div>
  );

  if (!manufacturer) return null;

  return (
    <div className="space-y-0 pb-20 animate-in fade-in duration-700">
      {/* Profile Header */}
      <section className="bg-slate-900 text-white pt-24 pb-32 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="mb-12 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
          >
            <Icons.History className="w-4 h-4 rotate-180" />
            Back to Catalog
          </button>
          
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center text-4xl font-black text-slate-900 shadow-2xl border-4 border-white/10 shrink-0">
               {manufacturer.companyName.charAt(0)}
            </div>
            <div className="text-center md:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                 <h1 className="text-5xl font-black tracking-tight">{manufacturer.companyName}</h1>
                 <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                    <Icons.CheckCircle2 className="w-3 h-3" />
                    Certified Manufacturer
                 </div>
              </div>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">
                Established manufacturing partner specialized in high-performance computing components and verified B2B supply logistics.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
                 <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                    <Icons.Users className="w-4 h-4 text-blue-500" />
                    Contact: {manufacturer.name}
                 </div>
                 <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                    <Icons.Box className="w-4 h-4 text-blue-500" />
                    {products.length} Active SKUs
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20 grid grid-cols-1 lg:grid-cols-4 gap-12">
         {/* Sidebar Info */}
         <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Corporate Intelligence</h3>
               <div className="space-y-6">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Address</p>
                     <p className="text-sm font-bold text-slate-700 leading-relaxed">{manufacturer.address}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Electronic Mail</p>
                     <p className="text-sm font-bold text-slate-700">{manufacturer.email}</p>
                  </div>
                  <div className="pt-4">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Network Health</p>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                           <div className="h-full w-[100%] bg-green-500"></div>
                        </div>
                        <p className="text-[9px] font-bold text-green-600 mt-2 uppercase tracking-widest">A+ Rating Verified</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Products List */}
         <div className="lg:col-span-3 space-y-12">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Supply Catalog</h2>
               <div className="h-px flex-1 mx-8 bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {products.map(p => {
                  const inCart = cart.some((item: any) => item.productId === p.id);
                  const isPurchasing = purchasingId === p.id;
                  const reviews = allReviews[p.id] || [];
                  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

                  return (
                    <div key={p.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                      <div className="relative overflow-hidden h-56 bg-slate-100 p-4">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                          <span className="text-[10px] font-black bg-slate-900 text-white px-4 py-1.5 rounded-full shadow-xl uppercase tracking-widest">SKU: {p.id.slice(-4)}</span>
                          {p.stock < 20 && p.stock > 0 && <span className="text-[10px] font-black bg-orange-500 text-white px-4 py-1.5 rounded-full shadow-xl uppercase tracking-widest">Limited</span>}
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{p.category}</span>
                          {avgRating > 0 && (
                            <div className="flex items-center gap-1 text-orange-500">
                              <Icons.CheckCircle2 className="w-3 h-3" />
                              <span className="text-[10px] font-black">{avgRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 leading-tight mb-6 line-clamp-2 h-10 group-hover:text-blue-600 transition-colors text-lg">{p.name}</h3>

                        <div className="mt-auto">
                          <div className="flex flex-col mb-6">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Contract Price</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tight">${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleBuyNow(p)}
                              disabled={p.stock < p.moq || isPurchasing}
                              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all text-xs uppercase tracking-widest ${
                                p.stock < p.moq 
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-blue-600 shadow-xl active:scale-95'
                              }`}
                            >
                              {isPurchasing ? 'Securing...' : 'Buy Now'}
                            </button>
                            <button 
                              onClick={() => handleAddToCart(p)}
                              disabled={p.stock < p.moq}
                              className={`flex items-center justify-center p-4 rounded-2xl transition-all ${
                                inCart 
                                ? 'bg-green-100 text-green-600' 
                                : p.stock < p.moq 
                                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                  : 'bg-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:scale-95'
                              }`}
                            >
                              {inCart ? <Icons.CheckCircle2 className="w-6 h-6" /> : <Icons.ShoppingCart className="w-6 h-6" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
               })}
            </div>

            {products.length === 0 && (
               <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                  <Icons.Box className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-xs">No active listings currently available.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ManufacturerProfile;
