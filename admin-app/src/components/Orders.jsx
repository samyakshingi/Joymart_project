import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function Orders() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-200 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live Operations Board</h2>
          <p className="text-sm text-slate-500 font-bold mt-1">Manage orders by moving them across stages.</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-900 px-5 py-2.5 rounded-full shadow-lg">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-black text-white tracking-widest uppercase">Live Sync</span>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x">
        {columns.map(status => {
          const columnOrders = orders.filter(o => o.status === status).sort((a, b) => b.id - a.id);
          const headerColors = getColumnColor(status);
          
          return (
            <div key={status} className="flex-shrink-0 w-80 flex flex-col bg-slate-100/50 rounded-[2rem] border border-slate-200 overflow-hidden snap-start">
              <div className={`p-4 border-b ${headerColors} sticky top-0 z-10 flex justify-between items-center`}>
                <h3 className="font-black text-sm uppercase tracking-widest">{status}</h3>
                <span className="bg-white/50 text-inherit text-xs font-black px-2.5 py-1 rounded-lg border border-white/40 shadow-sm">{columnOrders.length}</span>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4 hide-scrollbar">
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

                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="w-full text-sm font-black text-slate-700 border-2 border-slate-100 rounded-xl px-4 py-3 bg-white focus:border-emerald-500 focus:ring-0 cursor-pointer appearance-none text-center hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        <option value="Pending">Move to Pending</option>
                        <option value="Accepted">Accept Order</option>
                        <option value="OutForDelivery">Send for Delivery</option>
                        <option value="Completed">Mark Completed</option>
                        <option value="Cancelled">Cancel Order</option>
                      </select>
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
