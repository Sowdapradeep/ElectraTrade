import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Icons } from '../constants';

const VerificationQueue = () => {
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);
    const [inspectedPartner, setInspectedPartner] = useState(null);
    const [partnerView, setPartnerView] = useState('all'); // 'all' or 'audit'

    const loadData = async () => {
        setLoading(true);
        try {
            const users = await api.admin.getAllUsers();
            setAllUsers(users);
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

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

    const getStatusParams = (user) => {
        if (user.isApproved) return { label: 'Verified', className: 'bg-green-50 text-green-600 border border-green-100' };
        if (user.isRejected) return { label: 'Rejected', className: 'bg-red-50 text-red-600 border border-red-100' };
        return { label: 'Pending Verification', className: 'bg-orange-50 text-orange-600 border border-orange-100' };
    };

    if (loading) return (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Registry...</span>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Partner Registry</h1>
                    <p className="text-slate-500 font-medium">Verification & Compliance Queue</p>
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {(partnerView === 'audit'
                    ? allUsers.filter(u => !u.isApproved && !u.isRejected)
                    : allUsers
                ).map(user => {
                    const status = getStatusParams(user);
                    return (
                        <div key={user.id} className="bg-white rounded-[32px] border border-slate-200 p-8 hover:shadow-xl transition-all group flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl font-black text-indigo-600 border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                        {user.companyName.charAt(0)}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${status.className}`}>
                                        {status.label}
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
                    );
                })}
            </div>

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
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
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

export default VerificationQueue;
