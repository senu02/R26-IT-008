// app/auth/login/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Phone, X, Loader2, Heart, Zap, MessageCircle, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Link from 'next/link';

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
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/home');
    }

    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    if (savedRemember && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [router]);

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
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#050507');
      gradient.addColorStop(0.5, '#0a0a0f');
      gradient.addColorStop(1, '#0f0f15');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#6e41ff22';
      for (let i = 0; i < 100; i++) {
        const starX = (i * 173) % width;
        const starY = (i * 257) % (height * 0.4);
        ctx.beginPath();
        ctx.arc(starX, starY, Math.random() * 1.2 + 0.3, 0, Math.PI * 2);
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
        ctx.strokeStyle = `rgba(110, 65, 255, ${ripple.alpha * 0.6})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(110, 65, 255, ${ripple.alpha * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ripple.radius += 3;
        ripple.alpha -= 0.025;
      });
    };

    const addRipple = (x: number, y: number) => {
      if (y > height * 0.5) {
        ripples.push({ x, y, radius: 10, alpha: 0.9 });
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

      const waves = [
        { amplitude: 18, frequency: 0.008, speed: 1.2, color: '#6e41ff22', phase: 0 },
        { amplitude: 12, frequency: 0.012, speed: 1.5, color: '#6e41ff33', phase: 2 },
        { amplitude: 8, frequency: 0.018, speed: 1.8, color: '#6e41ff44', phase: 4 },
      ];

      waves.forEach(wave => {
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
  }, [isHoveringForm, mousePosition]);

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
      
      const userRole = response.user.role;
      if (userRole === 'admin' || userRole === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (userRole === 'moderator') {
        router.push('/moderator/dashboard');
      } else {
        router.push('/home');
      }
      
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans bg-[#050507]">
      {/* Wave Canvas Background */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full block" />

      {/* Gradient overlay matching home page */}
      <div className="pointer-events-none fixed inset-0 opacity-45 bg-[radial-gradient(circle_at_22%_8%,#6e41ff55,transparent_35%),radial-gradient(circle_at_62%_55%,#4020b833,transparent_35%),radial-gradient(circle_at_85%_10%,#ffffff14,transparent_28%)]" />

      {/* Header with logo matching home page */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/45 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl leading-tight font-semibold tracking-[0.18em] hover:opacity-80 transition-opacity">
            PURE<br />TALK
          </Link>
          <nav className="hidden md:flex items-center gap-10 text-xs tracking-[0.24em] text-white/70 uppercase">
            <Link href="/home" className="hover:text-white transition-colors">Feed</Link>
            <Link href="/users/friends" className="hover:text-white transition-colors">Friends</Link>
            <Link href="/users/posts" className="hover:text-white transition-colors">Posts</Link>
            <Link href="/users/notifications" className="hover:text-white transition-colors">Notifications</Link>
          </nav>
          <Link
            href="/auth/register"
            className="inline-flex items-center rounded-md border border-white/30 px-5 py-2 text-sm tracking-[0.12em] uppercase hover:bg-white/10 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Split layout */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">

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
              <div className="inline-flex items-center gap-3 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/15 bg-black/25">
                <Heart className="text-[#6e41ff]" size={26} fill="#6e41ff" />
                <span className="text-xl font-bold tracking-tight text-white">PureTalk</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-white">
              Connect with{' '}
              <span className="bg-gradient-to-r from-[#6e41ff] via-[#8b5cf6] to-[#a78bfa] bg-clip-text text-transparent">
                Pure Intention.
              </span>
            </h1>

            <p className="text-lg mb-6 leading-relaxed text-white/60">
              A social platform built for authentic connections. Share your story, join real conversations, and build meaningful relationships — no noise, no toxicity.
            </p>

            {/* Feature list */}
            <div className="space-y-3 mt-8">
              {[
                { icon: <MessageCircle size={16} />, label: 'Real-time messaging with end-to-end encryption' },
                { icon: <Users size={16} />, label: 'Communities built on shared values & interests' },
                { icon: <Zap size={16} />, label: 'AI-powered toxicity filter for a safe feed' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-white/60">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#6e41ff]/15">
                    <span className="text-[#6e41ff]">{icon}</span>
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
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#6e41ff] to-[#8b5cf6] bg-clip-text text-transparent">{value}</p>
                  <p className="text-xs mt-0.5 text-white/40">{label}</p>
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
            <div className="backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300 border border-white/15 bg-black/30 hover:border-[#6e41ff]/30"
              style={{
                boxShadow: '0 25px 50px rgba(110, 65, 255, 0.12), 0 0 0 0.5px rgba(255,255,255,0.08)'
              }}
            >
              {/* Card header */}
              <div className="mb-6 text-center">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-[#6e41ff] to-[#8b5cf6] rounded-xl flex items-center justify-center shadow-lg"
                  style={{ boxShadow: '0 8px 24px rgba(110, 65, 255, 0.35)' }}
                >
                  <Heart size={28} className="text-white" fill="white" />
                </div>
                <h2 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-sm text-[#6e41ff]/70">
                  Sign in to see what's happening on PureTalk
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white/60">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#6e41ff]/40 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-white/60">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#6e41ff]/40 focus:border-transparent pr-12 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-white/50 hover:text-[#6e41ff]"
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
                      className="p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-400"
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
                      style={{ accentColor: '#6e41ff' }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-white/60">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm font-medium transition-colors text-[#6e41ff] hover:text-[#8b5cf6]"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#6e41ff] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#6e41ff] text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:-translate-y-0.5"
                  style={{ boxShadow: '0 8px 24px rgba(110, 65, 255, 0.30)' }}
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
                  <span className="px-2 bg-transparent text-white/40">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Social login */}
              <div className="flex justify-center gap-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-white/8 hover:bg-white/15 border border-white/15"
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
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-white/8 hover:bg-white/15 border border-white/15"
                >
                  {isAppleLoading ? <Loader2 className="animate-spin" size={20} /> : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FFFFFF">
                      <path d="M16.365 11.773c0-2.118 1.724-3.139 1.804-3.19-.982-1.438-2.54-1.635-3.091-1.657-1.316-.133-2.568.775-3.236.775-.668 0-1.702-.756-2.796-.736-1.44.02-2.767.837-3.509 2.127-1.498 2.597-.383 6.445 1.075 8.55.714 1.032 1.565 2.19 2.683 2.148 1.076-.042 1.484-.697 2.786-.697 1.302 0 1.674.697 2.808.674 1.159-.02 1.893-1.051 2.598-2.087.82-1.205 1.157-2.372 1.178-2.434-.025-.012-2.26-.868-2.282-3.443zM14.239 5.734c.591-.718.99-1.717.881-2.71-.853.034-1.887.569-2.5 1.286-.55.637-1.031 1.656-.902 2.633.955.074 1.93-.483 2.521-1.209z"/>
                    </svg>
                  )}
                </button>
              </div>

              <p className="text-center text-sm mt-6 text-white/50">
                New to PureTalk?{' '}
                <Link
                  href="/auth/register"
                  className="font-semibold transition-colors text-[#6e41ff] hover:text-[#8b5cf6]"
                >
                  Create your profile
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
              className="fixed inset-0 backdrop-blur-sm z-50 bg-black/60"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md rounded-2xl shadow-2xl overflow-hidden bg-[#0f0508]/95 backdrop-blur-xl border border-white/15"
              style={{ boxShadow: '0 25px 50px rgba(110, 65, 255, 0.20)' }}
            >
              <div className="flex justify-between items-center p-5 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Reset your password</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="transition text-white/50 hover:text-white/80"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-center text-sm mb-4 text-white/60">
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
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all group text-left border border-white/10 hover:border-[#6e41ff]/40 hover:bg-[#6e41ff]/5"
                  >
                    <div className="p-3 rounded-full transition bg-[#6e41ff]/12">
                      <span className="text-[#6e41ff]">{icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="text-sm text-white/50">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-5 border-t border-white/10 bg-white/3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full px-4 py-2 rounded-xl transition font-medium bg-white/8 text-white hover:bg-white/15"
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