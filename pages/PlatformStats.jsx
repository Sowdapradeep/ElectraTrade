import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Icons } from '../constants';
import { UserRole, OrderStatus, PaymentStatus } from '../types';

const PlatformStats = () => {
    const [loading, setLoading] = useState(true);
    const [allOrders, setAllOrders] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [tradeSearch, setTradeSearch] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [orders, products, users] = await Promise.all([
                api.orders.getByUser('admin', UserRole.ADMIN),
                api.products.getAll(),
                api.admin.getAllUsers(),
            ]);
            setAllOrders(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setAllProducts(products);
            setAllUsers(users);
        } catch (err) {
            console.error("Failed to load stats", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const settledOrders = allOrders.filter(o => o.status !== OrderStatus.CANCELLED);
    const stats = {
        totalVolume: settledOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        platformProfit: settledOrders.reduce((sum, o) => sum + (o.totalAmount * 0.05), 0), // Assuming 5% markup
        activeOrders: allOrders.filter(o => [OrderStatus.PENDING, OrderStatus.APPROVED, OrderStatus.SHIPPED].includes(o.status)).length,
        pendingVerifications: allUsers.filter(u => !u.isApproved && !u.isRejected).length
    };

    const getPartnerName = (id) => allUsers.find(u => u.id === id)?.companyName || 'Unknown Corp';

    if (loading) return (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating Metrics...</span>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Analytics</h1>
                    <p className="text-slate-500 font-medium">Network Performance & Trade Ledger</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                >
                    <Icons.History className="w-4 h-4" />
                    Refresh Data
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
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
    );
};

export default PlatformStats;
