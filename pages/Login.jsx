
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Icons, APP_NAME } from '../constants';

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await login(email);
      const user = session.user;

      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'MANUFACTURER') {
        navigate('/'); // Dashboard is at root for manufacturers
      } else {
        navigate('/catalog');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center lg:p-8">
      <div className="w-full max-w-6xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-cols-1 lg:grid lg:grid-cols-2 min-h-[700px]">

        {/* Left Side - Visual & Brand */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white overflow-hidden">
          {/* Dynamic Background */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-8">
              <Icons.Box className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-black tracking-widest uppercase">Enterprise Portal</span>
            </div>
            <h1 className="text-6xl font-black font-display leading-tight mb-6">
              Powering Global <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Component Trade</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md leading-relaxed">
              Connect directly with top-tier manufacturers and secure inventory with enterprise-grade reliability.
            </p>
          </div>

          <div className="relative z-10 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-12">
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-5 h-5 bg-orange-500 rounded-full" />)}
              {/* Placeholder Stars */}
            </div>
            <p className="text-xl font-medium italic mb-4">"ElectraTrade has revolutionized our procurement timeline. We've cut sourcing time by 40%."</p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold">JD</div>
              <div>
                <p className="font-bold">John Doe</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest"> procurement Director, TechCorp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col justify-center p-8 lg:p-16 bg-white">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center lg:text-left mb-10">
              <Icons.Box className="w-12 h-12 text-primary mb-6 mx-auto lg:mx-0" />
              <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h2>
              <p className="text-slate-500">Enter your credentials to access your dashboard.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3">
                  <Icons.XCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-5 py-4 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                    placeholder="name@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Password</label>
                    <a href="#" className="text-xs font-bold text-primary hover:text-primary/80">Forgot?</a>
                  </div>
                  <input
                    type="password"
                    className="block w-full px-5 py-4 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                    placeholder="••••••••"
                    disabled
                  />
                  <p className="text-[10px] text-slate-400 font-medium ml-1">Password disabled for demo environment.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-70 flex justify-center"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <p className="text-center text-slate-500 text-sm mb-6">
                Don't have an account? <Link to="/register" className="font-bold text-primary hover:underline">Create Account</Link>
              </p>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Demo Access</p>
                <div className="space-y-2">
                  {[
                    { role: 'Admin', email: 'admin@electratrade.com' },
                    { role: 'Supplier', email: 'info@siliconmicro.com' },
                    { role: 'Buyer', email: 'buyer@elitegear.com' }
                  ].map((u) => (
                    <button
                      key={u.role}
                      onClick={() => setEmail(u.email)}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                    >
                      <span className="text-xs font-bold text-slate-700">{u.role}</span>
                      <span className="text-xs text-slate-400 group-hover:text-primary transition-colors">{u.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
