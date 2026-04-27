import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // phone, otp, role
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (phone.length !== 10) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      alert("Demo OTP: 123456");
    }, 1000);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp !== '123456') return alert("Invalid OTP");
    
    setIsLoading(true);
    try {
      const res = await api.get(`/users/${phone}`);
      setUserProfile(res.data);
      // We know they exist. Now let them pick a role, or we enforce their DB role.
      // The prompt asks for a clean UI toggle: "Login as Admin" or "Login as Rider".
      // We will assume any verified number can select a role for this POC, or we restrict based on db.
      // Let's just go to role selection.
      setStep('role');
    } catch (err) {
      alert("User not found or unauthorized. Please register via customer app first.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = (role) => {
    localStorage.setItem('joymart_admin_phone', phone);
    localStorage.setItem('joymart_admin_role', role);
    onLogin(phone, role);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100">
      <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">Staff Login</h2>
      <p className="text-slate-500 font-bold mb-8 text-center">JoyMart Operations Portal</p>
      
      {step === 'phone' ? (
        <form onSubmit={handleSendOTP} className="space-y-6">
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">+91</span>
            <input 
              type="tel" 
              required 
              maxLength="10" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-6 py-4 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-black text-xl tracking-widest text-slate-900"
              placeholder="Mobile Number"
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-black text-lg py-4 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30">
            {isLoading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : step === 'otp' ? (
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <input 
            type="text" 
            required 
            maxLength="6" 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-black text-xl tracking-[1rem] text-center text-slate-900"
            placeholder="000000"
          />
          <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-black text-lg py-4 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30">
            {isLoading ? 'Verifying...' : 'Verify & Login'}
          </button>
          <button type="button" onClick={() => setStep('phone')} className="w-full text-slate-400 font-bold hover:text-slate-600 transition-colors">
            Change Number
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-emerald-600 font-black text-center mb-6 text-lg">Welcome back, {userProfile?.name}!</p>
          <p className="text-slate-500 font-bold text-center mb-4 text-sm uppercase tracking-widest">Select Your Role</p>
          
          <button 
            onClick={() => handleRoleSelection('Admin')} 
            className="w-full bg-slate-900 text-white font-black text-xl py-6 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Login as Admin
          </button>
          
          <button 
            onClick={() => handleRoleSelection('Rider')} 
            className="w-full bg-slate-100 text-slate-700 border-2 border-slate-200 font-black text-xl py-6 rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Login as Rider
          </button>
        </div>
      )}
    </div>
  );
}
