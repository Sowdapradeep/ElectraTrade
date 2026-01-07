
import React, { useState } from 'react';
import { api } from '../services/api';
import { Icons } from '../constants';

const PaymentModal = ({ amount, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
    const [upiId, setUpiId] = useState('');
    const [card, setCard] = useState({
        number: '',
        expiry: '',
        cvv: '',
        holder: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        if (paymentMethod === 'CREDIT_CARD') {
            if (card.number.length < 16) {
                setError('Invalid card number');
                setLoading(false);
                return;
            }
        } else if (paymentMethod === 'UPI') {
            if (!upiId.includes('@')) {
                setError('Invalid UPI ID format');
                setLoading(false);
                return;
            }
        }

        try {
            // Mock API Call
            const response = await api.payments.process(amount, paymentMethod, paymentMethod === 'UPI' ? { upiId } : card);

            if (response.status === 'COMPLETED') {
                if (paymentMethod === 'UPI') {
                    // Simulate "Waiting for Bank"
                    setLoading('VERIFYING'); // Use string for state
                    setTimeout(() => {
                        onSuccess(response);
                    }, 4000); // 4 second delay
                } else {
                    onSuccess(response);
                }
            } else {
                setError('Payment Failed: ' + (response.message || 'Unknown error'));
                setLoading(false);
            }
        } catch (err) {
            setError(err.message || 'Payment processing failed');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-900">Secure Checkout</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <Icons.XCircle className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="mb-6 p-4 bg-indigo-50 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Total Amount</span>
                    <span className="text-2xl font-black text-indigo-900">${amount.toLocaleString()}</span>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                        {error}
                    </div>
                )}

                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('CREDIT_CARD')}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === 'CREDIT_CARD' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Card
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === 'UPI' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        UPI
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {paymentMethod === 'CREDIT_CARD' ? (
                        <>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Card Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        maxLength="19"
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                        value={card.number}
                                        onChange={e => setCard({ ...card, number: e.target.value.replace(/\D/g, '') })}
                                    />
                                    <Icons.CreditCard className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiry Date</label>
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        maxLength="5"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                        value={card.expiry}
                                        onChange={e => setCard({ ...card, expiry: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CVC / CVV</label>
                                    <input
                                        type="text"
                                        maxLength="3"
                                        placeholder="123"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                        value={card.cvv}
                                        onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UPI ID</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="username@bank"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                    value={upiId}
                                    onChange={e => setUpiId(e.target.value)}
                                />
                                <Icons.Smartphone className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                            </div>
                            <p className="mt-2 text-[10px] text-slate-400 font-medium">Verify payment requests in your UPI app.</p>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}
                        >
                            {loading === 'VERIFYING' ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying with Bank...
                                </>
                            ) : loading ? (
                                <>Processing...</>
                            ) : (
                                <>Pay Now <Icons.ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </form>
                <div className="mt-6 flex justify-center gap-4 text-slate-300">
                    <div className="w-8 h-5 bg-slate-100 rounded"></div>
                    <div className="w-8 h-5 bg-slate-100 rounded"></div>
                    <div className="w-8 h-5 bg-slate-100 rounded"></div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
