import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_percentage: '',
    once_per_user: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCoupon, setExpandedCoupon] = useState(null);
  const [usageData, setUsageData] = useState({});
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this coupon?`)) return;
    try {
      await api.put(`/coupons/${id}/toggle_status`);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} coupon.`);
    }
  };

  const fetchUsage = async (code) => {
    if (expandedCoupon === code) {
      setExpandedCoupon(null);
      return;
    }
    setExpandedCoupon(code);
    setIsLoadingUsage(true);
    try {
      const res = await api.get(`/coupons/${code}/usage`);
      setUsageData(prev => ({ ...prev, [code]: res.data }));
    } catch (err) {
      console.error("Failed to fetch usage:", err);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount_percentage) return;
    
    setIsSubmitting(true);
    try {
      await api.post('/coupons', {
        code: newCoupon.code.toUpperCase(),
        discount_percentage: parseInt(newCoupon.discount_percentage),
        once_per_user: newCoupon.once_per_user,
        is_active: true
      });
      setNewCoupon({ code: '', discount_percentage: '', once_per_user: false });
      fetchCoupons();
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
          
          <div className="flex items-center gap-3 ml-2 mt-4">
            <input type="checkbox" id="once_per_user" checked={newCoupon.once_per_user} onChange={e => setNewCoupon({...newCoupon, once_per_user: e.target.checked})} className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500 bg-slate-100 border-slate-300" />
            <label htmlFor="once_per_user" className="text-sm font-bold text-slate-600">Valid Once Per User Only</label>
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

      <div className="mt-10 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        <h2 className="text-2xl font-black text-slate-900 mb-6">Currently Active Coupons</h2>
        <div className="space-y-4">
          {coupons.filter(c => c.is_active).length === 0 ? (
            <p className="text-slate-400 font-bold">No active coupons found.</p>
          ) : (
            coupons.filter(c => c.is_active).map(c => (
              <div key={c.id} className="bg-emerald-50 rounded-xl border border-emerald-100 overflow-hidden">
                <div className="flex justify-between items-center p-4">
                  <div className="cursor-pointer" onClick={() => fetchUsage(c.code)}>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-emerald-900 text-lg">{c.code}</span>
                      {c.once_per_user && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">1-Time</span>}
                      <span className={`text-[10px] transition-transform ${expandedCoupon === c.code ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                    <span className="inline-block mt-1 bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-1 rounded">{c.discount_percentage}% OFF</span>
                  </div>
                  <button onClick={() => handleToggleStatus(c.id, c.is_active)} className="text-amber-600 hover:text-amber-800 font-bold text-sm bg-white px-3 py-1.5 rounded-lg border border-amber-200 transition-colors">Deactivate</button>
                </div>
                {expandedCoupon === c.code && (
                  <div className="bg-white/60 p-4 border-t border-emerald-100 animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Usage Analytics</h4>
                    {isLoadingUsage && !usageData[c.code] ? (
                      <div className="flex justify-center py-4"><div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div></div>
                    ) : (usageData[c.code]?.length === 0 ? (
                      <p className="text-xs font-bold text-slate-400 italic">This coupon has not been used yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {usageData[c.code].map((use, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                            <div>
                              <p className="text-xs font-black text-slate-800">{use.user_name}</p>
                              <p className="text-[10px] font-bold text-slate-400">{use.user_phone}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-emerald-600">₹{use.total_amount}</p>
                              <p className="text-[8px] font-bold text-slate-400">{new Date(use.order_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-300"></div>
        <h2 className="text-xl font-black text-slate-900 mb-6 text-slate-500">Previously Active Coupons</h2>
        <div className="space-y-4">
          {coupons.filter(c => !c.is_active).length === 0 ? (
            <p className="text-slate-400 font-bold">No inactive coupons found.</p>
          ) : (
            coupons.filter(c => !c.is_active).map(c => (
              <div key={c.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-500 text-lg line-through decoration-slate-300">{c.code}</span>
                    {c.once_per_user && <span className="bg-slate-200 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">1-Time</span>}
                  </div>
                  <span className="inline-block mt-1 bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">{c.discount_percentage}% OFF</span>
                </div>
                <button onClick={() => handleToggleStatus(c.id, c.is_active)} className="text-emerald-600 hover:text-emerald-800 font-bold text-sm bg-white px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors">Activate</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
