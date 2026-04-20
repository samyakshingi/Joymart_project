import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Home({ addToCart, decreaseQuantity, cart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [frequentProducts, setFrequentProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get(`/products`);
        const available = response.data.filter(p => p.is_available);
        
        const grouped = available.reduce((acc, product) => {
          if (!acc[product.category]) acc[product.category] = [];
          acc[product.category].push(product);
          return acc;
        }, {});
        
        setCategories(grouped);
        setProducts(available);
        
        const savedPhone = localStorage.getItem('joymart_phone');
        if (savedPhone) {
          try {
            const freqRes = await api.get(`/orders/frequent/${savedPhone}`);
            setFrequentProducts(freqRes.data.filter(p => p.is_available));
          } catch(err) {}
        }

        try {
          const trendRes = await api.get(`/products/trending`);
          setTrendingProducts(trendRes.data.filter(p => p.is_available));
        } catch(err) {}
      } catch (error) {
        console.error('Failed to fetch products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getQuantityInCart = (productId) => {
    const item = cart.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const categoryNames = ['All', ...Object.keys(categories)];
  
  const displayedProducts = (activeCategory === 'All' 
    ? products 
    : categories[activeCategory] || []
  ).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderProductCard = (product, isCarousel = false) => {
    const qty = getQuantityInCart(product.id);
    return (
      <div key={product.id} className={`bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group snap-start ${isCarousel ? 'min-w-[160px] sm:min-w-[200px] flex-shrink-0' : ''}`}>
        <div className="h-40 bg-slate-50 flex items-center justify-center p-6 relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-slate-300 font-bold text-xl">?</div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between bg-white z-10">
          <div>
            <h3 className="font-bold text-slate-800 leading-tight mb-1 text-sm line-clamp-2">{product.name}</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{product.category}</p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              {product.discounted_price ? (
                <>
                  <span className="text-xs text-slate-400 line-through">₹{product.price}</span>
                  <span className="font-black text-slate-900 text-lg leading-none">₹{product.discounted_price}</span>
                </>
              ) : (
                <span className="font-black text-slate-900 text-lg">₹{product.price}</span>
              )}
            </div>
            {qty === 0 ? (
              <button onClick={() => addToCart(product)} className="w-10 h-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-full flex items-center justify-center font-black transition-all shadow-sm hover:shadow-emerald-500/30">
                +
              </button>
            ) : (
              <div className="flex items-center bg-emerald-500 text-white rounded-full p-1 shadow-md shadow-emerald-500/20 animate-fade-in">
                <button onClick={() => decreaseQuantity(product.id)} className="w-7 h-7 flex items-center justify-center font-black bg-white/20 hover:bg-white/40 rounded-full transition-colors">-</button>
                <span className="w-6 text-center font-black text-sm">{qty}</span>
                <button onClick={() => addToCart(product)} className="w-7 h-7 flex items-center justify-center font-black bg-white/20 hover:bg-white/40 rounded-full transition-colors">+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden flex items-center justify-between">
        <div className="relative z-10 max-w-lg">
          <span className="inline-block py-1 px-4 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black tracking-widest uppercase mb-6 border border-emerald-500/30">Lightning Fast</span>
          <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight leading-[1.1]">Groceries delivered in <span className="text-emerald-400">minutes.</span></h1>
        </div>
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-30 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-900 z-10"></div>
           <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle fill="#10b981" cx="2" cy="2" r="2"></circle></pattern></defs><rect x="0" y="0" width="100%" height="100%" fill="url(#dots)"></rect></svg>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm animate-pulse">
              <div className="bg-slate-100 h-32 rounded-2xl mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-slate-100 rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar / Category Pills */}
          <div className="w-full md:w-64 flex-shrink-0 relative md:sticky md:top-28 z-30 bg-[#F8FAFC]/90 backdrop-blur-md pt-2 pb-4 md:py-0 md:bg-transparent">
            <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-4 pl-2 hidden md:block">Categories</h3>
            <div className="flex md:flex-col gap-2 overflow-x-auto hide-scrollbar">
              {categoryNames.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 text-left px-5 py-3.5 rounded-2xl font-black text-sm transition-all ${
                    activeCategory === cat 
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.02]' 
                      : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 w-full min-w-0">
            <div className="sticky top-20 z-20 bg-[#F8FAFC]/90 backdrop-blur-md pb-6 pt-2 mb-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input
                  type="text"
                  placeholder="Search for groceries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 shadow-sm transition-all font-bold text-slate-900 placeholder:text-slate-400 text-lg"
                />
              </div>
            </div>

            {frequentProducts.length > 0 && searchQuery === '' && activeCategory === 'All' && (
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Buy It Again
                </h2>
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x">
                  {frequentProducts.map(p => renderProductCard(p, true))}
                </div>
              </div>
            )}

            {trendingProducts.length > 0 && searchQuery === '' && activeCategory === 'All' && (
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  Trending Now
                </h2>
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x">
                  {trendingProducts.map(p => renderProductCard(p, true))}
                </div>
              </div>
            )}

            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">{searchQuery ? 'Search Results' : activeCategory}</h2>
            
            {displayedProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold text-lg">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {displayedProducts.map(p => renderProductCard(p, false))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
