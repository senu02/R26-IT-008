'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// import { useLanguage } from '../context/LanguageProvider';
import { MessageCircleHeart, Globe2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import Footer from '@/components/Footer';

export default function Home() {
  // const { t } = useLanguage();
  const t = (key: string) => key; // Mock it

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden flex flex-col">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#fd297b]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#ff655b]/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] left-[50%] translate-x-[-50%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-6 pt-32 pb-24 text-center max-w-7xl mx-auto w-full">

        {/* Rotating Profile Text Badge */}
        <CircularTextProfile />

        {/* 100 Floating Background Avatars */}
        <FloatingBackgroundAvatars count={100} />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-10 shadow-xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <Sparkles className="w-4 h-4 text-[#ff655b]" />
          <span className="text-sm font-medium text-white/80 tracking-wide uppercase">
            {t('Welcome to PureTalk') || 'Welcome to PureTalk'}
          </span>
        </div>

        {/* Big Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-tight animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <span className="block text-white">Connect with</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fd297b] via-[#ff655b] to-[#ff5864] animate-gradient block mt-2">
            Pure Intention.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg md:text-2xl text-white/60 max-w-2xl mb-14 leading-relaxed font-light animate-fade-in-up min-h-[3rem]" style={{ animationDelay: '500ms' }}>
          <TypewriterText text="Experience a social platform designed for absolute authenticity. No noise, no distractions—just pure, meaningful conversations." delay={1000} />
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center animate-fade-in-up" style={{ animationDelay: '700ms' }}>
          <Link
            href="/auth/register"
            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#fd297b] to-[#ff655b] hover:from-[#ff655b] hover:to-[#fd297b] rounded-full font-semibold text-lg transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-1"
          >
            Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/home"
            className="flex items-center justify-center w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold text-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
          >
            Sign In
          </Link>
        </div>

        {/* App Store / Google Play Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center mt-12">
          {/* Apple App Store */}
          <a href="#" className="group transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-white/10 rounded-lg">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
              alt="Download on the App Store"
              className="h-12 w-auto object-contain"
            />
          </a>

          {/* Google Play */}
          <a href="#" className="group transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-white/10 rounded-lg">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
              alt="Get it on Google Play"
              className="h-12 w-auto object-contain"
            />
          </a>
        </div>
      </main>

      {/* Features Showcase */}
      <section className="relative z-10 px-6 py-24 max-w-7xl mx-auto w-full border-t border-white/10 bg-white/[0.02]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<MessageCircleHeart className="w-8 h-8 text-[#fd297b]" />}
            title="Authentic Chats"
            description="Real-time messaging with end-to-end encryption to keep your pure talks safe, secure, and entirely private."
          />
          <FeatureCard
            icon={<Globe2 className="w-8 h-8 text-[#ff655b]" />}
            title="Global Community"
            description="Connect with like-minded individuals from around the world. Distance is no longer a barrier to real friendship."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-8 h-8 text-[#ff5864]" />}
            title="Safe Space"
            description="Advanced moderation and a strict pure interactions policy ensure a welcoming and completely toxic-free environment."
          />
        </div>
      </section>

      {/* Advanced Premium Footer */}
      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#fd297b]/10 flex flex-col items-start text-left">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-white/5 to-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/10 shadow-inner">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/60 leading-relaxed font-light">{description}</p>
    </div>
  );
}

function TypewriterText({ text, delay = 0 }: { text: string, delay?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 35); // 35ms per character

    return () => clearInterval(interval);
  }, [text, started]);

  return (
    <>
      {displayedText}
      <span className="inline-block w-[3px] h-[1em] bg-[#fd297b] ml-1 animate-pulse align-middle" style={{ animationDuration: '0.8s' }}></span>
    </>
  );
}

function FloatingBackgroundAvatars({ count = 100 }: { count?: number }) {
  const [avatars, setAvatars] = useState<any[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: count }).map((_, i) => {
      const size = Math.floor(Math.random() * 35) + 20; // 20px to 55px
      const left = Math.floor(Math.random() * 100);
      const top = Math.floor(Math.random() * 100);
      const animationTypes = ['animate-float', 'animate-float-x', 'animate-scale-pulse'];
      const animationType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
      const duration = Math.floor(Math.random() * 10) + 5;
      const delay = Math.random() * 3;

      // Make avatars visually fade out near the center to avoid completely blocking the text
      const distFromCenter = Math.sqrt(Math.pow(left - 50, 2) + Math.pow(top - 50, 2));
      const opacity = distFromCenter < 25 ? (0.05 + Math.random() * 0.05) : (0.15 + Math.random() * 0.25);

      return {
        id: i,
        src: `https://i.pravatar.cc/100?img=${(i % 70) + 1}`,
        size,
        left,
        top,
        animationType,
        duration,
        delay,
        opacity
      };
    });
    setAvatars(generated);
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {avatars.map((av) => (
        <div
          key={av.id}
          className="absolute animate-fade-in-up"
          style={{
            left: `${av.left}%`,
            top: `${av.top}%`,
            animationDelay: `${av.delay}s`
          }}
        >
          <div className={`${av.animationType}`} style={{ animationDuration: `${av.duration}s` }}>
            <img
              src={av.src}
              alt="bg-avatar"
              className="rounded-full object-cover border border-white/10 shadow-xl"
              style={{ width: av.size, height: av.size, opacity: av.opacity }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CircularTextProfile() {
  return (
    <div className="absolute top-[12%] right-[5%] md:right-[15%] rounded-full flex items-center justify-center z-20 animate-fade-in-up hidden lg:flex" style={{ animationDelay: '1200ms' }}>
      <div className="relative w-40 h-40 flex items-center justify-center animate-float" style={{ animationDuration: '8s' }}>
        {/* Profile Image */}
        <img src="https://i.pravatar.cc/150?img=44" className="w-[84px] h-[84px] rounded-full border-2 border-white/20 shadow-2xl shadow-pink-500/40 z-10 object-cover" alt="Featured Member" />

        {/* Rotating Orbit Text */}
        <div className="absolute inset-0 animate-[spin_12s_linear_infinite]" style={{ animationDirection: 'normal' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible opacity-90">
            <path id="circlePathText" d="M 50, 50 m -42, 0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" fill="none" />
            <text className="text-[10px] font-bold fill-white uppercase tracking-[4px]">
              <textPath href="#circlePathText" startOffset="0%" textLength="260" lengthAdjust="spacing">
                • absolute authenticity • pure intention
              </textPath>
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
