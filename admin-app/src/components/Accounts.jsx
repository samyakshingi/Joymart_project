import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Accounts() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('Invoice'); // Invoice or Payment
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTransactions = async (supplierId) => {
    try {
      const res = await api.get(`/suppliers/${supplierId}/transactions`);
      setTransactions(res.data.sort((a, b) => b.id - a.id));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post(`/suppliers/${selectedSupplier.id}/transactions`, {
        amount: parseFloat(amount),
        transaction_type: modalType,
        description
      });
      setAmount('');
      setDescription('');
      setShowModal(false);
      fetchSuppliers();
      fetchTransactions(selectedSupplier.id);
    } catch (err) {
      alert("Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Digital Khata</h2>
        <span className="text-slate-500 font-bold">Manage Supplier Ledgers</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Supplier List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-900 mb-6 flex justify-between items-center">
              Suppliers
              <button className="text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-full uppercase tracking-widest">+ New</button>
            </h3>
            <div className="space-y-2">
              {suppliers.map(s => (
                <button 
                  key={s.id}
                  onClick={() => {
                    setSelectedSupplier(s);
                    fetchTransactions(s.id);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all border-2 ${selectedSupplier?.id === s.id ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black text-slate-900">{s.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{s.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</div>
                      <div className={`font-black ${s.outstanding_balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₹{s.outstanding_balance}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger View */}
        <div className="lg:col-span-8">
          {selectedSupplier ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[60vh] flex flex-col">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black">{selectedSupplier.name}</h3>
                  <p className="text-slate-400 font-bold mt-1">Outstanding: ₹{selectedSupplier.outstanding_balance}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setModalType('Invoice'); setShowModal(true); }} className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-100 transition-colors">Add Bill</button>
                  <button onClick={() => { setModalType('Payment'); setShowModal(true); }} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-emerald-400 transition-colors">Record Payment</button>
                </div>
              </div>

              <div className="flex-1 p-8">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Recent Transactions</h4>
                <div className="space-y-3">
                  {transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <div className="font-black text-slate-900">{t.description || (t.transaction_type === 'Invoice' ? 'Purchased Stock' : 'Paid to Vendor')}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1">{new Date(t.date).toLocaleString()}</div>
                      </div>
                      <div className={`text-lg font-black ${t.transaction_type === 'Invoice' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {t.transaction_type === 'Invoice' ? '+' : '-'} ₹{t.amount}
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && <div className="text-center py-20 text-slate-400 font-bold">No transactions found.</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200 h-full min-h-[60vh] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <svg className="w-20 h-20 mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              <h3 className="text-2xl font-black mb-2">Select a Supplier</h3>
              <p className="font-bold">Choose a vendor from the left to view their ledger.</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">{modalType === 'Invoice' ? 'Add Supplier Bill' : 'Record Payment'}</h3>
              <form onSubmit={handleTransaction} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Amount (₹)</label>
                  <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-xl border-slate-300 px-4 py-3 font-bold" placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-xl border-slate-300 px-4 py-3" placeholder="e.g. Milk Stock 50L" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className={`flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${modalType === 'Invoice' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>
                    {isSubmitting ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
