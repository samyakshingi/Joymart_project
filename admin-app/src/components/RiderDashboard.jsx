import React, { useState, useEffect } from 'react';
import api from '../api';

export default function RiderDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/orders');
      // Filter for OutForDelivery on frontend for simplicity, though a dedicated query is better
      const activeDeliveries = res.data.filter(o => o.status === 'OutForDelivery');
      setDeliveries(activeDeliveries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markDelivered = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'Completed' });
      setDeliveries(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error(err);
      alert('Failed to mark as delivered');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 font-bold">Loading deliveries...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-slate-900 mb-6">My Deliveries</h2>
      
      {deliveries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold text-lg mb-2">No active deliveries!</p>
          <p className="text-slate-400 text-sm">Waiting for new orders to be assigned...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map(order => (
            <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                <div>
                  <h3 className="font-black text-xl text-slate-900">Order #{order.id}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-xs">
                      {order.payment_method}
                    </span>
                    <span className="bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-full text-xs">
                      {order.delivery_slot || 'Immediate'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-2xl text-emerald-600">₹{order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="font-bold text-slate-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  {order.user?.name || 'Customer'}
                </p>
                <p className="font-bold text-slate-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  {order.user?.phone || 'N/A'}
                </p>
                <p className="font-bold text-slate-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  {order.user?.flat_number ? `${order.user.flat_number}, ` : ''}{order.user?.society?.name || 'Address N/A'}
                </p>
                {order.delivery_instructions && (
                  <p className="text-sm font-medium text-amber-600 bg-amber-50 p-2 rounded-lg mt-2">
                    Note: {order.delivery_instructions}
                  </p>
                )}
              </div>

              <button 
                onClick={() => markDelivered(order.id)}
                className="w-full bg-slate-900 text-white font-black text-xl py-4 rounded-xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 mt-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                Mark Delivered
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
