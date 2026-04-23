import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // phone, otp, profile
  const [isLoading, setIsLoading] = useState(false);
  const [societies, setSocieties] = useState([]);
  const [formData, setFormData] = useState({ name: '', society_id: '', flat_number: '' });

  useEffect(() => {
    api.get('/societies').then(res => setSocieties(res.data)).catch(console.error);
  }, []);

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
      await api.get(`/users/${phone}`);
      // User exists, log them in
      localStorage.setItem('joymart_phone', phone);
      onLogin(phone);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // New user, ask for profile details
        setStep('profile');
      } else {
        alert("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/users', {
        phone,
        name: formData.name,
        society_id: parseInt(formData.society_id),
        flat_number: formData.flat_number
      });
      localStorage.setItem('joymart_phone', phone);
      onLogin(phone);
    } catch (err) {
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100">
      <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">Login</h2>
      <p className="text-slate-500 font-bold mb-8 text-center">Verify your number to order</p>
      
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
        <form onSubmit={handleCompleteProfile} className="space-y-4">
          <p className="text-emerald-600 font-black text-center mb-4 text-lg">OTP Verified! 🎉</p>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Full Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 text-lg" placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Society</label>
            <select required value={formData.society_id} onChange={e => setFormData({...formData, society_id: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 text-lg cursor-pointer appearance-none">
              <option value="" disabled>Select Society</option>
              {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Flat / House Number</label>
            <input required type="text" value={formData.flat_number} onChange={e => setFormData({...formData, flat_number: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 text-lg" placeholder="e.g. A-101" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-black text-lg py-4 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30 mt-4">
            {isLoading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      )}
    </div>
  );
}
