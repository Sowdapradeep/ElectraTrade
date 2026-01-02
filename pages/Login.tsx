
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Icons, APP_NAME } from '../constants';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <Icons.Box className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Sign in to {APP_NAME}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Welcome back, partner. Let's trade.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                className="block w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                disabled
              />
              <p className="mt-1 text-[10px] text-slate-400">Password is disabled for this demo environment.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-4">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
              Register now
            </Link>
          </p>
          <div className="bg-slate-50 p-5 rounded-2xl text-left border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Verified Demo Accounts:</h4>
            <ul className="text-xs text-slate-600 space-y-3">
              <li className="flex flex-col">
                <span className="font-bold text-slate-900">Admin Portal:</span>
                <code className="bg-white border border-slate-200 px-2 py-1 rounded mt-1 select-all cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setEmail('admin@electratrade.com')}>admin@electratrade.com</code>
              </li>
              <li className="flex flex-col">
                <span className="font-bold text-slate-900">Supplier (Manufacturer):</span>
                <code className="bg-white border border-slate-200 px-2 py-1 rounded mt-1 select-all cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setEmail('info@siliconmicro.com')}>info@siliconmicro.com</code>
              </li>
              <li className="flex flex-col">
                <span className="font-bold text-slate-900">Retailer (Shop Owner):</span>
                <code className="bg-white border border-slate-200 px-2 py-1 rounded mt-1 select-all cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setEmail('buyer@elitegear.com')}>buyer@elitegear.com</code>
              </li>
            </ul>
            <p className="mt-4 text-[9px] text-slate-400 font-medium italic">Tip: Click an email to pre-fill the field.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
