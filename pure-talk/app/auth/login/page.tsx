// app/auth/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Phone, X, Loader2, Heart, Zap, MessageCircle, Users } from 'lucide-react';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import HeroVideo from '@/components/HeroVideo';
import AnimatedButton from '@/components/AnimatedButton';

interface LoginError {
  status?: number;
  data?: {
    error?: string;
    non_field_errors?: string[];
  };
  message?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    if (
      token &&
      token !== 'undefined' &&
      token !== 'null' &&
      userData &&
      userData !== 'undefined' &&
      userData !== 'null'
    ) {
      try {
        const parsed = JSON.parse(userData);
        const role = parsed?.role || localStorage.getItem('user_role');
        if (parsed?.email || parsed?.id) {
          if (role === 'admin' || role === 'super_admin') {
            window.location.replace('/admin/dashboard');
          } else if (role === 'moderator') {
            window.location.replace('/admin/dashboard');
          } else {
            window.location.replace('/home');
          }
          return;
        }
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_role');
      }
    }

    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    if (savedRemember && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    setSessionChecked(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) { 
      setError('Email is required'); 
      return; 
    }
    if (!password) { 
      setError('Password is required'); 
      return; 
    }
    if (!email.includes('@') || !email.includes('.')) { 
      setError('Please enter a valid email address'); 
      return; 
    }
    
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(email, password);
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.setItem('rememberMe', 'false');
      }
      
