import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data);
      
      const statRes = await axios.get(`${API_URL}/analytics/today`);
      setAnalytics(statRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const columns = ['Pending', 'Accepted', 'OutForDelivery', 'Completed'];
  
  const getColumnColor = (status) => {
    switch (status) {
      case 'Pending': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'Accepted': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'OutForDelivery': return 'border-purple-200 bg-purple-50 text-purple-800';
      case 'Completed': return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      default: return 'border-slate-200 bg-slate-50 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex flex-col lg:flex-row items-center justify-between bg-white p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 shrink-0 relative overflow-hidden gap-3 sm:gap-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        <div className="flex justify-between items-center w-full lg:w-auto">
          <div className="text-left">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Live Operations</h2>
            <p className="text-sm text-slate-500 font-bold mt-1 hidden sm:block">Manage orders by moving them across stages.</p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-lg shrink-0 lg:hidden">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-white tracking-widest uppercase">Sync</span>
          </div>
        </div>
        
        {analytics && (
          <div className="flex justify-between sm:justify-center gap-2 sm:gap-4 w-full lg:w-auto flex-1">
            <div className="bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center flex-1">
              <div className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Rev</div>
              <div className="text-sm sm:text-2xl font-black text-emerald-600">₹{analytics.total_revenue.toFixed(0)}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center flex-1">
              <div className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Orders</div>
              <div className="text-sm sm:text-2xl font-black text-blue-600">{analytics.total_orders}</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center flex-1">
              <div className="text-[8px] sm:text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5 sm:mb-1">Stock</div>
              <div className="text-sm sm:text-2xl font-black text-amber-600">{analytics.out_of_stock_count}</div>
            </div>
          </div>
        )}

        <div className="hidden lg:flex items-center space-x-3 bg-slate-900 px-5 py-2.5 rounded-full shadow-lg shrink-0">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-black text-white tracking-widest uppercase">Live Sync</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row gap-6 sm:gap-6 overflow-y-auto sm:overflow-x-auto pb-4 hide-scrollbar sm:snap-x px-4 sm:px-0">
        {columns.map(status => {
          const columnOrders = orders.filter(o => o.status === status).sort((a, b) => b.id - a.id);
          const headerColors = getColumnColor(status);
          
          return (
            <div key={status} className="flex-shrink-0 w-full sm:w-80 flex flex-col bg-slate-100/50 rounded-[2rem] border border-slate-200 overflow-hidden sm:snap-center lg:snap-start">
              <div className={`p-4 border-b ${headerColors} sticky top-0 z-10 flex justify-between items-center`}>
                <h3 className="font-black text-sm uppercase tracking-widest">{status}</h3>
                <span className="bg-white/50 text-inherit text-xs font-black px-2.5 py-1 rounded-lg border border-white/40 shadow-sm">{columnOrders.length}</span>
              </div>
              
              <div className="flex-1 p-4 sm:overflow-y-auto space-y-4 hide-scrollbar">
                {columnOrders.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-bold text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-white/30">
                    No orders here
                  </div>
                ) : (
                  columnOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all cursor-default group">
                      <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Order ID</span>
                          <span className="font-black text-slate-900 text-xl">#{order.id}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total</span>
                          <span className="font-black text-emerald-600 text-xl">₹{order.total_amount}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs font-bold text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} Items</span>
                        <span className="text-slate-400">•</span>
                        <span>User ID: {order.user_id}</span>
                      </div>

                      {order.status === 'Pending' && (
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => updateStatus(order.id, 'Accepted')} className="flex-[2] py-3 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 rounded-xl font-bold text-sm transition-colors">
                            Accept
                          </button>
                          <button onClick={() => updateStatus(order.id, 'Cancelled')} className="flex-1 py-3 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors">
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'Accepted' && (
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => updateStatus(order.id, 'OutForDelivery')} className="flex-[2] py-3 bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100 rounded-xl font-bold text-sm transition-colors">
                            Send for Delivery
                          </button>
                          <button onClick={() => updateStatus(order.id, 'Cancelled')} className="flex-1 py-3 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors">
                            Cancel
                          </button>
                        </div>
                      )}

                      {order.status === 'OutForDelivery' && (
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => updateStatus(order.id, 'Completed')} className="flex-[2] py-3 bg-purple-50 text-purple-700 border-2 border-purple-200 hover:bg-purple-100 rounded-xl font-bold text-sm transition-colors">
                            Mark Delivered
                          </button>
                          <button onClick={() => updateStatus(order.id, 'Cancelled')} className="flex-1 py-3 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors">
                            Cancel
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'Completed' && (
                        <div className="mt-4 py-3 bg-slate-50 text-slate-500 border-2 border-slate-100 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                          Order Completed
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
