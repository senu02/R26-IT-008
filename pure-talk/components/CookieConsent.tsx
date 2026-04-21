'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Check if the user already accepted using localStorage
    const hasConsented = localStorage.getItem('puretalk_cookie_consent');
    if (!hasConsented) {
      // Delay showing the banner until the splash screen and initial animations finish
      const timer = setTimeout(() => {
        setShow(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setFadingOut(true);
    localStorage.setItem('puretalk_cookie_consent', 'true');
    setTimeout(() => setShow(false), 500); // Wait for CSS transition fade out
  };

  if (!show) return null;

  return (
    <div className={`fixed bottom-0 left-0 md:bottom-6 md:left-6 w-full md:w-[420px] z-[9000] p-4 md:p-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${fadingOut ? 'opacity-0 translate-y-12 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-fade-in-up'}`}>
      <div className="bg-[#111111]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-[#fd297b] to-[#ff655b] rounded-xl shadow-inner shadow-white/20">
              <Cookie className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg tracking-tight">We value your privacy</h3>
          </div>
          <button onClick={() => setFadingOut(true)} className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-white/60 text-sm leading-relaxed mb-6 font-light">
          PureTalk uses cookies to enhance your browsing experience, serve personalized content, and rigorously protect your pure connections. By clicking "Accept All", you consent to our use of cookies.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button onClick={handleAccept} className="w-full sm:w-1/2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5 rounded-xl py-3 text-sm font-semibold transition-all duration-300">
            Customize
          </button>
          <button onClick={handleAccept} className="w-full sm:w-1/2 bg-gradient-to-r from-[#fd297b] to-[#ff655b] hover:shadow-lg hover:shadow-[#ff655b]/20 hover:-translate-y-0.5 text-white rounded-xl py-3 text-sm font-bold transition-all duration-300">
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
