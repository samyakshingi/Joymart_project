import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [printPreviewOrder, setPrintPreviewOrder] = useState(null);
  const [now, setNow] = useState(Date.now());

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/orders?date=${selectedDate}`);
      setOrders(response.data);
      
      const statRes = await api.get(`/analytics?date=${selectedDate}`);
      setAnalytics(statRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `joymart_orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert("Failed to export data.");
    }
  };

  const handlePrint = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = order.items.map(item => `
      <div style="display: flex; justify-between; margin-bottom: 4px;">
        <span style="flex: 1;">${item.product?.name || 'Product'} x ${item.quantity}</span>
        <span>₹${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    const subtotal = order.items.reduce((sum, i) => sum + (i.price_at_purchase * i.quantity), 0);
    const delivery = subtotal >= 100 ? 0 : 30;
    const discount = order.applied_coupon ? (subtotal - (order.total_amount - order.tip_amount - delivery)) : 0;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>JoyMart Receipt #${order.id}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 10mm; font-size: 12px; line-height: 1.4; color: #000; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .logo { font-size: 20px; font-weight: bold; }
            .details { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          <div class="header">
            <div class="logo">JOYMART</div>
            <div>Fresh Groceries to your Door</div>
            <div>${new Date(order.order_date).toLocaleString()}</div>
          </div>
          <div class="details">
            <div>Order ID: #${order.id}</div>
            <div>Payment: ${order.payment_method}</div>
            <div>Customer: ${order.user?.name || `User ID ${order.user_id}`}</div>
            <div>Address: ${order.user?.flat_number ? `${order.user.flat_number}, ${order.user.society?.name || ''}` : ''}</div>
          </div>
          <div style="margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px;">
            ${itemsHtml}
          </div>
          <div class="summary">
            <div class="total-row"><span>Subtotal:</span> <span>₹${subtotal.toFixed(2)}</span></div>
            ${discount > 0 ? `<div class="total-row" style="color: green;"><span>Discount:</span> <span>-₹${discount.toFixed(2)}</span></div>` : ''}
            <div class="total-row"><span>Delivery:</span> <span>₹${delivery.toFixed(2)}</span></div>
            ${order.tip_amount > 0 ? `<div class="total-row"><span>Rider Tip:</span> <span>₹${order.tip_amount}</span></div>` : ''}
            <div class="total-row" style="font-size: 16px; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px;">
              <span>TOTAL:</span> <span>₹${order.total_amount}</span>
            </div>
          </div>
          <div class="footer">
            Thank you for shopping at JoyMart!<br>Visit us again.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    const timerInterval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [selectedDate]);

  const getTimeElapsed = (orderDate) => {
    const diff = Math.floor((now - new Date(orderDate).getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m ago`;
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
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
            <div className="flex items-center gap-3 mt-1">
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-100 border-none text-xs sm:text-sm font-bold text-slate-600 px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
              <p className="text-sm text-slate-500 font-bold hidden sm:block">Manage orders by moving them across stages.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-lg shrink-0 lg:hidden">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-white tracking-widest uppercase">Sync</span>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs transition-all border border-slate-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export CSV
          </button>
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
                          <div className="flex items-center gap-3">
                            <span className="font-black text-slate-900 text-xl">#{order.id}</span>
                            <button 
                              onClick={() => setPrintPreviewOrder(order)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                              title="Print Bill"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            </button>
                          </div>
                          <p className={`text-[10px] font-black mt-1 ${order.status === 'Pending' && (now - new Date(order.order_date).getTime() > 900000) ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                            {getTimeElapsed(order.order_date)}
                            {order.status === 'Pending' && (now - new Date(order.order_date).getTime() > 900000) && ' ⚠️ ALERT: SLOW'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total</span>
                          <span className="font-black text-emerald-600 text-xl">₹{order.total_amount}</span>
                          {order.tip_amount > 0 && (
                            <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                              + ₹{order.tip_amount} Tip
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {order.delivery_instructions && (
                        <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Instructions</p>
                          <p className="text-xs font-bold text-amber-900">{order.delivery_instructions}</p>
                        </div>
                      )}
                      
                      <div className="text-xs font-bold text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} Items</span>
                        <span className="text-slate-400">•</span>
                        <span className="uppercase tracking-widest text-[9px] bg-slate-200 px-1.5 py-0.5 rounded">{order.payment_method}</span>
                        <span className="text-slate-400">•</span>
                        <span className="truncate max-w-[100px]">{order.user?.name || `User ID ${order.user_id}`}</span>
                      </div>
                      
                      <button 
                        onClick={() => setSelectedOrderDetails(order)}
                        className="w-full mb-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors border border-slate-200"
                      >
                        + More Details
                      </button>

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

      {/* More Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">Order #{selectedOrderDetails.id}</h3>
                <div className="flex items-center gap-2">
                  {selectedOrderDetails.payment_method === 'Cash' && selectedOrderDetails.delivery_otp && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full animate-pulse border border-red-200 shadow-sm">
                      OTP Required for Delivery
                    </span>
                  )}
                  <button onClick={() => setSelectedOrderDetails(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {selectedOrderDetails.payment_method === 'Cash' && selectedOrderDetails.delivery_otp && (
                  <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Handover Security</h4>
                      <p className="text-xs text-red-800 font-medium">Verify this PIN with customer</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-inner border border-red-100">
                      <span className="font-mono text-2xl font-black text-red-700 tracking-widest">{selectedOrderDetails.delivery_otp}</span>
                    </div>
                  </div>
                )}
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Delivery Address</h4>
                  <p className="font-bold text-amber-900 text-lg">{selectedOrderDetails.user?.name || `Customer (ID: ${selectedOrderDetails.user_id})`}</p>
                  <p className="font-semibold text-amber-800 text-sm">{selectedOrderDetails.user?.phone || 'No phone provided'}</p>
                  <p className="font-semibold text-amber-800 text-sm mt-1">
                    {selectedOrderDetails.user?.flat_number ? `${selectedOrderDetails.user.flat_number}, ${selectedOrderDetails.user.society?.name || ''}` : 'Address not provided'}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Bill Details</h4>
                  <div className="space-y-2 mb-4">
                    {selectedOrderDetails.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm font-bold text-slate-700">
                        <span>{item.product?.name || 'Product'} x{item.quantity}</span>
                        <span>₹{(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-3 border-t border-dashed border-slate-200 space-y-2">
                    <div className="flex justify-between text-sm font-bold text-slate-500">
                      <span>Subtotal</span>
                      <span>₹{selectedOrderDetails.items.reduce((sum, i) => sum + (i.price_at_purchase * i.quantity), 0).toFixed(2)}</span>
                    </div>
                    {selectedOrderDetails.applied_coupon && (
                      <div className="flex justify-between text-sm font-bold text-emerald-600">
                        <span>Coupon Discount</span>
                        <span>-₹{(selectedOrderDetails.items.reduce((sum, i) => sum + (i.price_at_purchase * i.quantity), 0) - (selectedOrderDetails.total_amount - selectedOrderDetails.tip_amount - (selectedOrderDetails.items.reduce((sum, i) => sum + (i.price_at_purchase * i.quantity), 0) >= 100 ? 0 : 30))).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-500">
                      <span>Delivery</span>
                      <span>₹{selectedOrderDetails.items.reduce((sum, i) => sum + (i.price_at_purchase * i.quantity), 0) >= 100 ? '0.00' : '30.00'}</span>
                    </div>
                    {selectedOrderDetails.tip_amount > 0 && (
                      <div className="flex justify-between text-sm font-bold text-slate-500">
                        <span>Rider Tip</span>
                        <span>₹{selectedOrderDetails.tip_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-black text-slate-900 pt-2 mt-2 border-t border-slate-200">
                      <span>Total ({selectedOrderDetails.payment_method})</span>
                      <span>₹{selectedOrderDetails.total_amount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printPreviewOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-xl font-black text-slate-900 mb-4">Receipt Preview</h3>
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl font-mono text-xs text-slate-800 max-h-[60vh] overflow-y-auto">
                <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
                  <p className="font-black text-lg">JOYMART</p>
                  <p>Fresh Groceries</p>
                  <p>{new Date(printPreviewOrder.order_date).toLocaleString()}</p>
                </div>
                <div className="border-b border-dashed border-slate-300 pb-4 mb-4 space-y-1">
                  <p>Order ID: #{printPreviewOrder.id}</p>
                  <p>Customer: {printPreviewOrder.user?.name || "Guest"}</p>
                  <p>Address: {printPreviewOrder.user?.flat_number}, {printPreviewOrder.user?.society?.name}</p>
                </div>
                <div className="border-b border-dashed border-slate-300 pb-4 mb-4 space-y-2">
                  {printPreviewOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.product?.name} x {item.quantity}</span>
                      <span>₹{(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-300">
                    <span>TOTAL:</span>
                    <span>₹{printPreviewOrder.total_amount}</span>
                  </div>
                  <p className="text-center mt-4 text-[10px]">Thank you for shopping!</p>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button 
                  onClick={() => setPrintPreviewOrder(null)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handlePrint(printPreviewOrder);
                    setPrintPreviewOrder(null);
                  }}
                  className="flex-1 bg-emerald-500 text-white font-black py-3 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all"
                >
                  Confirm & Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
