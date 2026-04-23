// app/login/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Phone, X, Loader2, Heart, Zap, MessageCircle, Users, Sun, Moon } from 'lucide-react';
import { getTheme, getWaveColors, type ThemeColors, darkTheme, lightTheme } from '@/context/theme';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface LoginError {
  status?: number;
  data?: {
    error?: string;
    non_field_errors?: string[];
  };
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [theme, setTheme] = useState<ThemeColors>(darkTheme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringForm, setIsHoveringForm] = useState(false);

  useEffect(() => {
    setTheme(getTheme(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/');
    }

    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    if (savedRemember && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
    } else if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, [router]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    let ripples: { x: number; y: number; radius: number; alpha: number }[] = [];

    const drawBackground = () => {
      const themeColors = getTheme(isDarkMode);
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      themeColors.background.gradient.forEach((color, index) => {
        const stop = index / (themeColors.background.gradient.length - 1);
        gradient.addColorStop(stop, color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = themeColors.background.particles;
      for (let i = 0; i < (isDarkMode ? 100 : 80); i++) {
        const starX = (i * 173) % width;
        const starY = (i * 257) % (height * 0.4);
        ctx.beginPath();
        ctx.arc(starX, starY, isDarkMode ? Math.random() * 1.2 + 0.3 : Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawWave = (
      amplitude: number,
      frequency: number,
      speed: number,
      color: string,
      phaseOffset: number,
      currentTime: number,
      mouseInfluence: { x: number | null; strength: number }
    ) => {
      ctx.beginPath();
      const baseY = height * 0.65;
      let x = 0;
      let y: number;

      while (x <= width) {
        let waveY = Math.sin(x * frequency + currentTime * speed + phaseOffset) * amplitude;
        if (mouseInfluence.x !== null && mouseInfluence.strength > 0) {
          const dx = x - mouseInfluence.x;
          const distance = Math.abs(dx);
          const maxDistance = 200;
          if (distance < maxDistance) {
            const rippleIntensity = mouseInfluence.strength * (1 - distance / maxDistance);
            waveY += Math.sin(distance * 0.05 - currentTime * 15) * rippleIntensity * 12;
          }
        }
        y = baseY + waveY;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += 5;
      }

      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    const drawRipples = () => {
      ripples = ripples.filter(r => r.alpha > 0);
      ripples.forEach(ripple => {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(253, 41, 123, ${ripple.alpha * 0.6})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 101, 91, ${ripple.alpha * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ripple.radius += 3;
        ripple.alpha -= 0.025;
      });
    };

    const addRipple = (x: number, y: number) => {
      if (y > height * 0.5) {
        ripples.push({ x, y, radius: 10, alpha: isDarkMode ? 0.9 : 0.7 });
      }
    };

    const animate = () => {
      if (!ctx) return;
      drawBackground();

      let mouseInfluence = { x: null as number | null, strength: 0 };
      if (isHoveringForm && mousePosition) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (mousePosition.x - rect.left) * scaleX;
        const canvasY = (mousePosition.y - rect.top) * scaleY;
        mouseInfluence = { x: canvasX, strength: 0.75 };
        if (Math.random() < 0.12) addRipple(canvasX, canvasY);
      }

      const waveColors = getWaveColors(isDarkMode);
      waveColors.forEach(wave => {
        drawWave(wave.amplitude, wave.frequency, wave.speed, wave.color, wave.phase, time, mouseInfluence);
      });

      drawRipples();
      time += 0.016;
      animationId = requestAnimationFrame(animate);
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      if (isHoveringForm) setMousePosition({ x: e.clientX, y: e.clientY });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [isHoveringForm, mousePosition, isDarkMode]);

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
      
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.setItem('rememberMe', 'false');
      }
      
      // Redirect based on user role
      const userRole = response.user.role;
      if (userRole === 'admin' || userRole === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (userRole === 'moderator') {
        router.push('/moderator/dashboard');
      } else {
        router.push('/users/user-profile');
      }
      
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      const errorObj = err as LoginError;
      
      // Handle different error responses from backend
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
    // Google OAuth would be implemented here
    setTimeout(() => {
      alert('Google login will be available soon!');
      setIsGoogleLoading(false);
    }, 1500);
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    // Apple OAuth would be implemented here
    setTimeout(() => {
      alert('Apple login will be available soon!');
      setIsAppleLoading(false);
    }, 1500);
  };

  const handleForgotPassword = async (method: string) => {
    alert(`Password reset via ${method} will be available soon!`);
    setIsModalOpen(false);
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Wave Canvas Background */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full block" />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 z-20 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110"
        style={{
          backgroundColor: isDarkMode ? 'rgba(253,41,123,0.12)' : 'rgba(253,41,123,0.08)',
          border: isDarkMode ? '1px solid rgba(253,41,123,0.3)' : '1px solid rgba(253,41,123,0.2)',
        }}
      >
        {isDarkMode
          ? <Sun size={22} className="text-[#ff655b]" />
          : <Moon size={22} className="text-[#fd297b]" />
        }
      </button>

      <div className={`absolute inset-0 pointer-events-none ${theme.background.overlay}`} />

      {/* Split layout */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">

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
              <div
                className={`inline-flex items-center gap-3 backdrop-blur-sm rounded-2xl px-4 py-2 transition-all duration-300 ${theme.surface.glass} ${theme.surface.border}`}
              >
                <Heart className="text-[#fd297b]" size={26} fill="#fd297b" />
                <span className={`text-xl font-bold tracking-tight ${theme.text.primary}`}>PureTalk</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 ${theme.text.primary}`}>
              Connect with{' '}
              <span className="bg-gradient-to-r from-[#fd297b] via-[#ff655b] to-[#ff5864] bg-clip-text text-transparent">
                Pure Intention.
              </span>
            </h1>

            <p className={`text-lg mb-6 leading-relaxed ${theme.text.secondary}`}>
              A social platform built for authentic connections. Share your story, join real conversations, and build meaningful relationships — no noise, no toxicity.
            </p>

            {/* Feature list */}
            <div className="space-y-3 mt-8">
              {[
                { icon: <MessageCircle size={16} />, label: 'Real-time messaging with end-to-end encryption' },
                { icon: <Users size={16} />,         label: 'Communities built on shared values & interests' },
                { icon: <Zap size={16} />,           label: 'AI-powered toxicity filter for a safe feed' },
              ].map(({ icon, label }) => (
                <div key={label} className={`flex items-center gap-3 ${theme.text.tertiary}`}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isDarkMode ? 'rgba(253,41,123,0.15)' : 'rgba(253,41,123,0.10)',
                    }}
                  >
                    <span className="text-[#fd297b]">{icon}</span>
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Stats strip */}
            <div
              className={`mt-10 pt-6 border-t flex gap-8 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}
            >
              {[
                { value: '2M+', label: 'Active members' },
                { value: '180+', label: 'Countries' },
                { value: '4.9★', label: 'App rating' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className={`text-2xl font-bold bg-gradient-to-r from-[#fd297b] to-[#ff655b] bg-clip-text text-transparent`}>{value}</p>
                  <p className={`text-xs mt-0.5 ${theme.text.muted}`}>{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Login form */}
        <div
          className="lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12"
          onMouseEnter={() => setIsHoveringForm(true)}
          onMouseLeave={() => { setIsHoveringForm(false); setMousePosition(null); }}
        >
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-md"
          >
            <div
              className={`backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300 ${theme.surface.glass} ${theme.surface.border} ${theme.surface.glassHover} ${theme.surface.borderHover}`}
              style={{
                boxShadow: isDarkMode
                  ? '0 25px 50px rgba(253,41,123,0.12), 0 0 0 0.5px rgba(255,255,255,0.08)'
                  : '0 25px 50px rgba(253,41,123,0.10), 0 0 0 0.5px rgba(253,41,123,0.15)',
              }}
            >
              {/* Card header */}
              <div className="mb-6 text-center">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-[#fd297b] to-[#ff655b] rounded-xl flex items-center justify-center shadow-lg"
                  style={{ boxShadow: '0 8px 24px rgba(253,41,123,0.35)' }}
                >
                  <Heart size={28} className="text-white" fill="white" />
                </div>
                <h2 className={`mt-5 text-2xl sm:text-3xl font-semibold tracking-tight ${theme.text.primary}`}>
                  Welcome back
                </h2>
                <p className={`mt-1.5 text-sm ${isDarkMode ? 'text-[#fd297b]/70' : 'text-[#fd297b]/80'}`}>
                  Sign in to see what's happening on PureTalk
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme.text.secondary}`}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#fd297b]/40 focus:border-transparent disabled:opacity-50 ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-white/60 border-slate-200 text-slate-800 placeholder-slate-400'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme.text.secondary}`}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#fd297b]/40 focus:border-transparent pr-12 disabled:opacity-50 ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-white/60 border-slate-200 text-slate-800 placeholder-slate-400'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-white/50 hover:text-[#fd297b]' : 'text-slate-400 hover:text-[#fd297b]'}`}
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
                      className={`p-3 rounded-xl text-sm ${theme.status.error.bg} ${theme.status.error.border} ${theme.status.error.text}`}
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
                      style={{ accentColor: '#fd297b' }}
                      className="w-4 h-4 rounded"
                    />
                    <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-[#fd297b] hover:text-[#ff655b]' : 'text-[#fd297b] hover:text-[#ff655b]'}`}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-[#fd297b] to-[#ff655b] hover:from-[#ff655b] hover:to-[#fd297b] text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:-translate-y-0.5`}
                  style={{ boxShadow: '0 8px 24px rgba(253,41,123,0.30)' }}
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
                <div className={`absolute inset-0 flex items-center`}>
                  <div className={`w-full border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className={`px-2 ${isDarkMode ? 'bg-transparent text-white/40' : 'bg-white/60 text-slate-400'}`}>
                    or continue with
                  </span>
                </div>
              </div>

              {/* Social login */}
              <div className="flex justify-center gap-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${isDarkMode ? 'bg-white/8 hover:bg-white/15 border border-white/15' : 'bg-white hover:bg-gray-50 border border-slate-200 shadow-sm'}`}
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
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${isDarkMode ? 'bg-white/8 hover:bg-white/15 border border-white/15' : 'bg-white hover:bg-gray-50 border border-slate-200 shadow-sm'}`}
                >
                  {isAppleLoading ? <Loader2 className="animate-spin" size={20} /> : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isDarkMode ? '#FFFFFF' : '#000000'}>
                      <path d="M16.365 11.773c0-2.118 1.724-3.139 1.804-3.19-.982-1.438-2.54-1.635-3.091-1.657-1.316-.133-2.568.775-3.236.775-.668 0-1.702-.756-2.796-.736-1.44.02-2.767.837-3.509 2.127-1.498 2.597-.383 6.445 1.075 8.55.714 1.032 1.565 2.19 2.683 2.148 1.076-.042 1.484-.697 2.786-.697 1.302 0 1.674.697 2.808.674 1.159-.02 1.893-1.051 2.598-2.087.82-1.205 1.157-2.372 1.178-2.434-.025-.012-2.26-.868-2.282-3.443zM14.239 5.734c.591-.718.99-1.717.881-2.71-.853.034-1.887.569-2.5 1.286-.55.637-1.031 1.656-.902 2.633.955.074 1.93-.483 2.521-1.209z"/>
                    </svg>
                  )}
                </button>
              </div>

              <p className={`text-center text-sm mt-6 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                New to PureTalk?{' '}
                <a
                  href="/auth/register"
                  className={`font-semibold transition-colors ${isDarkMode ? 'text-[#fd297b] hover:text-[#ff655b]' : 'text-[#fd297b] hover:text-[#ff655b]'}`}
                >
                  Create your profile
                </a>
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
              className={`fixed inset-0 backdrop-blur-sm z-50 ${isDarkMode ? 'bg-black/60' : 'bg-black/30'}`}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#0f0508]/95 backdrop-blur-xl border border-white/15' : 'bg-white border border-slate-200'}`}
              style={{ boxShadow: '0 25px 50px rgba(253,41,123,0.20)' }}
            >
              <div className={`flex justify-between items-center p-5 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                <h3 className={`text-xl font-bold ${theme.text.primary}`}>Reset your password</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={`transition ${isDarkMode ? 'text-white/50 hover:text-white/80' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className={`text-center text-sm mb-4 ${theme.text.secondary}`}>
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
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group text-left ${isDarkMode ? 'border border-white/10 hover:border-[#fd297b]/40 hover:bg-[#fd297b]/5' : 'border border-slate-200 hover:border-[#fd297b]/30 hover:bg-pink-50'}`}
                  >
                    <div
                      className="p-3 rounded-full transition"
                      style={{ background: isDarkMode ? 'rgba(253,41,123,0.12)' : 'rgba(253,41,123,0.08)' }}
                    >
                      <span className="text-[#fd297b]">{icon}</span>
                    </div>
                    <div>
                      <p className={`font-semibold ${theme.text.primary}`}>{title}</p>
                      <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className={`p-5 border-t ${isDarkMode ? 'border-white/10 bg-white/3' : 'border-slate-100 bg-slate-50'}`}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={`w-full px-4 py-2 rounded-xl transition font-medium ${isDarkMode ? 'bg-white/8 text-white hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      `}</style>
    </div>
  );
}