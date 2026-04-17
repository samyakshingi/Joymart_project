import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Checkout from './components/Checkout';
import Tracking from './components/Tracking';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  const [cart, setCart] = useState([]); 
  const [isBumping, setIsBumping] = useState(false);

  const triggerBump = () => {
    setIsBumping(true);
    setTimeout(() => setIsBumping(false), 300);
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Router>
      <ScrollToTop />
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
                <Link to="/tracking" className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors hidden sm:block">
                  Track Order
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
            <Route path="/" element={<Home addToCart={addToCart} decreaseQuantity={decreaseQuantity} cart={cart} />} />
            <Route path="/checkout" element={<Checkout cart={cart} addToCart={addToCart} decreaseQuantity={decreaseQuantity} removeFromCart={removeFromCart} clearCart={clearCart} cartTotal={cartTotal} />} />
            <Route path="/tracking" element={<Tracking />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
