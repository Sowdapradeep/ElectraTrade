import React, { createContext, useContext, useState, useCallback } from 'react';
import { Icons } from '../constants';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto dismiss
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast: addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] max-w-sm w-full bg-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 border animate-in slide-in-from-right-full duration-300 ${toast.type === 'success' ? 'border-green-100 bg-green-50/50' :
                                toast.type === 'error' ? 'border-red-100 bg-red-50/50' :
                                    'border-slate-100'
                            }`}
                    >
                        <div className={`mt-0.5 p-1 rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-600' :
                                toast.type === 'error' ? 'bg-red-100 text-red-600' :
                                    'bg-blue-100 text-blue-600'
                            }`}>
                            {toast.type === 'success' && <Icons.CheckCircle2 className="w-4 h-4" />}
                            {toast.type === 'error' && <Icons.XCircle className="w-4 h-4" />}
                            {toast.type === 'info' && <Icons.Box className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-bold ${toast.type === 'success' ? 'text-green-900' :
                                    toast.type === 'error' ? 'text-red-900' :
                                        'text-slate-900'
                                }`}>
                                {toast.type === 'success' ? 'Success' :
                                    toast.type === 'error' ? 'Error' : 'Update'}
                            </p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">
                                {toast.message}
                            </p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <Icons.XCircle className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
