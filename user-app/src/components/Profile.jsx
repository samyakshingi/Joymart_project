import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

export default function Profile({ userPhone, onLogout }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await api.get(`/users/${userPhone}`);
        setUser(userRes.data);
        
        const ordersRes = await api.get(`/users/${userPhone}/orders`);
        setOrders(ordersRes.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (userPhone) fetchProfile();
  }, [userPhone]);

  if (isLoading) {
    return <div className="text-center py-20 text-slate-400 font-bold">Loading your profile...</div>;
  }

  if (!user) {
    return <div className="text-center py-20 text-slate-400 font-bold">Profile not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-black text-3xl shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{user.name}</h1>
            <p className="text-slate-500 font-bold mt-1">+91 {user.phone}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="px-6 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Address Details */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          Saved Delivery Address
        </h2>
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <p className="font-bold text-slate-900 text-lg">{user.flat_number}</p>
          <p className="font-semibold text-slate-500 mt-1">{user.society?.name}</p>
        </div>
      </div>

      {/* Previous Orders */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          Previous Orders
        </h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-bold">You haven't placed any orders yet.</p>
            <Link to="/" className="inline-block mt-4 text-emerald-600 font-black hover:text-emerald-700">Start Shopping →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} onClick={() => setSelectedOrder(order)} className="p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 group cursor-pointer shadow-sm hover:shadow-md">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-black text-slate-900">Order #{order.id}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                      order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-400">
                    {new Date(order.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-sm font-semibold text-slate-500 mt-2">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-lg font-black text-slate-900">₹{order.total_amount}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{order.payment_method}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <div>
                <h3 className="font-black text-xl text-slate-900">Order #{selectedOrder.id}</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">{new Date(selectedOrder.order_date).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto hide-scrollbar space-y-6">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                          {item.product?.image_url ? <img src={item.product.image_url} className="w-8 h-8 object-contain" alt="" /> : <span className="text-slate-300 font-black">?</span>}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 line-clamp-1">{item.product?.name || 'Unknown Product'}</p>
                          <p className="text-xs font-bold text-slate-500">{item.quantity} × ₹{item.price_at_purchase}</p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">₹{(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.delivery_instructions && (
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Instructions</h4>
                  <p className="bg-amber-50 border border-amber-100 text-amber-800 text-sm font-bold p-4 rounded-xl">{selectedOrder.delivery_instructions}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Bill Summary</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-sm font-bold">
                  {selectedOrder.applied_coupon && (
                    <div className="flex justify-between text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      <span>Coupon Applied</span>
                      <span className="uppercase tracking-widest text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded">{selectedOrder.applied_coupon}</span>
                    </div>
                  )}
                  {selectedOrder.tip_amount > 0 && (
                    <div className="flex justify-between text-slate-600 px-2">
                      <span>Rider Tip</span>
                      <span>₹{selectedOrder.tip_amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg text-slate-900 px-2 pt-2 border-t border-slate-200 mt-2">
                    <span className="font-black">Total Paid</span>
                    <span className="font-black">₹{selectedOrder.total_amount}</span>
                  </div>
                  <div className="text-[10px] text-center text-slate-400 uppercase tracking-widest mt-2">
                    Paid via {selectedOrder.payment_method}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button onClick={() => setSelectedOrder(null)} className="w-full py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-colors shadow-md hover:-translate-y-0.5">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
