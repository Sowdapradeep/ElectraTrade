import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../App';
import { Icons } from '../constants';

const ItemDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.products.getById(id);
                setProduct(data);
                setQuantity(data.moq || 1);
            } catch (err) {
                setError("Product not found or unavailable.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse">LOADING PRODUCT DATA...</div>;
    if (error) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><h1 className="text-2xl font-black text-slate-300">404</h1><p className="font-bold text-slate-500">{error}</p></div>;

    const handleQuantityChange = (delta) => {
        const newQty = quantity + delta;
        if (newQty >= product.moq && newQty <= product.stock) {
            setQuantity(newQty);
        }
    };

    // const currentTier = product.pricingTiers?.sort((a, b) => b.minQuantity - a.minQuantity).find(t => quantity >= t.minQuantity);
    // const currentPrice = currentTier ? currentTier.price : product.price;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                <Icons.ArrowLeft className="w-4 h-4" /> Back to Catalog
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Gallery Section */}
                <div className="space-y-6">
                    <div className="aspect-square bg-white rounded-[48px] border border-slate-200 overflow-hidden relative group">
                        {product.stock < 10 && product.stock > 0 && (
                            <div className="absolute top-6 right-6 bg-orange-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full z-10 animate-pulse">
                                Only {product.stock} left in stock
                            </div>
                        )}
                        <img src={product.imageUrl} className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{product.category}</span>
                            <span className="text-slate-300 font-black">/</span>
                            <span className="text-indigo-600 font-black uppercase tracking-widest text-xs">{product.brand}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[0.9] mb-4">{product.name}</h1>
                        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                            <span>Model: <span className="text-slate-900 font-bold">{product.id.slice(-6).toUpperCase()}</span></span>
                            <span>•</span>
                            <span>Sold by <span className="text-slate-900 font-bold underline decoration-slate-200 underline-offset-4">{product.manufacturer?.companyName || 'Verified Partner'}</span></span>
                        </div>
                    </div>

                    {/* Pricing Tiers Removed - User Request */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Standard Wholesale Price</p>
                        <p className="text-xl font-black text-slate-900">${product.price.toLocaleString()} <span className="text-xs text-slate-400 font-bold">/ unit</span></p>
                    </div>

                    <div className="pt-6 border-t border-slate-200 flex gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl flex items-center h-14">
                            <button onClick={() => handleQuantityChange(-1)} className="w-12 h-full flex items-center justify-center hover:bg-slate-50 rounded-l-2xl text-slate-400 hover:text-slate-900 transition-colors" disabled={quantity <= product.moq}>
                                <Icons.Minus className="w-4 h-4" />
                            </button>
                            <div className="w-16 text-center font-black text-lg">{quantity}</div>
                            <button onClick={() => handleQuantityChange(1)} className="w-12 h-full flex items-center justify-center hover:bg-slate-50 rounded-r-2xl text-slate-400 hover:text-slate-900 transition-colors" disabled={quantity >= product.stock}>
                                <Icons.Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => { addToCart({ productId: product.id, product, quantity }); }}
                            className="flex-1 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={product.stock === 0}
                        >
                            {product.stock > 0 ? 'Add to Manifest' : 'Out of Stock'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Technical Specifications</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Keeping Unit</p>
                            <p className="font-bold text-slate-700">SKU-{product.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Harmonized System</p>
                            <p className="font-bold text-slate-700">HSN: {product.hsnCode}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Certifications</p>
                            <div className="flex gap-2">
                                {product.certifications?.map(c => (
                                    <span key={c} className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded border border-slate-200">{c}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default ItemDetails;
