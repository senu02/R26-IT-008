'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircleHeart, ArrowRight } from 'lucide-react';

export default function AdvancedFooter() {
  return (
    <footer className="relative w-full border-t border-white/10 bg-[#0a0a0a]/80 backdrop-blur-3xl pt-20 pb-10 overflow-hidden z-20 mt-20">
      {/* Decorative top border glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#fd297b]/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3 group w-max">
              <div className="p-2.5 bg-gradient-to-br from-[#fd297b] to-[#ff655b] rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-pink-500/30">
                <MessageCircleHeart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">PureTalk</span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              Experience a social platform designed for absolute authenticity. No noise, no distractions—just pure, meaningful conversations.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#fd297b]/20 hover:text-[#fd297b] hover:-translate-y-1 transition-all text-white/70">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#fd297b]/20 hover:text-[#fd297b] hover:-translate-y-1 transition-all text-white/70">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#fd297b]/20 hover:text-[#fd297b] hover:-translate-y-1 transition-all text-white/70">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2">Product</h4>
            <Link href="#" className="text-white/50 hover:text-[#fd297b] hover:translate-x-1 transition-all text-sm w-max">Features</Link>
            <Link href="#" className="text-white/50 hover:text-[#fd297b] hover:translate-x-1 transition-all text-sm w-max">Premium Services</Link>
            <Link href="#" className="text-white/50 hover:text-[#fd297b] hover:translate-x-1 transition-all text-sm w-max">Download App</Link>
            <Link href="#" className="text-white/50 hover:text-[#fd297b] hover:translate-x-1 transition-all text-sm w-max">Security Measures</Link>
          </div>

          {/* Links Column 2 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2">Company</h4>
            <Link href="#" className="text-white/50 hover:text-[#fd297b] hover:translate-x-1 transition-all text-sm w-max">About Us</Link>
            <Link href="#" className="text-white/50 hover:text-[#fd297b] hover:translate-x-1 transition-all text-sm w-max">Careers</Link>
            <Link href="#" className="text-white/50 hover:text-[#fd297b] hover:translate-x-1 transition-all text-sm w-max">Development Blog</Link>
            <Link href="#" className="text-white/50 hover:text-[#fd297b] hover:translate-x-1 transition-all text-sm w-max">Contact Support</Link>
          </div>

          {/* Newsletter Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2">Stay in the loop</h4>
            <p className="text-white/50 text-sm mb-2 leading-relaxed">Join our mailing list to get the latest updates and exclusive early access.</p>
            <div className="relative flex items-center">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-white/5 border border-white/10 py-3 pl-4 pr-12 rounded-xl text-sm focus:outline-none focus:border-[#fd297b]/50 text-white placeholder:text-white/30 transition-colors"
              />
              <button className="absolute right-2 p-2 bg-gradient-to-r from-[#fd297b] to-[#ff655b] rounded-lg hover:shadow-lg hover:shadow-pink-500/20 active:scale-95 transition-all group">
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-white/40 text-sm">&copy; {new Date().getFullYear()} PureTalk. Built with pure intention.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/terms" className="text-white/40 hover:text-white hover:underline transition-all text-sm">Terms & Conditions</Link>
            <Link href="/terms" className="text-white/40 hover:text-white hover:underline transition-all text-sm">Privacy Policy</Link>
            <Link href="#" className="text-white/40 hover:text-white hover:underline transition-all text-sm">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
