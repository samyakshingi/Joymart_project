import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function Tracking() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/orders/tracking/${phone}`);
      setOrders(res.data);
      setHasSearched(true);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setOrders([]);
        setError("No orders found for this mobile number. Make sure you typed it correctly!");
      } else {
        setError("An error occurred while tracking. Our servers might be busy.");
      }
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Pending': 
        return { text: 'Waiting for Confirmation', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' };
      case 'Accepted': 
        return { text: 'Order Accepted & Packing', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' };
      case 'OutForDelivery': 
        return { text: 'Out for Delivery!', color: 'text-emerald-600 bg-emerald-50 border-emerald-300 shadow-emerald-100 shadow-inner animate-pulse', icon: 'M13 10V3L4 14h7v7l9-11h-7z' };
      case 'Completed': 
        return { text: 'Delivered', color: 'text-slate-600 bg-slate-100 border-slate-200', icon: 'M5 13l4 4L19 7' };
      case 'Cancelled': 
        return { text: 'Cancelled', color: 'text-red-600 bg-red-50 border-red-200', icon: 'M6 18L18 6M6 6l12 12' };
      default: 
        return { text: status, color: 'text-slate-600 bg-slate-50 border-slate-200', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-in pb-12">
      <div className="bg-white p-10 sm:p-14 rounded-[2.5rem] shadow-xl border border-slate-100 text-center relative overflow-hidden transform hover:-translate-y-1 transition-transform duration-500">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"></div>
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Where's my order?</h2>
        <p className="text-slate-500 mb-10 font-bold text-lg">Enter your 10-digit mobile number for real-time updates.</p>
        
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
          <input 
            type="tel" 
            required 
            pattern="[0-9]{10}"
            placeholder="Mobile Number" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-black text-xl tracking-widest text-slate-900 text-center shadow-inner placeholder:text-slate-300 placeholder:font-medium placeholder:tracking-normal"
          />
          <button type="submit" disabled={isLoading} className="bg-slate-900 text-white font-black text-lg px-10 py-4 rounded-2xl hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-slate-900">
            {isLoading ? '...' : 'Track'}
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="space-y-8 animate-fade-in">
          {error && (
            <div className="text-center p-6 bg-red-50 border-2 border-dashed border-red-200 rounded-[2rem] text-red-600 font-bold text-lg">
              {error}
            </div>
          )}
          
          {orders.map((order, index) => {
            const statusInfo = getStatusDisplay(order.status);
            
            return (
              <div key={order.id} className="bg-white rounded-[2rem] p-8 shadow-md border border-slate-100 overflow-hidden relative">
                {index === 0 && (
                  <div className="absolute top-6 right-6 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Latest</span>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
                  <div>
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 block">Order ID</span>
                    <h3 className="text-3xl font-black text-slate-900">#{order.id}</h3>
                    <p className="text-slate-500 font-semibold mt-2">{new Date(order.order_date).toLocaleString()}</p>
                  </div>
                  <div className={`px-6 py-3 rounded-2xl border-2 font-black flex items-center gap-3 ${statusInfo.color}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={statusInfo.icon}></path></svg>
                    {statusInfo.text}
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Items</h4>
                  <div className="space-y-4">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-base font-bold bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-slate-700">Product #{item.product_id} <span className="mx-2 text-slate-300 font-medium">x</span> {item.quantity}</span>
                        <span className="text-slate-900">₹{item.price_at_purchase * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-end pt-6 border-t-2 border-slate-100 border-dashed">
                  <span className="text-slate-500 font-bold text-lg">Total Amount Paid<br/><span className="text-sm font-medium text-slate-400">(Cash/UPI on Delivery)</span></span>
                  <span className="text-4xl font-black text-slate-900">₹{order.total_amount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
