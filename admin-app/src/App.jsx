import React, { useState, useEffect } from 'react';
import api from './api';
import Orders from './components/Orders';
import Catalog from './components/Catalog';

function App() {
  const [activeTab, setActiveTab] = useState('orders');
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    api.get('/store/status')
      .then(res => setIsStoreOpen(res.data.is_open))
      .catch(err => console.error(err));
  }, []);

  const toggleStoreStatus = async () => {
    try {
      const res = await api.put(`/store/status?is_open=${!isStoreOpen}`);
      setIsStoreOpen(res.data.is_open);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:py-0 sm:h-16 gap-3 sm:gap-0">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600 block">
                JoyMart Admin
              </span>
              <button 
                onClick={toggleStoreStatus}
                className={`px-3 sm:px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-all border-2 flex-shrink-0 ${isStoreOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
              >
                {isStoreOpen ? '🟢 OPEN' : '🔴 CLOSED'}
              </button>
            </div>
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto hide-scrollbar snap-x w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('orders')}
                className={`${
                  activeTab === 'orders'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                Live Orders Monitor
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`${
                  activeTab === 'catalog'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                Catalog Management
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'orders' ? <Orders /> : <Catalog />}
      </main>
    </div>
  );
}

export default App;
