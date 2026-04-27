import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({
    image_url: '',
    linked_product_id: '',
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const bannerRes = await api.get('/admin/banners');
      setBanners(bannerRes.data);
      const productRes = await api.get('/products');
      setProducts(productRes.data);
    } catch (err) {
      console.error("Failed to fetch banners/products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newBanner,
        linked_product_id: newBanner.linked_product_id ? parseInt(newBanner.linked_product_id) : null
      };
      await api.post('/banners', payload);
      setIsModalOpen(false);
      setNewBanner({ image_url: '', linked_product_id: '', is_active: true });
      fetchData();
    } catch (err) {
      alert("Failed to create banner");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/banners/${id}/status?is_active=${!currentStatus}`);
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      await api.delete(`/banners/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete banner");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Banner Manager</h2>
          <p className="text-slate-500 font-bold">Manage home screen promotions and product deep-links.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 text-white font-black px-6 py-3 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          Add Banner
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map(banner => (
            <div key={banner.id} className={`bg-white rounded-3xl border-2 transition-all overflow-hidden ${banner.is_active ? 'border-slate-100 shadow-sm' : 'border-slate-200 opacity-75'}`}>
              <div className="relative aspect-[21/9] bg-slate-100">
                <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
                {!banner.is_active && (
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                    <span className="bg-white text-slate-900 px-4 py-1.5 rounded-full font-black text-xs tracking-widest uppercase">Inactive</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Linked Product</p>
                  <p className="font-bold text-slate-800">
                    {banner.linked_product_id 
                      ? products.find(p => p.id === banner.linked_product_id)?.name || "Unknown Product"
                      : "None (Image Only)"}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={banner.is_active} 
                        onChange={() => toggleStatus(banner.id, banner.is_active)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                    <span className="text-xs font-bold text-slate-500">{banner.is_active ? 'Active' : 'Hidden'}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(banner.id)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-900">Create Promotion</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Image URL</label>
                  <input 
                    required 
                    type="url" 
                    value={newBanner.image_url}
                    onChange={(e) => setNewBanner({...newBanner, image_url: e.target.value})}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-emerald-500 focus:bg-white outline-none transition-all px-4 py-3 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 font-bold">Recommended aspect ratio 21:9 (e.g. 1050x450)</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Link to Product (Optional)</label>
                  <select 
                    value={newBanner.linked_product_id}
                    onChange={(e) => setNewBanner({...newBanner, linked_product_id: e.target.value})}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-emerald-500 focus:bg-white outline-none transition-all px-4 py-3 font-bold appearance-none"
                  >
                    <option value="">No Link (Static Image)</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.category} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-slate-200"
                >
                  Publish Banner
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
