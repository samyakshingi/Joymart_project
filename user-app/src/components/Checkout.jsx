import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

export default function Checkout({ cart, addToCart, decreaseQuantity, removeFromCart, clearCart, cartTotal, isStoreOpen }) {
  const navigate = useNavigate();
  const deliveryFee = cartTotal >= 100 ? 0 : 30;
  const finalTotal = cartTotal + deliveryFee;

  const [societies, setSocieties] = useState([]);
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    society_id: '',
    flat_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await axios.get(`${API_URL}/societies`);
        setSocieties(res.data);
      } catch (err) { console.error(err); }
    };
    fetchSocieties();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart is empty");
    setIsSubmitting(true);

    try {
      const userRes = await axios.post(`${API_URL}/users`, {
        phone: formData.phone,
        name: formData.name,
        society_id: parseInt(formData.society_id),
        flat_number: formData.flat_number
      });
      const userId = userRes.data.id;

      const items = cart.map(item => ({ product_id: item.product.id, quantity: item.quantity }));
      await axios.post(`${API_URL}/orders`, { user_id: userId, items });
      
      localStorage.setItem('joymart_phone', formData.phone);
      clearCart();
      navigate('/tracking');
    } catch (err) {
      console.error(err);
      alert("Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center animate-fade-in">
        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8 relative">
          <svg className="w-16 h-16 text-slate-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3">Your cart is feeling light</h2>
        <p className="text-slate-500 mb-10 text-lg font-medium">Add some fresh groceries to get started.</p>
        <Link to="/" className="bg-slate-900 text-white font-black py-4 px-10 rounded-2xl shadow-lg hover:bg-emerald-500 hover:-translate-y-1 transition-all">Browse Catalog</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in">
      {/* Checkout Form */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-900"></div>
          
          <div className="flex items-center gap-4 mb-10 mt-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center font-black text-xl">1</div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Delivery Details</h2>
          </div>
          
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-8">
              <div className="col-span-2 space-y-2 relative">
                <input 
                  required 
                  id="phone" 
                  type="tel" 
                  pattern="[0-9]{10}" 
                  placeholder=" " 
                  value={formData.phone} 
                  onChange={async (e) => {
                    const value = e.target.value;
                    setFormData({...formData, phone: value});
                    if (value.length === 10) {
                      try {
                        const res = await axios.get(`${API_URL}/users/${value}`);
                        if (res.data) {
                          setFormData(prev => ({
                            ...prev,
                            phone: value,
                            name: res.data.name || prev.name,
                            society_id: res.data.society_id || prev.society_id,
                            flat_number: res.data.flat_number || prev.flat_number
                          }));
                        }
                      } catch (err) {}
                    }
                  }} 
                  className="peer w-full bg-transparent border-b-2 border-slate-200 px-2 py-3 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 text-xl" 
                />
                <label htmlFor="phone" className="absolute left-2 -top-3.5 text-xs font-black text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-emerald-500 pointer-events-none">10-Digit Mobile Number</label>
              </div>
              
              <div className="col-span-2 space-y-2 relative">
                <input required id="name" type="text" placeholder=" " value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="peer w-full bg-transparent border-b-2 border-slate-200 px-2 py-3 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 text-xl" />
                <label htmlFor="name" className="absolute left-2 -top-3.5 text-xs font-black text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-emerald-500 pointer-events-none">Full Name</label>
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2 relative mt-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Society</label>
                <select required value={formData.society_id} onChange={e => setFormData({...formData, society_id: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 text-lg cursor-pointer appearance-none">
                  <option value="" disabled>Select Society</option>
                  {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2 relative md:mt-4">
                <label htmlFor="flat" className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Flat Number</label>
                <input required id="flat" type="text" placeholder="e.g. A-101" value={formData.flat_number} onChange={e => setFormData({...formData, flat_number: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 text-lg placeholder:font-medium placeholder:text-slate-300" />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-28">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-8 max-h-[35vh] overflow-y-auto pr-2 hide-scrollbar">
            {cart.map(item => (
              <div key={item.product.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                <div className="flex-1 pr-4">
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.product.name}</h4>
                  <p className="text-slate-500 font-bold text-sm mt-1">₹{item.product.price}</p>
                </div>
                
                <div className="flex items-center bg-white border border-slate-200 rounded-full p-1 shadow-sm shrink-0">
                  <button onClick={() => decreaseQuantity(item.product.id)} className="w-7 h-7 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 rounded-full transition-colors">-</button>
                  <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                  <button onClick={() => addToCart(item.product)} className="w-7 h-7 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 rounded-full transition-colors">+</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>Item Total</span>
              <span className="text-slate-900">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-500">Delivery Partner Fee</span>
              {deliveryFee === 0 ? (
                <span className="text-emerald-500 font-black">FREE</span>
              ) : (
                <span className="text-slate-900">₹{deliveryFee.toFixed(2)}</span>
              )}
            </div>
            {deliveryFee > 0 && (
              <div className="bg-emerald-100/50 border border-emerald-200 p-3 rounded-xl text-center mt-2">
                <p className="text-xs text-emerald-800 font-bold tracking-wide">Add ₹{(100 - cartTotal).toFixed(2)} more for FREE Delivery!</p>
              </div>
            )}
            <div className="border-t-2 border-slate-200 border-dashed pt-4 mt-4 flex justify-between items-center">
              <span className="text-lg font-black text-slate-900">Grand Total</span>
              <span className="text-3xl font-black text-emerald-600">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex gap-4 items-center mb-6">
              <div className="bg-slate-800 p-2 rounded-xl shrink-0">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <p className="text-sm font-medium leading-snug">Pay via <strong className="font-black text-emerald-400">Cash or UPI</strong> when your order arrives at the door.</p>
            </div>
            
            <button 
              type="submit" 
              form="checkout-form"
              disabled={isSubmitting || !isStoreOpen}
              className={`w-full text-white font-black text-xl py-5 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-between group ${(isSubmitting || !isStoreOpen) ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none' : 'bg-emerald-500 hover:bg-emerald-400 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/30'}`}
            >
              {(isSubmitting || !isStoreOpen) ? (
                <span className="w-full text-center">{!isStoreOpen ? 'Store is Closed' : 'Processing...'}</span>
              ) : (
                <>
                  <span>Place Order</span>
                  <span className="flex items-center gap-2">
                    ₹{finalTotal.toFixed(2)}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
