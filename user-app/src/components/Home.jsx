import React, { useState, useEffect } from 'react';
import api from '../api';
import { useTranslation } from 'react-i18next';

export default function Home({ addToCart, decreaseQuantity, cart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [frequentProducts, setFrequentProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [banners, setBanners] = useState([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [subModalProduct, setSubModalProduct] = useState(null);
  const [subForm, setSubForm] = useState({ frequency: 'Daily', quantity: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

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

    const fetchBanners = async () => {
      try {
        const res = await api.get('/banners');
        setBanners(res.data);
      } catch(err) {}
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setActiveBannerIndex(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const scrollToProduct = (productId) => {
    const el = document.getElementById(`product-${productId}`);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Highlight the product
      el.classList.add('ring-4', 'ring-emerald-500', 'ring-offset-4');
      setTimeout(() => el.classList.remove('ring-4', 'ring-emerald-500', 'ring-offset-4'), 3000);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subModalProduct) return;
    const phone = localStorage.getItem('joymart_phone');
    if (!phone) {
      alert("Please login first to subscribe.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const userRes = await api.get(`/users/${phone}`);
      await api.post(`/subscriptions`, {
        user_id: userRes.data.id,
        product_id: subModalProduct.id,
        frequency: subForm.frequency,
        quantity: parseInt(subForm.quantity)
      });
      alert('Subscription created successfully!');
      setSubModalProduct(null);
      setSubForm({ frequency: 'Daily', quantity: 1 });
    } catch (err) {
      console.error(err);
      alert('Failed to create subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div id={`product-${product.id}`} key={product.id} className={`bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group snap-start ${isCarousel ? 'min-w-[160px] sm:min-w-[200px] flex-shrink-0' : ''}`}>
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
            <div className="flex flex-col items-end gap-2">
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
          <button 
            onClick={() => setSubModalProduct(product)}
            className="mt-3 w-full border-2 border-blue-100 text-blue-600 font-black text-xs py-2 rounded-xl hover:bg-blue-50 transition-colors uppercase tracking-widest flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Subscribe
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Dynamic Banner Carousel */}
      {banners.length > 0 ? (
        <div className="relative group">
          <div className="bg-slate-900 rounded-[2.5rem] h-64 sm:h-[400px] text-white shadow-2xl relative overflow-hidden flex items-center">
            {banners.map((banner, idx) => (
              <div 
                key={banner.id} 
                className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-between cursor-pointer ${idx === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                onClick={() => banner.linked_product_id && scrollToProduct(banner.linked_product_id)}
              >
                <img src={banner.image_url} alt="Promotion" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {banners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {banners.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveBannerIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${idx === activeBannerIndex ? 'w-8 bg-emerald-400' : 'w-2 bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10 max-w-lg">
            <span className="inline-block py-1 px-4 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black tracking-widest uppercase mb-6 border border-emerald-500/30">Lightning Fast</span>
            <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight leading-[1.1]">Groceries delivered in <span className="text-emerald-400">minutes.</span></h1>
          </div>
        </div>
      )}

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

      {/* Subscription Modal */}
      {subModalProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <div>
                <h3 className="font-black text-xl text-slate-900">Subscribe</h3>
                <p className="text-xs font-bold text-slate-500 mt-1 line-clamp-1">{subModalProduct.name}</p>
              </div>
              <button onClick={() => setSubModalProduct(null)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold">✕</button>
            </div>
            
            <form onSubmit={handleSubscribe} className="p-6 space-y-6">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold p-3 rounded-xl flex gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <p>Subscriptions are deducted from your JoyMart Wallet automatically.</p>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Frequency</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Daily', 'Weekly'].map(freq => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setSubForm({...subForm, frequency: freq})}
                      className={`py-3 rounded-xl font-black text-sm border-2 transition-all ${
                        subForm.frequency === freq ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Quantity per delivery</label>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setSubForm(p => ({...p, quantity: Math.max(1, p.quantity - 1)}))} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 font-black text-xl hover:bg-slate-200 transition-colors">-</button>
                  <span className="flex-1 text-center font-black text-2xl text-slate-900">{subForm.quantity}</span>
                  <button type="button" onClick={() => setSubForm(p => ({...p, quantity: p.quantity + 1}))} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 font-black text-xl hover:bg-slate-200 transition-colors">+</button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 text-sm">Estimated Cost</span>
                <span className="font-black text-slate-900 text-xl">₹{((subModalProduct.discounted_price || subModalProduct.price) * subForm.quantity).toFixed(2)} / {subForm.frequency.toLowerCase()}</span>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/30 disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Subscription'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
