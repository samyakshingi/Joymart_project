import React, { useState } from 'react';
import api from '../api';

export default function Coupons() {
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_percentage: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount_percentage) return;
    
    setIsSubmitting(true);
    try {
      await api.post('/coupons', {
        code: newCoupon.code.toUpperCase(),
        discount_percentage: parseInt(newCoupon.discount_percentage),
        is_active: true
      });
      setNewCoupon({ code: '', discount_percentage: '' });
      alert("Coupon created successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to create coupon. Code might already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Coupon Manager</h2>
        <p className="text-slate-500 font-medium mb-8">Create discount codes for your customers.</p>

        <form onSubmit={handleCreateCoupon} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Coupon Code</label>
            <input 
              required 
              type="text" 
              value={newCoupon.code} 
              onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})} 
              className="w-full rounded-2xl border-slate-200 bg-slate-50 px-5 py-4 font-black text-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="e.g. WELCOME20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Discount Percentage (%)</label>
            <input 
              required 
              type="number" 
              min="1" 
              max="100"
              value={newCoupon.discount_percentage} 
              onChange={(e) => setNewCoupon({...newCoupon, discount_percentage: e.target.value})} 
              className="w-full rounded-2xl border-slate-200 bg-slate-50 px-5 py-4 font-black text-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="20"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg ${isSubmitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-1 shadow-slate-200'}`}
          >
            {isSubmitting ? 'Creating...' : 'Create Coupon Code'}
          </button>
        </form>

        <div className="mt-10 p-6 bg-blue-50 rounded-2xl border border-blue-100">
           <h4 className="text-blue-900 font-black text-sm uppercase tracking-widest mb-3">Usage Tips</h4>
           <ul className="space-y-2 text-blue-800 text-sm font-bold">
             <li className="flex gap-2"><span>•</span> Coupons are applied at the final checkout.</li>
             <li className="flex gap-2"><span>•</span> Only one coupon can be used per order.</li>
             <li className="flex gap-2"><span>•</span> Codes are case-insensitive for customers.</li>
           </ul>
        </div>
      </div>
    </div>
  );
}
