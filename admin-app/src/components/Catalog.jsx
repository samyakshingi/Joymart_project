import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleAvailability = async (product) => {
    try {
      await axios.put(`${API_URL}/products/${product.id}/availability?is_available=${!product.is_available}`);
      fetchProducts();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/products`, {
        ...newProduct,
        price: parseFloat(newProduct.price)
      });
      setNewProduct({ name: '', price: '', category: '', image_url: '' });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert("Failed to add product. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Add Product Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Add New Product</h2>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Product Name</label>
            <input required type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2" placeholder="e.g. Farm Fresh Milk 1L" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Price (₹)</label>
            <input required type="number" step="0.01" min="0" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2" placeholder="60.00" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <input required type="text" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2" placeholder="Dairy" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Image URL <span className="font-normal text-slate-400">(Cloudinary)</span></label>
            <input type="url" value={newProduct.image_url} onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2" placeholder="https://res.cloudinary.com/..." />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800 hover:-translate-y-0.5'}`}
          >
            {isSubmitting ? 'Adding...' : '+ Add to Catalog'}
          </button>
        </form>
      </div>

      {/* Product Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Store Catalog</h2>
          <span className="bg-slate-100 text-slate-600 font-medium px-3 py-1 rounded-full text-sm">
            {products.length} Products Total
          </span>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-lg text-slate-500 font-medium">Your catalog is empty.</p>
            <p className="text-sm text-slate-400 mt-2">Add your first product above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className={`group bg-white rounded-2xl border ${product.is_available ? 'border-slate-200' : 'border-red-200 bg-slate-50/50'} shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300`}>
                <div className="h-48 bg-slate-100/80 flex items-center justify-center p-6 relative">
                  {!product.is_available && (
                     <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <span className="bg-red-500 text-white px-4 py-1.5 rounded-full font-bold shadow-lg transform -rotate-12">OUT OF STOCK</span>
                     </div>
                  )}
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className={`max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110 ${!product.is_available ? 'grayscale opacity-50' : ''}`} />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                    {product.category}
                  </span>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className={`font-bold text-lg leading-tight line-clamp-2 ${product.is_available ? 'text-slate-900' : 'text-slate-500'}`} title={product.name}>
                        {product.name}
                      </h3>
                      <span className={`font-black text-lg ${product.is_available ? 'text-emerald-600' : 'text-slate-400'}`}>
                        ₹{product.price}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleAvailability(product)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                      product.is_available 
                        ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent' 
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {product.is_available ? 'Mark as Out of Stock' : 'Mark as Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
