import React, { useState, useEffect } from 'react';
import api from '../api';

export default function WalletRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Need to fetch users as well to get name/phone since transaction response only has user_id
      // We will fetch users, then requests, and map them. Or simply fetch all users and build a map.
      const usersRes = await api.get('/users');
      const userMap = {};
      usersRes.data.forEach(u => userMap[u.id] = u);

      const reqRes = await api.get('/admin/wallet/requests');
      const enrichedRequests = reqRes.data.map(req => ({
        ...req,
        user: userMap[req.user_id]
      }));
      setRequests(enrichedRequests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (transactionId) => {
    try {
      await api.put(`/admin/wallet/approve/${transactionId}`);
      alert('Funds approved successfully!');
      setRequests(prev => prev.filter(r => r.id !== transactionId));
    } catch (err) {
      console.error(err);
      alert('Failed to approve request.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 font-bold">Loading requests...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900">Wallet Recharges</h2>
        <span className="bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-full text-sm">
          {requests.length} Pending
        </span>
      </div>
      
      {requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold text-lg mb-2">No pending recharges!</p>
          <p className="text-slate-400 text-sm">All customer wallet requests have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-xl text-slate-900">{req.user?.name || `User #${req.user_id}`}</h3>
                  <p className="text-slate-500 font-bold text-sm mt-1">{req.user?.phone || 'Phone N/A'}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-2xl text-emerald-600">₹{req.amount.toFixed(2)}</span>
                  <p className="text-slate-400 font-bold text-xs mt-1">
                    {new Date(req.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-2 pt-4 border-t border-slate-50 flex gap-3">
                <button 
                  onClick={() => approveRequest(req.id)}
                  className="flex-1 bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30"
                >
                  Approve Funds
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
