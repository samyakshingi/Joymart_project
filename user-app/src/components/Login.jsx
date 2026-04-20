import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (otp === '123456') {
      localStorage.setItem('joymart_phone', phone);
      onLogin(phone);
    } else {
      alert("Invalid OTP");
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
      ) : (
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
          <button type="submit" className="w-full bg-slate-900 text-white font-black text-lg py-4 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30">
            Verify & Login
          </button>
          <button type="button" onClick={() => setStep('phone')} className="w-full text-slate-400 font-bold hover:text-slate-600 transition-colors">
            Change Number
          </button>
        </form>
      )}
    </div>
  );
}
