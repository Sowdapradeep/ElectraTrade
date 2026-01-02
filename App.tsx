
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from './types';
import { api } from './services/api';
import { db, initializeDB } from './services/db';
import { Icons, APP_NAME, CATEGORIES } from './constants';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ManufacturerDashboard from './pages/ManufacturerDashboard';
import ShopCatalog from './pages/ShopCatalog';
import CartPage from './pages/CartPage';
import OrdersHistory from './pages/OrdersHistory';
import AdminPanel from './pages/AdminPanel';
import ManufacturerProfile from './pages/ManufacturerProfile';
import ProfilePage from './pages/ProfilePage';

const AuthContext = createContext<any>(null);
export const useAuth = () => useContext(AuthContext);

const CartContext = createContext<any>(null);
export const useCart = () => useContext(CartContext);

const CatalogContext = createContext<any>(null);
export const useCatalog = () => useContext(CatalogContext);

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { auth, logout } = useAuth();
  const { cart } = useCart();
  const { search, setSearch, selectedCategory, setSelectedCategory } = useCatalog();
  const navigate = useNavigate();
  const location = useLocation();

  const isManufacturer = auth.user?.role === UserRole.MANUFACTURER;
  const isShopOwner = auth.user?.role === UserRole.SHOP_OWNER;
  const isAdmin = auth.user?.role === UserRole.ADMIN;
  const isGuest = !auth.user;

  const showProcurementTools = isGuest || isShopOwner;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className={`bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm transition-all duration-300 ${
        isManufacturer ? 'border-t-4 border-t-slate-800' : 
        isAdmin ? 'border-t-4 border-t-indigo-600' : 
        'border-t-4 border-t-blue-600'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16 gap-6">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className={`p-1.5 rounded-lg transition-colors ${
              isManufacturer ? 'bg-slate-800 text-white' : 
              isAdmin ? 'bg-indigo-600 text-white' : 
              'bg-blue-600 text-white'
            }`}>
              <Icons.Box className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">{APP_NAME}</span>
              {auth.user && (
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {auth.user.role.replace('_', ' ')} PORTAL
                </span>
              )}
            </div>
          </Link>

          {showProcurementTools && (
            <div className="flex-1 max-w-xl relative group ml-2">
              <input
                type="text"
                placeholder="Search components or brands..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (location.pathname !== '/') navigate('/');
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-2 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          )}

          <nav className="hidden lg:flex items-center gap-8 flex-shrink-0 ml-auto mr-4">
            {isManufacturer && (
              <>
                <Link to="/" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Dashboard</Link>
                <Link to="/orders" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Fulfillment</Link>
              </>
            )}
            {isShopOwner && (
              <>
                <Link to="/" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Marketplace</Link>
                <Link to="/orders" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Orders</Link>
              </>
            )}
            {isAdmin && (
              <>
                <Link to="/admin" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Verification Queue</Link>
                <Link to="/" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Platform Stats</Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4 flex-shrink-0">
            {auth.user ? (
              <div className="flex items-center gap-4">
                {isShopOwner && (
                  <Link to="/cart" className="relative p-2.5 bg-slate-50 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95">
                    <Icons.ShoppingCart className="w-6 h-6" />
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                        {cart.length}
                      </span>
                    )}
                  </Link>
                )}
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <Link to="/profile" className="hidden sm:flex flex-col items-end hover:opacity-70 transition-opacity">
                  <span className="text-sm font-black text-slate-900 leading-none">{auth.user.companyName}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">My Account</span>
                </Link>
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Logout"
                >
                  <Icons.XCircle className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 px-4 py-2 transition-colors">Sign In</Link>
                <Link to="/register" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">Start Trading</Link>
              </div>
            )}
          </div>
        </div>

        {showProcurementTools && (
          <div className="bg-slate-50 border-t border-slate-200 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="max-w-7xl mx-auto px-4 flex items-center h-11 gap-2">
              <button 
                onClick={() => {
                  setSelectedCategory('All');
                  if (location.pathname !== '/') navigate('/');
                }}
                className={`px-5 h-full text-[10px] font-black uppercase tracking-[0.15em] transition-all border-b-2 whitespace-nowrap flex items-center ${
                  selectedCategory === 'All' 
                  ? 'border-blue-600 text-blue-600 bg-white shadow-[0_4px_0_-2px_rgba(37,99,235,1)]' 
                  : 'border-transparent text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All Components
              </button>
              {CATEGORIES.map(c => (
                <button 
                  key={c}
                  onClick={() => {
                    setSelectedCategory(c);
                    if (location.pathname !== '/') navigate('/');
                  }}
                  className={`px-5 h-full text-[10px] font-black uppercase tracking-[0.15em] transition-all border-b-2 whitespace-nowrap flex items-center ${
                    selectedCategory === c 
                    ? 'border-blue-600 text-blue-600 bg-white shadow-[0_4px_0_-2px_rgba(37,99,235,1)]' 
                    : 'border-transparent text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-950 text-slate-400 py-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6 text-white">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Icons.Box className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tighter">{APP_NAME}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              The professional standard in B2B electronics trade. Our platform powers global supply chains with verified quality and direct manufacturer access.
            </p>
          </div>
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8">Supply Network</h4>
            <ul className="text-sm space-y-4">
              <li><Link to="/register" className="hover:text-white transition-colors">Manufacturer Onboarding</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Vendor Verification</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Wholesale Pricing Guide</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8">Ecosystem</h4>
            <ul className="text-sm space-y-4">
              <li><Link to="/" className="hover:text-white transition-colors">Marketplace Overview</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Order Management API</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Real-time Inventory Sync</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8">Corporate</h4>
            <p className="text-sm leading-relaxed mb-6 text-slate-500">
              Silicon Valley HQ<br />
              1201 Tech Park, CA 94103<br />
              United States
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 cursor-pointer transition-colors">
                 <Icons.Users className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 cursor-pointer transition-colors">
                 <Icons.History className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-20 pt-8 border-t border-slate-900 text-[10px] font-black text-center uppercase tracking-[0.3em] text-slate-600">
          &copy; {new Date().getFullYear()} ELECTRATRADE GLOBAL NETWORK. ENTERPRISE GRADE.
        </div>
      </footer>
    </div>
  );
};

const App = () => {
  const [auth, setAuth] = useState({ user: null, token: null, loading: true });
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    initializeDB();
    const session = db.getSession();
    if (session) {
      setAuth({ user: session.user, token: session.token, loading: false });
    } else {
      setAuth(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = async (email: string) => {
    const session = await api.auth.login(email);
    setAuth({ user: session.user, token: session.token, loading: false });
  };

  const logout = () => {
    api.auth.logout();
    setAuth({ user: null, token: null, loading: false });
    setCart([]);
  };

  const register = async (data: any) => {
    await api.auth.register(data);
  };

  const addToCart = (item: any) => {
    setCart((prev: any[]) => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i => i.productId === item.productId 
          ? { ...i, quantity: i.quantity + item.quantity } 
          : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (pid: string) => setCart((prev: any[]) => prev.filter(i => i.productId !== pid));
  const clearCart = () => setCart([]);
  const updateQuantity = (pid: string, qty: number) => {
    setCart((prev: any[]) => prev.map(i => i.productId === pid ? { ...i, quantity: Math.max(1, qty) } : i));
  };

  if (auth.loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <span className="mt-6 font-black uppercase text-[10px] tracking-[0.5em] text-slate-400">Initializing Network</span>
    </div>
  );

  return (
    <AuthContext.Provider value={{ auth, login, logout, register, setAuth }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}>
        <CatalogContext.Provider value={{ search, setSearch, selectedCategory, setSelectedCategory }}>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={
                  auth.user?.role === UserRole.MANUFACTURER ? <ManufacturerDashboard /> :
                  auth.user?.role === UserRole.ADMIN ? <AdminPanel /> :
                  <ShopCatalog />
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/catalog" element={<ShopCatalog />} />
                <Route path="/manufacturer/:id" element={<ManufacturerProfile />} />
                <Route path="/profile" element={auth.user ? <ProfilePage /> : <Navigate to="/login" />} />
                <Route path="/cart" element={auth.user?.role === UserRole.SHOP_OWNER ? <CartPage /> : <Navigate to="/login" />} />
                <Route path="/orders" element={auth.user ? <OrdersHistory /> : <Navigate to="/login" />} />
                <Route path="/admin" element={auth.user?.role === UserRole.ADMIN ? <AdminPanel /> : <Navigate to="/" />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </Router>
        </CatalogContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
