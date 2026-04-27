import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    discounted_price: '',
    category: '',
    image_url: '',
    stock_count: 0
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  
  const [masterSearch, setMasterSearch] = useState('');
  const [masterResults, setMasterResults] = useState([]);

  useEffect(() => {
    if (masterSearch.length > 2) {
      api.get(`/system/master-catalog?search=${masterSearch}`)
         .then(res => setMasterResults(res.data))
         .catch(err => console.error(err));
    } else {
      setMasterResults([]);
    }
  }, [masterSearch]);

  const selectMasterItem = (item) => {
    setNewProduct({
      ...newProduct,
      name: item.name,
      image_url: item.image_url,
      price: item.price || '',
    });
    setMasterSearch('');
    setMasterResults([]);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewProduct({...newProduct, image_url: res.data.image_url});
    } catch (err) {
      alert("Image upload failed");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoriesMap = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = [];
    acc[product.category].push(product);
    return acc;
  }, {});

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
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
      await api.put(`/products/${product.id}/availability?is_available=${!product.is_available}`);
      fetchProducts();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const updateStock = async (product, newStockCount) => {
    try {
      await api.put(`/products/${product.id}/stock?stock_count=${newStockCount}`);
      fetchProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        discounted_price: newProduct.discounted_price ? parseFloat(newProduct.discounted_price) : null,
        stock_count: parseInt(newProduct.stock_count) || 0
      });
      setNewProduct({ name: '', price: '', discounted_price: '', category: '', image_url: '', stock_count: 0 });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert("Failed to add product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(error.response?.data?.detail || "Failed to delete product.");
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/products/${editingProduct.id}`, {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        discounted_price: editingProduct.discounted_price ? parseFloat(editingProduct.discounted_price) : null,
        stock_count: parseInt(editingProduct.stock_count) || 0
      });
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert("Failed to update product.");
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
        
        <div className="mb-6 relative z-50">
          <label className="text-sm font-semibold text-slate-700 block mb-1">Search Master Catalog (Auto-fill)</label>
          <input 
            type="text" 
            value={masterSearch}
            onChange={(e) => setMasterSearch(e.target.value)}
            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2 bg-slate-50" 
            placeholder="Type 'Maggi' or 'Amul' to pull optimized images..." 
          />
          {masterResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden z-50">
              {masterResults.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => selectMasterItem(item)}
                  className="px-4 py-3 hover:bg-emerald-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-0"
                >
                  <img src={item.image_url} alt="" className="w-8 h-8 object-cover rounded" />
                  <span className="font-bold text-slate-800">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-end relative z-40">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Product Name</label>
            <input required type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2" placeholder="e.g. Farm Fresh Milk 1L" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Price (₹)</label>
            <input required type="number" step="0.01" min="0" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2" placeholder="60.00" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Disc. Price (₹)</label>
            <input type="number" step="0.01" min="0" value={newProduct.discounted_price} onChange={(e) => setNewProduct({...newProduct, discounted_price: e.target.value})} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2" placeholder="50.00" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <input required type="text" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2" placeholder="Dairy" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Image</label>
            {!newProduct.image_url ? (
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                <span className="text-emerald-700 font-bold text-xs truncate">Optimized Image Linked</span>
                <button type="button" onClick={() => setNewProduct({...newProduct, image_url: ''})} className="text-red-500 text-xs font-black ml-auto">✕</button>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Stock Count</label>
            <input required type="number" min="0" value={newProduct.stock_count} onChange={(e) => setNewProduct({...newProduct, stock_count: e.target.value})} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2" placeholder="0" />
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Store Catalog</h2>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search catalog..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 sm:w-64 rounded-xl border-slate-200 bg-white px-4 py-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition-all"
            />
            <span className="bg-slate-100 text-slate-600 font-medium px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
              {filteredProducts.length} Products
            </span>
          </div>
        </div>
        
        {Object.keys(categoriesMap).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-lg text-slate-500 font-medium">No products found.</p>
            <p className="text-sm text-slate-400 mt-2">Try adjusting your search or add a product above!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(categoriesMap).map(([category, catProducts]) => (
              <div key={category} className="animate-fade-in">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <span className="w-2 h-6 bg-emerald-400 rounded-full"></span>
                  {category}
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">{catProducts.length}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {catProducts.map((product) => (
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
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className={`font-bold text-slate-800 leading-tight ${!product.is_available ? 'text-slate-400' : ''}`}>{product.name}</h3>
                    <div className="flex flex-col items-end shrink-0">
                      {product.discounted_price ? (
                        <>
                          <span className="text-[10px] text-slate-400 line-through">₹{product.price}</span>
                          <span className={`font-black text-base ${product.is_available ? 'text-emerald-600' : 'text-slate-400'}`}>₹{product.discounted_price}</span>
                        </>
                      ) : (
                        <span className={`font-black text-base ${product.is_available ? 'text-emerald-600' : 'text-slate-400'}`}>₹{product.price}</span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setEditingProduct({
                      ...product, 
                      price: product.price.toString(), 
                      discounted_price: product.discounted_price ? product.discounted_price.toString() : '', 
                      stock_count: product.stock_count.toString(),
                      image_url: product.image_url || ''
                    })}
                    className="text-blue-600 text-xs font-bold hover:underline mb-4 text-left"
                  >
                    ✎ Edit Details
                  </button>

                  
                  <div className={`flex items-center justify-between mb-4 p-2 rounded-xl border relative transition-colors ${product.stock_count > 0 && product.stock_count <= 5 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-100'}`}>
                    {product.stock_count > 0 && product.stock_count <= 5 && (
                      <span className="absolute -top-2 -right-2 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white" title="Low Stock Warning!"></span>
                      </span>
                    )}
                    <span className="text-sm font-bold text-slate-600">Stock:</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateStock(product, Math.max(0, product.stock_count - 1))} className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-md font-bold hover:bg-slate-100 text-slate-600">-</button>
                      <span className={`font-black w-8 text-center ${product.stock_count > 0 && product.stock_count <= 5 ? 'text-amber-700' : 'text-slate-700'}`}>{product.stock_count}</span>
                      <button onClick={() => updateStock(product, product.stock_count + 1)} className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-md font-bold hover:bg-slate-100 text-slate-600">+</button>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Edit Product</h3>
              <form onSubmit={handleUpdateProduct} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Product Name</label>
                  <input required type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white outline-none transition-all px-4 py-3" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Apply Discount Percentage (%)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 10" 
                    value={discountPercent} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setDiscountPercent(val);
                      if (val && !isNaN(val)) {
                        const calculated = (parseFloat(editingProduct.price) * (1 - parseFloat(val) / 100)).toFixed(2);
                        setEditingProduct({ ...editingProduct, discounted_price: calculated });
                      }
                    }} 
                    className="w-full rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 focus:border-emerald-500 focus:bg-white outline-none transition-all px-4 py-3 text-emerald-700 font-bold" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Price (₹)</label>
                    <input required type="number" step="0.01" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white outline-none transition-all px-4 py-3" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Disc. Price (₹)</label>
                    <input type="number" step="0.01" value={editingProduct.discounted_price} onChange={(e) => setEditingProduct({...editingProduct, discounted_price: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white outline-none transition-all px-4 py-3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Stock Count</label>
                    <input required type="number" value={editingProduct.stock_count} onChange={(e) => setEditingProduct({...editingProduct, stock_count: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white outline-none transition-all px-4 py-3" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Category</label>
                    <input required type="text" value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white outline-none transition-all px-4 py-3" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Image URL</label>
                  <input type="text" value={editingProduct.image_url} onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white outline-none transition-all px-4 py-3" placeholder="https://example.com/image.png" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => handleDeleteProduct(editingProduct.id)} className="px-6 py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">Delete</button>
                  <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
