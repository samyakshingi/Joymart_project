import React, { useState, useEffect } from 'react';
import api from './api';
import Orders from './components/Orders';
import Catalog from './components/Catalog';
import Coupons from './components/Coupons';
import Accounts from './components/Accounts';
import Reconciliation from './components/Reconciliation';
import Banners from './components/Banners';
import Login from './components/Login';
import RiderDashboard from './components/RiderDashboard';
import WalletRequests from './components/WalletRequests';
import BulkEdit from './components/BulkEdit';
import Customers from './components/Customers';

const APP_VERSION = "1.0.0";
const PLATFORM = "web";

function ForceUpdateScreen() {
  return (
    <div className="fixed inset-0 bg-slate-900 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
        <h2 className="text-2xl font-black text-slate-900 mb-4">Update Required</h2>
        <p className="text-slate-600 mb-8 font-semibold">A critical update is required to continue using JoyMart.</p>
        <button 
          onClick={() => window.location.reload(true)}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition-colors"
        >
          Update Now
        </button>
      </div>
    </div>
  );
}

function App() {
  const [adminPhone, setAdminPhone] = useState(() => localStorage.getItem('joymart_admin_phone') || '');
  const [adminRole, setAdminRole] = useState(() => localStorage.getItem('joymart_admin_role') || '');
  
  const [activeTab, setActiveTab] = useState(adminRole === 'Rider' ? 'deliveries' : 'orders');
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(false);

  useEffect(() => {
    api.get(`/system/version-check?platform=${PLATFORM}&current_version=${APP_VERSION}`)
      .then(res => setForceUpdate(res.data.force_update))
      .catch(err => console.error('Version check failed', err));
  }, []);

  useEffect(() => {
    if (adminRole === 'Rider') setActiveTab('deliveries');
    else if (adminRole === 'Admin' && activeTab === 'deliveries') setActiveTab('orders');
  }, [adminRole]);

  useEffect(() => {
    if (adminPhone && adminRole === 'Admin') {
      api.get('/store/status')
        .then(res => setIsStoreOpen(res.data.is_open))
        .catch(err => console.error(err));
    }
  }, [adminPhone, adminRole]);

  const toggleStoreStatus = async () => {
    try {
      const res = await api.put(`/store/status?is_open=${!isStoreOpen}`);
      setIsStoreOpen(res.data.is_open);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('joymart_admin_phone');
    localStorage.removeItem('joymart_admin_role');
    setAdminPhone('');
    setAdminRole('');
  };

  if (forceUpdate) return <ForceUpdateScreen />;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:py-0 sm:h-16 gap-3 sm:gap-0">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600 block">
                JoyMart {adminRole || 'Portal'}
              </span>
              {adminRole === 'Admin' && (
                <button 
                  onClick={toggleStoreStatus}
                  className={`px-3 sm:px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-all border-2 flex-shrink-0 ${isStoreOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                >
                  {isStoreOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {adminPhone && (
                <button 
                  onClick={handleLogout}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
          
          {adminPhone && (
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto hide-scrollbar snap-x w-full pb-1 sm:pb-0 mt-2 sm:mt-0">
              {adminRole === 'Rider' && (
                <button
                  onClick={() => setActiveTab('deliveries')}
                  className={`${
                    activeTab === 'deliveries'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  My Deliveries
                </button>
              )}

              {adminRole === 'Admin' && (
                <>
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
                  <button
                    onClick={() => setActiveTab('coupons')}
                    className={`${
                      activeTab === 'coupons'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Coupons
                  </button>
                  <button
                    onClick={() => setActiveTab('bulk-edit')}
                    className={`${
                      activeTab === 'bulk-edit'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Bulk Edit
                  </button>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className={`${
                      activeTab === 'customers'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Customers
                  </button>
                  <button
                    onClick={() => setActiveTab('accounts')}
                    className={`${
                      activeTab === 'accounts'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Accounts (Khata)
                  </button>
                  <button
                    onClick={() => setActiveTab('reconciliation')}
                    className={`${
                      activeTab === 'reconciliation'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Reconciliation
                  </button>
                  <button
                    onClick={() => setActiveTab('banners')}
                    className={`${
                      activeTab === 'banners'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Banners
                  </button>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className={`${
                      activeTab === 'wallet'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Wallet Recharges
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!adminPhone ? (
          <Login onLogin={(phone, role) => {
            setAdminPhone(phone);
            setAdminRole(role);
          }} />
        ) : (
          <>
            {adminRole === 'Rider' && activeTab === 'deliveries' && <RiderDashboard />}
            {adminRole === 'Admin' && (
              <>
                {activeTab === 'orders' && <Orders />}
                {activeTab === 'catalog' && <Catalog />}
                {activeTab === 'bulk-edit' && <BulkEdit />}
                {activeTab === 'customers' && <Customers />}
                {activeTab === 'coupons' && <Coupons />}
                {activeTab === 'accounts' && <Accounts />}
                {activeTab === 'reconciliation' && <Reconciliation />}
                {activeTab === 'banners' && <Banners />}
                {activeTab === 'wallet' && <WalletRequests />}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
