import React from 'react';

export function About() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 bg-white rounded-3xl shadow-sm border border-slate-100 mt-10">
      <h1 className="text-4xl font-black text-slate-900 mb-6">About JoyMart</h1>
      <p className="text-lg text-slate-600 leading-relaxed mb-8">
        JoyMart is your neighborhood's fastest grocery delivery service. We believe in bringing the freshest products 
        from local stores directly to your doorstep in minutes.
      </p>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Our Mission</h2>
      <p className="text-slate-600 leading-relaxed">
        To empower local societies and store owners by providing a seamless, lightning-fast delivery experience 
        to residents.
      </p>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 bg-white rounded-3xl shadow-sm border border-slate-100 mt-10">
      <h1 className="text-4xl font-black text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-slate-400 font-bold mb-8">Last Updated: April 2026</p>
      <div className="space-y-8 text-slate-600">
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">1. Information We Collect</h2>
          <p>We collect your phone number for authentication and your address (society/flat) for delivery purposes.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">2. Data Usage</h2>
          <p>Your data is used solely to fulfill orders and improve your shopping experience.</p>
        </section>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 bg-white rounded-3xl shadow-sm border border-slate-100 mt-10">
      <h1 className="text-4xl font-black text-slate-900 mb-2">Terms & Conditions</h1>
      <p className="text-slate-400 font-bold mb-8">Last Updated: April 2026</p>
      <div className="space-y-8 text-slate-600">
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">1. Service Availability</h2>
          <p>Service is available in selected societies only. Delivery times are estimates.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">2. Payments</h2>
          <p>We currently accept CoD and UPI on delivery.</p>
        </section>
      </div>
    </div>
  );
}
