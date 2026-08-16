<<<<<<< HEAD
// app/login/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  X,
  Loader2,
  Heart,
  Zap,
  MessageCircle,
  Users,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
=======
// app/auth/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Phone, X, Loader2, Heart, Zap, MessageCircle, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import HeroVideo from '@/components/HeroVideo';
import AnimatedButton from '@/components/AnimatedButton';
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610

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
<<<<<<< HEAD

  // No theme toggle – always dark (matching the main site)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
=======
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

<<<<<<< HEAD
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isHoveringForm, setIsHoveringForm] = useState(false);

  // Dark theme colors (matching custom.css)
  const isDarkMode = true; // fixed

  // Check existing session
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      router.push("/");
=======
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token && token !== 'undefined' && token !== 'null') {
      router.push('/home');
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
    }

    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedRemember = localStorage.getItem("rememberMe") === "true";
    if (savedRemember && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [router]);

<<<<<<< HEAD
  // Animated wave canvas (dark theme)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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
      // Dark gradient background (matches --background)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#060816");
      gradient.addColorStop(0.5, "#0a0f1f");
      gradient.addColorStop(1, "#111827");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle cyan particles
      ctx.fillStyle = "#0a939630";
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
      mouseInfluence: { x: number | null; strength: number },
    ) => {
      ctx.beginPath();
      const baseY = height * 0.65;
      let x = 0;
      let y: number;

      while (x <= width) {
        let waveY =
          Math.sin(x * frequency + currentTime * speed + phaseOffset) *
          amplitude;
        if (mouseInfluence.x !== null && mouseInfluence.strength > 0) {
          const dx = x - mouseInfluence.x;
          const distance = Math.abs(dx);
          const maxDistance = 200;
          if (distance < maxDistance) {
            const rippleIntensity =
              mouseInfluence.strength * (1 - distance / maxDistance);
            waveY +=
              Math.sin(distance * 0.05 - currentTime * 15) *
              rippleIntensity *
              12;
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
      ripples = ripples.filter((r) => r.alpha > 0);
      ripples.forEach((ripple) => {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(10, 147, 150, ${ripple.alpha * 0.6})`; // cyan
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 146, 149, ${ripple.alpha * 0.4})`;
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

      // Dark theme waves – cyan and deep teal
      const waves = [
        {
          amplitude: 22,
          frequency: 0.008,
          speed: 1.2,
          color: "#0a939630",
          phase: 0,
        },
        {
          amplitude: 16,
          frequency: 0.012,
          speed: 1.5,
          color: "#10929540",
          phase: 1.2,
        },
        {
          amplitude: 14,
          frequency: 0.006,
          speed: 0.9,
          color: "#043b3c30",
          phase: 2.5,
        },
      ];

      waves.forEach((wave) => {
        drawWave(
          wave.amplitude,
          wave.frequency,
          wave.speed,
          wave.color,
          wave.phase,
          time,
          mouseInfluence,
        );
      });

      drawRipples();
      time += 0.016;
      animationId = requestAnimationFrame(animate);
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      if (isHoveringForm) setMousePosition({ x: e.clientX, y: e.clientY });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleCanvasMouseMove);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleCanvasMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [isHoveringForm, mousePosition]);

=======
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login(email, password);
<<<<<<< HEAD

=======
      
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.setItem("rememberMe", "false");
      }
<<<<<<< HEAD

=======
      
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
      const userRole = response.user.role;
      if (userRole === "admin" || userRole === "super_admin") {
        router.push("/admin/dashboard");
      } else if (userRole === "moderator") {
        router.push("/moderator/dashboard");
      } else {
        router.push("/home");
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorObj = err as LoginError;
<<<<<<< HEAD
=======
      
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
      if (errorObj.data?.error) {
        setError(errorObj.data.error);
      } else if (errorObj.data?.non_field_errors) {
        setError(errorObj.data.non_field_errors[0]);
      } else if (errorObj.message) {
        setError(errorObj.message);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      alert("Google login will be available soon!");
      setIsGoogleLoading(false);
    }, 1500);
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    setTimeout(() => {
      alert("Apple login will be available soon!");
      setIsAppleLoading(false);
    }, 1500);
  };

  const handleForgotPassword = async (method: string) => {
    alert(`Password reset via ${method} will be available soon!`);
    setIsModalOpen(false);
  };

  return (
<<<<<<< HEAD
    <div className="relative min-h-screen w-full overflow-hidden font-sans bg-dark-main text-gray-200">
      {/* Animated wave canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full block"
      />

      {/* Subtle glow effects (matching hero-glow from main page) */}
      <div className="hero-glow-one" />
      <div className="hero-glow-two" />

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* LEFT – Branding (dark version) */}
=======
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
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
        <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-lg"
          >
            {/* Logo badge – dark glass */}
            <div className="mb-8">
<<<<<<< HEAD
              <div className="inline-flex items-center gap-3 backdrop-blur-sm rounded-2xl px-4 py-2 bg-gray-800/50 border border-white/10 shadow-sm">
                <Heart className="text-cyan" size={26} fill="#0a9396" />
                <span className="text-xl font-bold tracking-tight text-white">
                  PureTalk
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-white">
              Connect with{" "}
              <span className="inline-block bg-gradient-to-r from-cyan to-desaturated-cyan bg-clip-text text-white bg-cover">
=======
              <div className="inline-flex items-center gap-3 backdrop-blur-md rounded-full px-5 py-2 border border-white/20 bg-black/40">
                <Heart className="text-red-500" size={22} fill="#ef4444" />
                <span className="text-sm font-mono tracking-widest uppercase text-white">PureTalk</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold uppercase leading-tight tracking-tight mb-4 text-white">
              Connect with{' '}
              <span className="text-red-500">
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                Pure Intention.
              </span>
            </h1>

<<<<<<< HEAD
            <p className="text-lg mb-6 leading-relaxed text-gray-300">
              A social platform built for authentic connections. Share your
              story, join real conversations, and build meaningful relationships
              — no noise, no toxicity.
            </p>

            <div className="space-y-3 mt-8">
              {[
                {
                  icon: <MessageCircle size={16} />,
                  label: "Real-time messaging with end-to-end encryption",
                },
                {
                  icon: <Users size={16} />,
                  label: "Communities built on shared values & interests",
                },
                {
                  icon: <Zap size={16} />,
                  label: "AI-powered toxicity filter for a safe feed",
                },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-cyan/20">
                    <span className="text-cyan">{icon}</span>
=======
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
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

<<<<<<< HEAD
=======
            {/* Stats strip */}
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
            <div className="mt-10 pt-6 border-t border-white/10 flex gap-8">
              {[
                { value: "2M+", label: "Active members" },
                { value: "180+", label: "Countries" },
                { value: "4.9★", label: "App rating" },
              ].map(({ value, label }) => (
                <div key={label}>
<<<<<<< HEAD
                  <p className="text-2xl font-bold bg-gradient-to-r from-cyan to-desaturated-cyan bg-clip-text text-white">
                    {value}
                  </p>
                  <p className="text-xs mt-0.5 text-gray-400">{label}</p>
=======
                  <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                  <p className="text-xs mt-0.5 font-mono text-white/40 uppercase">{label}</p>
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                </div>
              ))}
            </div>
          </motion.div>
        </div>

<<<<<<< HEAD
        {/* RIGHT – Login form (dark glassmorphism) */}
        <div
          className="lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12"
          onMouseEnter={() => setIsHoveringForm(true)}
          onMouseLeave={() => {
            setIsHoveringForm(false);
            setMousePosition(null);
          }}
        >
=======
        {/* RIGHT — Login form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12">
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-md"
          >
<<<<<<< HEAD
            <div
              className="backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 bg-gray-900/60 border border-white/10 transition-all duration-300 hover:border-cyan/30"
              style={{
                boxShadow:
                  "0 25px 50px rgba(10,147,150,0.12), 0 0 0 0.5px rgba(255,255,255,0.05)",
              }}
            >
              <div className="mb-6 text-center">
                <div
                  className="w-14 h-14 mx-auto bg-gradient-to-br from-cyan to-deep-dark-cyan rounded-xl flex items-center justify-center shadow-lg"
                  style={{ boxShadow: "0 8px 24px rgba(10,147,150,0.35)" }}
                >
                  <Heart size={28} className="text-white" fill="white" />
                </div>
                <h2 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-sm text-cyan/80">
=======
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
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                  Sign in to see what's happening on PureTalk
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
<<<<<<< HEAD
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Email address
                  </label>
=======
                  <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/60">Email address</label>
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
<<<<<<< HEAD
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-transparent disabled:opacity-50"
=======
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent disabled:opacity-50"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                  />
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Password
                  </label>
=======
                  <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/60">Password</label>
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
<<<<<<< HEAD
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-transparent pr-12 disabled:opacity-50"
=======
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent pr-12 disabled:opacity-50"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
<<<<<<< HEAD
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-cyan transition-colors"
=======
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-white/50 hover:text-white"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
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
<<<<<<< HEAD
                      className="p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-300"
=======
                      className="p-3 rounded-xl text-xs bg-red-500/20 border border-red-500/40 text-red-300"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
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
<<<<<<< HEAD
                      style={{ accentColor: "#0a9396" }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-400">Remember me</span>
=======
                      style={{ accentColor: '#ef4444' }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-xs font-mono text-white/60 uppercase">Remember me</span>
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
<<<<<<< HEAD
                    className="text-sm font-medium text-cyan hover:text-desaturated-cyan transition-colors"
=======
                    className="text-xs font-mono uppercase transition-colors text-red-400 hover:text-red-300"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
<<<<<<< HEAD
                  className="w-full bg-gradient-to-r from-cyan to-deep-dark-cyan hover:from-deep-dark-cyan hover:to-cyan text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:-translate-y-0.5"
                  style={{ boxShadow: "0 8px 24px rgba(10,147,150,0.30)" }}
=======
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-mono uppercase text-sm tracking-widest py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} /> Signing
                      in...
                    </>
                  ) : (
                    "Sign In to PureTalk"
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
<<<<<<< HEAD
                  <span className="px-2 bg-transparent text-gray-400">
=======
                  <span className="px-3 bg-[#1a1a1a] text-white/40 font-mono">
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                    or continue with
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
<<<<<<< HEAD
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-white/5 hover:bg-white/15 border border-white/15"
=======
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 bg-white/5 hover:bg-white/15 border border-white/10"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                >
                  {isGoogleLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                </button>

                <button
                  onClick={handleAppleLogin}
                  disabled={isAppleLoading || isLoading}
<<<<<<< HEAD
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-white/5 hover:bg-white/15 border border-white/15"
                >
                  {isAppleLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FFFFFF">
                      <path d="M16.365 11.773c0-2.118 1.724-3.139 1.804-3.19-.982-1.438-2.54-1.635-3.091-1.657-1.316-.133-2.568.775-3.236.775-.668 0-1.702-.756-2.796-.736-1.44.02-2.767.837-3.509 2.127-1.498 2.597-.383 6.445 1.075 8.55.714 1.032 1.565 2.19 2.683 2.148 1.076-.042 1.484-.697 2.786-.697 1.302 0 1.674.697 2.808.674 1.159-.02 1.893-1.051 2.598-2.087.82-1.205 1.157-2.372 1.178-2.434-.025-.012-2.26-.868-2.282-3.443zM14.239 5.734c.591-.718.99-1.717.881-2.71-.853.034-1.887.569-2.5 1.286-.55.637-1.031 1.656-.902 2.633.955.074 1.93-.483 2.521-1.209z" />
=======
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 bg-white/5 hover:bg-white/15 border border-white/10"
                >
                  {isAppleLoading ? <Loader2 className="animate-spin" size={20} /> : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FFFFFF">
                      <path d="M16.365 11.773c0-2.118 1.724-3.139 1.804-3.19-.982-1.438-2.54-1.635-3.091-1.657-1.316-.133-2.568.775-3.236.775-.668 0-1.702-.756-2.796-.736-1.44.02-2.767.837-3.509 2.127-1.498 2.597-.383 6.445 1.075 8.55.714 1.032 1.565 2.19 2.683 2.148 1.076-.042 1.484-.697 2.786-.697 1.302 0 1.674.697 2.808.674 1.159-.02 1.893-1.051 2.598-2.087.82-1.205 1.157-2.372 1.178-2.434-.025-.012-2.26-.868-2.282-3.443zM14.239 5.734c.591-.718.99-1.717.881-2.71-.853.034-1.887.569-2.5 1.286-.55.637-1.031 1.656-.902 2.633.955.074 1.93-.483 2.521-1.209z"/>
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                    </svg>
                  )}
                </button>
              </div>

<<<<<<< HEAD
              <p className="text-center text-sm mt-6 text-gray-400">
                New to PureTalk?{" "}
                <a
                  href="/auth/register"
                  className="font-semibold text-cyan hover:text-desaturated-cyan transition-colors"
=======
              <p className="text-center text-xs font-mono uppercase mt-6 text-white/50">
                New to PureTalk?{' '}
                <Link
                  href="/auth/register"
                  className="font-bold text-red-400 hover:text-red-300 transition-colors"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                >
                  Create profile
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL – dark theme */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
<<<<<<< HEAD
              className="fixed inset-0 backdrop-blur-sm bg-black/60 z-50"
=======
              className="fixed inset-0 backdrop-blur-md z-50 bg-black/80"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
<<<<<<< HEAD
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md rounded-2xl shadow-2xl overflow-hidden bg-gray-900/95 backdrop-blur-xl border border-white/15"
              style={{ boxShadow: "0 25px 50px rgba(10,147,150,0.20)" }}
            >
              <div className="flex justify-between items-center p-5 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">
                  Reset your password
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/50 hover:text-white/80 transition"
=======
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md rounded-3xl shadow-2xl overflow-hidden bg-[#1a1a1a] border border-white/10 text-white"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h3 className="text-xl font-bold uppercase tracking-tight">Reset password</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="transition text-white/50 hover:text-white"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
<<<<<<< HEAD
                <p className="text-center text-sm mb-4 text-gray-300">
=======
                <p className="text-center text-xs font-mono uppercase text-white/60 mb-4">
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                  Choose how you'd like to recover access to your account
                </p>

                {[
                  {
                    icon: <Mail size={22} />,
                    title: "Email verification",
                    sub: "Send a reset link to your email address",
                    onClick: () => handleForgotPassword("email"),
                  },
                  {
                    icon: <Phone size={22} />,
                    title: "Phone verification",
                    sub: "Get a one-time code sent to your phone",
                    onClick: () => handleForgotPassword("phone"),
                  },
                ].map(({ icon, title, sub, onClick }) => (
                  <button
                    key={title}
                    onClick={onClick}
<<<<<<< HEAD
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all group text-left border border-white/10 hover:border-cyan/40 hover:bg-cyan/5"
                  >
                    <div className="p-3 rounded-full bg-cyan/20">
                      <span className="text-cyan">{icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="text-sm text-white/50">{sub}</p>
=======
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all group text-left border border-white/10 hover:border-red-500/40 hover:bg-white/5"
                  >
                    <div className="p-3 rounded-full transition bg-red-500/10 text-red-400">
                      {icon}
                    </div>
                    <div>
                      <p className="font-bold uppercase text-sm">{title}</p>
                      <p className="text-xs text-white/50">{sub}</p>
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                    </div>
                  </button>
                ))}
              </div>

<<<<<<< HEAD
              <div className="p-5 border-t border-white/10 bg-white/5">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full px-4 py-2 rounded-xl transition font-medium bg-white/10 text-white hover:bg-white/20"
=======
              <div className="p-5 border-t border-white/10 bg-black/20">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full px-4 py-2.5 rounded-xl transition font-mono uppercase text-xs tracking-wider bg-white/10 text-white hover:bg-white/20"
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
<<<<<<< HEAD

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap");
        * {
          font-family:
            "Inter",
            system-ui,
            -apple-system,
            sans-serif;
        }

        .hero-glow-one {
          position: fixed;
          top: -120px;
          left: -120px;
          width: 400px;
          height: 400px;
          background: rgba(10, 147, 150, 0.2);
          filter: blur(120px);
          border-radius: 999px;
          z-index: 0;
        }

        .hero-glow-two {
          position: fixed;
          right: -120px;
          top: 250px;
          width: 350px;
          height: 350px;
          background: rgba(238, 155, 0, 0.15);
          filter: blur(120px);
          border-radius: 999px;
          z-index: 0;
        }
      `}</style>
=======
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
    </div>
  );
}
