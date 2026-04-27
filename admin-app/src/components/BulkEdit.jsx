import React, { useState, useEffect } from 'react';
import api from '../api';

function BulkEdit() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (id, field, value) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const saveProduct = async (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    try {
      await api.put(`/products/${id}`, product);
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      saveProduct(id);
    }
  };

  if (loading) return <div className="text-center py-10">Loading catalog...</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Bulk Price Editor</h2>
        <p className="text-sm text-gray-500 mt-1">Edit prices and stock directly. Hit Enter to save changes instantly.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disc. Price (₹)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input
                    type="number"
                    value={product.price || ''}
                    onChange={(e) => handleInputChange(product.id, 'price', e.target.value)}
                    onBlur={() => saveProduct(product.id)}
                    onKeyDown={(e) => handleKeyDown(e, product.id)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 border"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input
                    type="number"
                    value={product.discounted_price || ''}
                    onChange={(e) => handleInputChange(product.id, 'discounted_price', e.target.value)}
                    onBlur={() => saveProduct(product.id)}
                    onKeyDown={(e) => handleKeyDown(e, product.id)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 border"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input
                    type="number"
                    value={product.stock_count || ''}
                    onChange={(e) => handleInputChange(product.id, 'stock_count', e.target.value)}
                    onBlur={() => saveProduct(product.id)}
                    onKeyDown={(e) => handleKeyDown(e, product.id)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 border"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BulkEdit;
