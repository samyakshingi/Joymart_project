import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Wallet({ userPhone }) {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [isRecharging, setIsRecharging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get(`/users/${userPhone}`);
        setUser(userRes.data);
        // Note: Backend might need a GET /wallet/transactions endpoint for user, but we'll mock the history or skip it if it doesn't exist.
        // For now we'll just show the balance.
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (userPhone) fetchData();
  }, [userPhone]);

  const requestRecharge = async (amount) => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return alert('Enter a valid amount');
    
    setIsRecharging(true);
    try {
      await api.post('/wallet/recharge/request', {
        user_id: user.id,
        amount: amt
      });
      alert('Recharge request sent. Please pay the shopkeeper via UPI or Cash to reflect the balance.');
      setRechargeAmount('');
    } catch (err) {
      console.error(err);
      alert('Failed to send recharge request.');
    } finally {
      setIsRecharging(false);
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-slate-400">Loading Wallet...</div>;
  if (!user) return <div className="text-center py-20 font-bold text-slate-400">User not found.</div>;

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      <h2 className="text-3xl font-black text-slate-900 mb-6">My Wallet</h2>

      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <p className="font-bold text-slate-400 uppercase tracking-widest text-sm mb-2">Available Balance</p>
        <h1 className="text-5xl font-black">₹{parseFloat(user.wallet_balance).toFixed(2)}</h1>
        <p className="text-sm font-bold mt-6 opacity-80 text-emerald-400">JoyMart Prepaid Wallet</p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mt-6">
        <h3 className="font-black text-xl text-slate-900 mb-4">Add Funds</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[500, 1000, 2000].map(amt => (
            <button 
              key={amt}
              onClick={() => setRechargeAmount(amt.toString())}
              className={`py-3 rounded-xl font-black text-lg border-2 transition-all ${
                rechargeAmount === amt.toString() ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input 
            type="number" 
            placeholder="Custom Amount" 
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
            className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-emerald-500"
          />
          <button 
            disabled={isRecharging || !rechargeAmount}
            onClick={() => requestRecharge(rechargeAmount)}
            className="px-6 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {isRecharging ? 'Wait...' : 'Request'}
          </button>
        </div>
        <p className="text-xs font-bold text-slate-400 mt-4 text-center">
          Amount will be credited after shopkeeper approves payment.
        </p>
      </div>
    </div>
  );
}
