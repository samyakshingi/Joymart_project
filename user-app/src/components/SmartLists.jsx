import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function SmartLists({ userPhone, setCart }) {
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get(`/users/${userPhone}`);
        setUser(userRes.data);
        
        const listsRes = await api.get(`/users/${userRes.data.id}/saved-lists`);
        setLists(listsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (userPhone) fetchData();
  }, [userPhone]);

  const addListToCart = async (list) => {
    try {
      // Fetch full product details for each item to rebuild the cart structure {product: {}, quantity: N}
      // Wait, list.items already has product details populated via the schema `product: Optional[ProductResponse]`. Let's assume it does.
      const newCart = list.items.map(item => ({
        product: item.product,
        quantity: item.quantity
      }));
      setCart(newCart);
      navigate('/checkout');
    } catch (err) {
      console.error(err);
      alert('Failed to load list into cart');
    }
  };

  const deleteList = async (listId) => {
    try {
      await api.delete(`/saved-lists/${listId}`);
      setLists(prev => prev.filter(l => l.id !== listId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete list');
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-slate-400">Loading Smart Lists...</div>;
  if (!user) return <div className="text-center py-20 font-bold text-slate-400">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <h2 className="text-3xl font-black text-slate-900 mb-6">Smart Lists</h2>
      
      {lists.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-slate-100">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          </div>
          <h3 className="font-black text-xl text-slate-900 mb-2">No Saved Lists</h3>
          <p className="text-slate-500 font-bold">You can save your current cart as a list from the Checkout screen!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lists.map(list => (
            <div key={list.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col group hover:border-emerald-500 transition-colors">
              <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-4">
                <div>
                  <h3 className="font-black text-xl text-slate-900">{list.list_name}</h3>
                  <p className="text-sm font-bold text-slate-400 mt-1">{list.items.length} items</p>
                </div>
                <button onClick={() => deleteList(list.id)} className="text-red-400 hover:text-red-600 transition-colors font-black bg-red-50 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
              </div>
              
              <div className="flex-1 space-y-2 mb-6">
                {list.items.slice(0, 3).map(item => (
                  <div key={item.id} className="flex justify-between text-sm font-bold text-slate-600">
                    <span className="line-clamp-1">{item.quantity}x {item.product?.name || 'Unknown'}</span>
                  </div>
                ))}
                {list.items.length > 3 && (
                  <p className="text-xs font-bold text-slate-400 mt-2">+{list.items.length - 3} more items...</p>
                )}
              </div>

              <button 
                onClick={() => addListToCart(list)}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30 group-hover:scale-[1.02]"
              >
                Add List to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
