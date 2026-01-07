import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../App';
import { useToast } from '../components/ToastProvider';
import { Icons, APP_NAME } from '../constants';

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'SHOP_OWNER', companyName: '', gstNumber: '', address: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.register(formData);
      // Auto login or update layout handled by App via db/auth state
      if (data && data.token) {
        setAuth({ user: data.user, token: data.token, loading: false });
        navigate('/'); // Redirect to Dashboard/Home
        showToast('Account created! Welcome to ElectraTrade.', 'success');
      } else {
        navigate('/login');
        showToast('Registration successful. Please login.', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-xl space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <Icons.Box className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Join {APP_NAME}</h2>
          <p className="mt-2 text-sm text-slate-600">Enter your business details to apply.</p>
        </div>

        <form className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="block w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Account Role</label>
            <select
              value={formData.role}
              // Fix: cast e.target.value as any to resolve "UserRole refers to a value" type error
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="block w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value={UserRole.SHOP_OWNER}>Electronics Shop Owner (Buyer)</option>
              <option value={UserRole.MANUFACTURER}>Manufacturer (Supplier)</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Company / Shop Name</label>
            <input
              required
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="block w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Business Address</label>
            <textarea
              required
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="block w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          <div className="col-span-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting Application...' : 'Register Business'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
