import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Subscriptions({ userPhone }) {
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get(`/users/${userPhone}`);
        setUser(userRes.data);
        
        const subsRes = await api.get(`/users/${userRes.data.id}/subscriptions`);
        setSubscriptions(subsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (userPhone) fetchData();
  }, [userPhone]);

  const toggleStatus = async (subId, currentStatus) => {
    try {
      const res = await api.put(`/subscriptions/${subId}/status?is_active=${!currentStatus}`);
      setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status: !currentStatus } : s));
    } catch (err) {
      console.error(err);
      alert('Failed to update subscription status');
    }
  };

  const deleteSub = async (subId) => {
    if (!window.confirm("Are you sure you want to delete this subscription?")) return;
    try {
      await api.delete(`/subscriptions/${subId}`);
      setSubscriptions(prev => prev.filter(s => s.id !== subId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete subscription');
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-slate-400">Loading Subscriptions...</div>;
  if (!user) return <div className="text-center py-20 font-bold text-slate-400">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-black text-slate-900">Subscriptions</h2>
        <span className="bg-blue-100 text-blue-800 font-bold px-4 py-2 rounded-full text-sm">
          {subscriptions.filter(s => s.status).length} Active
        </span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-4">
        <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <h4 className="font-black text-blue-900">Automated Deliveries</h4>
          <p className="text-blue-800 text-sm font-semibold mt-1">Active subscriptions are automatically processed and deducted from your JoyMart Wallet balance. Ensure you have sufficient funds.</p>
        </div>
      </div>
      
      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-slate-100">
          <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <h3 className="font-black text-xl text-slate-900 mb-2">No Subscriptions Yet</h3>
          <p className="text-slate-500 font-bold">Subscribe to daily essentials like milk and bread directly from the catalog!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subscriptions.map(sub => (
            <div key={sub.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border ${sub.status ? 'border-emerald-200' : 'border-slate-200 opacity-70'} flex flex-col transition-colors`}>
              <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    {sub.product?.image_url ? (
                      <img src={sub.product.image_url} alt="" className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="font-black text-slate-300">?</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 line-clamp-1">{sub.product?.name || 'Unknown Product'}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded-md">{sub.frequency}</span>
                      <span className="text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Qty: {sub.quantity}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400">Cost per delivery</span>
                  <span className="font-black text-slate-900 text-xl">₹{((sub.product?.discounted_price || sub.product?.price) * sub.quantity).toFixed(2)}</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleStatus(sub.id, sub.status)}
                    className={`px-4 py-2 rounded-xl font-black text-sm transition-colors ${sub.status ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    {sub.status ? 'Pause' : 'Resume'}
                  </button>
                  <button 
                    onClick={() => deleteSub(sub.id)}
                    className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center font-black transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