      const userRole = response.user.role || response.role;
      let destination = '/home';
      if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator') {
        destination = '/admin/dashboard';
      }
      window.location.assign(destination);
      
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      const errorObj = err as LoginError;
      
      if (errorObj.data?.error) {
        setError(errorObj.data.error);
      } else if (errorObj.data?.non_field_errors) {
        setError(errorObj.data.non_field_errors[0]);
      } else if (errorObj.message) {
        setError(errorObj.message);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      alert('Google login will be available soon!');
      setIsGoogleLoading(false);
    }, 1500);
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    setTimeout(() => {
      alert('Apple login will be available soon!');
      setIsAppleLoading(false);
    }, 1500);
  };

  const handleForgotPassword = async (method: string) => {
    alert(`Password reset via ${method} will be available soon!`);
    setIsModalOpen(false);
  };

  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
          <p className="text-sm text-white/60">Loading sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans bg-[#111] text-white selection:bg-red-500 selection:text-white">
      {/* Background Hero Video matching theme */}
      <HeroVideo />
      
      {/* Dark theme overlay */}
      <div className="fixed inset-0 bg-black/65 z-10 pointer-events-none" />

      {/* Header matching landing page */}
      <header className="sticky top-0 z-50 p-6 mix-blend-difference border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-bold tracking-[0.15em] uppercase hover:opacity-70 transition-opacity">
            PURE TALK
          </Link>
          <nav className="hidden md:flex items-center gap-10 text-xs tracking-[0.24em] text-white/70 uppercase">
            <Link href="/home" className="hover:text-white transition-colors">Feed</Link>
            <Link href="/users/friends" className="hover:text-white transition-colors">Friends</Link>
            <Link href="/users/posts" className="hover:text-white transition-colors">Posts</Link>
            <Link href="/users/notifications" className="hover:text-white transition-colors">Notifications</Link>
          </nav>
          <Link
            href="/auth/register"
            className="inline-flex items-center rounded-full border border-white/30 px-6 py-2 text-xs tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="relative z-20 flex flex-col lg:flex-row min-h-[calc(100vh-85px)] max-w-7xl mx-auto px-6 py-10">

        {/* LEFT — Branding */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-lg"
          >
            {/* Logo badge */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 backdrop-blur-md rounded-full px-5 py-2 border border-white/20 bg-black/40">
                <Heart className="text-red-500" size={22} fill="#ef4444" />
                <span className="text-sm font-mono tracking-widest uppercase text-white">PureTalk</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold uppercase leading-tight tracking-tight mb-4 text-white">
              Connect with{' '}
              <span className="text-red-500">
                Pure Intention.
              </span>
            </h1>

            <p className="text-base md:text-lg mb-8 leading-relaxed text-white/70 font-light">
              A social platform built for authentic connections. Share your story, join real conversations, and build meaningful relationships — no noise, no toxicity.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                { icon: <MessageCircle size={16} />, label: 'Real-time messaging with end-to-end encryption' },
                { icon: <Users size={16} />, label: 'Communities built on shared values & interests' },
                { icon: <Zap size={16} />, label: 'AI-powered toxicity filter for a safe feed' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-white/70 text-sm">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10 border border-white/10">
                    <span className="text-red-400">{icon}</span>
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Stats strip */}
            <div className="mt-10 pt-6 border-t border-white/10 flex gap-8">
              {[
                { value: '2M+', label: 'Active members' },
                { value: '180+', label: 'Countries' },
                { value: '4.9★', label: 'App rating' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                  <p className="text-xs mt-0.5 font-mono text-white/40 uppercase">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Login form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-md"
          >
            <div className="backdrop-blur-2xl rounded-3xl p-8 border border-white/10 bg-[#1a1a1a]/80 shadow-2xl">
              
              {/* Card header */}
              <div className="mb-6 text-center">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart size={28} className="text-white" fill="white" />
                </div>
                <h2 className="mt-5 text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-xs font-mono uppercase tracking-wider text-white/50">
                  Sign in to see what's happening on PureTalk
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/60">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/60">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent pr-12 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-xl text-xs bg-red-500/20 border border-red-500/40 text-red-300"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                      style={{ accentColor: '#ef4444' }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-xs font-mono text-white/60 uppercase">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs font-mono uppercase transition-colors text-red-400 hover:text-red-300"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-mono uppercase text-sm tracking-widest py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? (
                    <><Loader2 className="animate-spin" size={20} /> Signing in...</>
                  ) : (
                    'Sign In to PureTalk'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-3 bg-[#1a1a1a] text-white/40 font-mono">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Social login */}
              <div className="flex justify-center gap-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 bg-white/5 hover:bg-white/15 border border-white/10"
                >
                  {isGoogleLoading ? <Loader2 className="animate-spin" size={20} /> : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                </button>

                <button
                  onClick={handleAppleLogin}
                  disabled={isAppleLoading || isLoading}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 bg-white/5 hover:bg-white/15 border border-white/10"
                >
                  {isAppleLoading ? <Loader2 className="animate-spin" size={20} /> : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FFFFFF">
                      <path d="M16.365 11.773c0-2.118 1.724-3.139 1.804-3.19-.982-1.438-2.54-1.635-3.091-1.657-1.316-.133-2.568.775-3.236.775-.668 0-1.702-.756-2.796-.736-1.44.02-2.767.837-3.509 2.127-1.498 2.597-.383 6.445 1.075 8.55.714 1.032 1.565 2.19 2.683 2.148 1.076-.042 1.484-.697 2.786-.697 1.302 0 1.674.697 2.808.674 1.159-.02 1.893-1.051 2.598-2.087.82-1.205 1.157-2.372 1.178-2.434-.025-.012-2.26-.868-2.282-3.443zM14.239 5.734c.591-.718.99-1.717.881-2.71-.853.034-1.887.569-2.5 1.286-.55.637-1.031 1.656-.902 2.633.955.074 1.93-.483 2.521-1.209z"/>
                    </svg>
                  )}
                </button>
              </div>

              <p className="text-center text-xs font-mono uppercase mt-6 text-white/50">
                New to PureTalk?{' '}
                <Link
                  href="/auth/register"
                  className="font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  Create profile
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 backdrop-blur-md z-50 bg-black/80"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md rounded-3xl shadow-2xl overflow-hidden bg-[#1a1a1a] border border-white/10 text-white"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h3 className="text-xl font-bold uppercase tracking-tight">Reset password</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="transition text-white/50 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-center text-xs font-mono uppercase text-white/60 mb-4">
                  Choose how you'd like to recover access to your account
                </p>

                {[
                  {
                    icon: <Mail size={22} />,
                    title: 'Email verification',
                    sub: 'Send a reset link to your email address',
                    onClick: () => handleForgotPassword('email'),
                  },
                  {
                    icon: <Phone size={22} />,
                    title: 'Phone verification',
                    sub: 'Get a one-time code sent to your phone',
                    onClick: () => handleForgotPassword('phone'),
                  },
                ].map(({ icon, title, sub, onClick }) => (
                  <button
                    key={title}
                    onClick={onClick}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all group text-left border border-white/10 hover:border-red-500/40 hover:bg-white/5"
                  >
                    <div className="p-3 rounded-full transition bg-red-500/10 text-red-400">
                      {icon}
                    </div>
                    <div>
                      <p className="font-bold uppercase text-sm">{title}</p>
                      <p className="text-xs text-white/50">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-5 border-t border-white/10 bg-black/20">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full px-4 py-2.5 rounded-xl transition font-mono uppercase text-xs tracking-wider bg-white/10 text-white hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}