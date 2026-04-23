import React, { useState, useEffect } from 'react';
import api from './api';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Checkout from './components/Checkout';
import Tracking from './components/Tracking';
import Login from './components/Login';
import Profile from './components/Profile';
import { About, Privacy, Terms } from './components/Legal';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('joymart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }); 
  const [isBumping, setIsBumping] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem('joymart_phone') || '');

  useEffect(() => {
    localStorage.setItem('joymart_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const fetchStatus = () => {
      api.get('/store/status')
        .then(res => setIsStoreOpen(res.data.is_open))
        .catch(err => console.error(err));
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const triggerBump = () => {
    setIsBumping(true);
    setTimeout(() => setIsBumping(false), 300);
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_count) {
          alert(`Only ${product.stock_count} ${product.name}(s) available in stock!`);
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stock_count <= 0) {
        alert(`${product.name} is out of stock!`);
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
    triggerBump();
  };

  const decreaseQuantity = (productId) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.product.id !== productId);
    });
    triggerBump();
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.discounted_price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    localStorage.removeItem('joymart_phone');
    setUserPhone('');
    window.location.href = '/';
  };

  return (
    <Router>
      <ScrollToTop />
      {!isStoreOpen && (
        <div className="bg-red-600 text-white text-center font-black py-2.5 px-4 sticky top-0 z-[60] shadow-md tracking-widest text-sm uppercase">
          ⚠️ STORE IS CURRENTLY CLOSED. WE ARE NOT ACCEPTING NEW ORDERS. ⚠️
        </div>
      )}
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <nav className="glass sticky top-0 z-50 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="flex justify-between h-20 items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:rotate-12 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <span className="text-3xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors">
                  JoyMart
                </span>
              </Link>
              <div className="flex items-center space-x-4 sm:space-x-8">
                {userPhone && (
                  <Link to="/profile" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors">
                    <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span className="text-sm font-bold hidden sm:block">Account</span>
                  </Link>
                )}
                <Link to="/tracking" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors bg-slate-100 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl sm:rounded-none">
                  <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span className="text-sm font-bold hidden sm:block">Track Order</span>
                </Link>
                <Link to="/checkout" className={`relative flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-2xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30 ${isBumping ? 'scale-110' : 'scale-100'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  <span className="font-bold text-sm hidden sm:block">₹{cartTotal.toFixed(0)}</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black h-6 w-6 flex items-center justify-center rounded-full shadow-md border-2 border-slate-900">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8">
          <Routes>
            <Route path="/login" element={<Login onLogin={(p) => { setUserPhone(p); window.location.href='/'; }} />} />
            <Route path="/" element={userPhone ? <Home addToCart={addToCart} decreaseQuantity={decreaseQuantity} cart={cart} /> : <Login onLogin={setUserPhone} />} />
            <Route path="/checkout" element={userPhone ? <Checkout cart={cart} addToCart={addToCart} decreaseQuantity={decreaseQuantity} removeFromCart={removeFromCart} clearCart={clearCart} cartTotal={cartTotal} isStoreOpen={isStoreOpen} userPhone={userPhone} /> : <Login onLogin={setUserPhone} />} />
            <Route path="/tracking" element={userPhone ? <Tracking /> : <Login onLogin={setUserPhone} />} />
            <Route path="/profile" element={userPhone ? <Profile userPhone={userPhone} onLogout={handleLogout} /> : <Login onLogin={setUserPhone} />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-100 py-12 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">J</div>
              <span className="font-black text-slate-900 text-xl tracking-tighter">JoyMart</span>
            </div>
            <div className="flex gap-8 text-sm font-bold text-slate-400">
              <Link to="/about" className="hover:text-emerald-600 transition-colors">About Us</Link>
              <Link to="/privacy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-emerald-600 transition-colors">Terms of Service</Link>
            </div>
            <p className="text-sm font-bold text-slate-300">© 2026 JoyMart Technologies</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
