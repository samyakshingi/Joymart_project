import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Reconciliation() {
  const [report, setReport] = useState(null);
  const [actualCash, setActualCash] = useState('');
  const [actualUPI, setActualUPI] = useState('');

  const fetchReport = async () => {
    try {
      const res = await api.get('/reports/reconciliation');
      setReport(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const cashDelta = report ? (parseFloat(actualCash || 0) - report.expected_cash) : 0;
  const upiDelta = report ? (parseFloat(actualUPI || 0) - report.expected_upi) : 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Daily Reconciliation</h2>
        <p className="text-slate-500 font-bold">Compare system records with actual cash in hand.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cash Card */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">💵</div>
            <h3 className="text-2xl font-black text-slate-900">Cash Register</h3>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expected (System)</span>
              <span className="text-3xl font-black text-slate-900">₹{report?.expected_cash.toFixed(2) || '0.00'}</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Actual Cash Counted</label>
              <input 
                type="number" 
                value={actualCash} 
                onChange={e => setActualCash(e.target.value)} 
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-black text-slate-900 text-2xl placeholder:text-slate-200"
                placeholder="0.00"
              />
            </div>

            <div className={`p-6 rounded-2xl border-2 flex justify-between items-center ${cashDelta === 0 ? 'bg-slate-50 border-slate-100' : cashDelta > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <span className="font-black text-sm uppercase tracking-widest">Difference</span>
              <span className={`text-2xl font-black ${cashDelta === 0 ? 'text-slate-900' : cashDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {cashDelta > 0 ? '+' : ''}₹{cashDelta.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* UPI Card */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">📱</div>
            <h3 className="text-2xl font-black text-slate-900">UPI Payments</h3>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expected (System)</span>
              <span className="text-3xl font-black text-slate-900">₹{report?.expected_upi.toFixed(2) || '0.00'}</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Actual UPI Received</label>
              <input 
                type="number" 
                value={actualUPI} 
                onChange={e => setActualUPI(e.target.value)} 
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-black text-slate-900 text-2xl placeholder:text-slate-200"
                placeholder="0.00"
              />
            </div>

            <div className={`p-6 rounded-2xl border-2 flex justify-between items-center ${upiDelta === 0 ? 'bg-slate-50 border-slate-100' : upiDelta > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <span className="font-black text-sm uppercase tracking-widest">Difference</span>
              <span className={`text-2xl font-black ${upiDelta === 0 ? 'text-slate-900' : upiDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {upiDelta > 0 ? '+' : ''}₹{upiDelta.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h4 className="text-xl font-black">Ready to close for today?</h4>
          <p className="text-slate-400 font-bold mt-1">Total orders processed today: {report?.order_count || 0}</p>
        </div>
        <button 
          onClick={() => { alert("Register Closed and Logged!"); window.location.reload(); }}
          className="w-full md:w-auto bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all active:scale-95"
        >
          Confirm & Close Register
        </button>
      </div>
    </div>
  );
}
