// app/page.tsx

<<<<<<< HEAD
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  MessageCircleMore,
  Globe2,
  Sparkles,
  BellRing,
  Users,
  Menu,
  X,
} from "lucide-react";
import "./custom.css";

const heroImages = [
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
];

const features = [
  {
    icon: <MessageCircleMore className="w-7 h-7" />,
    title: "Real-Time Conversations",
    description:
      "Fast and seamless communication experience built for modern communities.",
  },
  {
    icon: <ShieldCheck className="w-7 h-7" />,
    title: "Secure & Private",
    description:
      "End-to-end protection and smart moderation for a safe digital environment.",
  },
  {
    icon: <Globe2 className="w-7 h-7" />,
    title: "Global Community",
    description:
      "Connect with creators, teams, and communities from anywhere in the world.",
  },
];

const stats = [
  {
    title: "120K+",
    label: "Active Users",
  },
  {
    title: "4.9/5",
    label: "User Experience",
  },
  {
    title: "99.9%",
    label: "Platform Uptime",
  },
];

export default function Home() {
  const [activeHeroImage, setActiveHeroImage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
=======
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import HeroVideo from '@/components/HeroVideo';
import AnimatedText from '@/components/AnimatedText';
import AnimatedButton from '@/components/AnimatedButton';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610

  // Preloader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-dark-main text-gray-200 overflow-hidden">
      {/* Background effects */}
      <div className="hero-bg" />
      <div className="hero-glow-one" />
      <div className="hero-glow-two" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-gray-900/70">
        <div className="container--90 py--20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-full bg-dark-blue-gradient flex items-center justify-center text-white font-semibold text--18">
              P
            </div>
            <div>
              <h1 className="text--24 font-semibold tracking-wide text-white">
                PureTalk
              </h1>
              <p className="text--12 text-gray-400">Communication Platform</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space--40">
            <Link href="/" className="nav-link-dark">
              Home
            </Link>
            <Link href="/features" className="nav-link-dark">
              Features
            </Link>
            <Link href="/about" className="nav-link-dark">
              About
            </Link>
            <Link href="/contact" className="nav-link-dark">
              Contact
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center space--20">
            <Link href="/auth/login" className="secondary-btn-dark">
              Login
            </Link>
            <Link href="/auth/register" className="primary-btn-dark">
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white"
          >
            {menuOpen ? <X /> : <Menu />}
=======
    <div className="min-h-screen bg-[#111] text-white overflow-x-hidden selection:bg-red-500 selection:text-white font-sans">
      
      {/* --- PRELOADER --- */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#111]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.h2 
              className="text-2xl md:text-5xl font-light tracking-[0.2em] uppercase text-white/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              pure talk
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- NAVIGATION --- */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 mix-blend-difference">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-bold tracking-[0.15em] uppercase hover:opacity-70 transition-opacity flex items-center gap-2">
            PURE TALK
          </Link>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 flex flex-col items-center justify-center gap-2 z-[60] relative group"
            aria-label="Toggle Menu"
          >
            <span className={`w-8 h-0.5 bg-white transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`} />
            <span className={`w-8 h-0.5 bg-white transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="lg:hidden border-t border-white/5 bg-gray-900/90 backdrop-blur-md">
            <div className="container--90 py--30 flex flex-col space--20">
              <Link href="/" className="mobile-link-dark">
                Home
              </Link>
              <Link href="/features" className="mobile-link-dark">
                Features
              </Link>
              <Link href="/about" className="mobile-link-dark">
                About
              </Link>
              <Link href="/contact" className="mobile-link-dark">
                Contact
              </Link>
              <div className="flex flex-col space--15 pt--10">
                <Link
                  href="/auth/login"
                  className="secondary-btn-dark text-center"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="primary-btn-dark text-center"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

<<<<<<< HEAD
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container--90 pt--100 pb--100">
          <div className="grid lg:grid-cols-2 items-center space--80">
            {/* Left Column */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-gray-800/50 px--20 py--10 shadow-sm backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-cyan" />
                <span className="text--14 font-medium text-cyan">
                  The Future of Digital Communication
                </span>
              </div>
              <h1 className="hero-title-dark mt--30">
                Connect.
                <br />
                Communicate.
                <br />
                Build Communities.
              </h1>
              <p className="text--20 text-gray-300 max-w-[650px] mt--30 leading-relaxed">
                PureTalk is a modern communication platform designed for
                authentic conversations, private communities, and seamless
                collaboration experiences.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt--50">
                <Link href="/auth/register" className="primary-btn-large-dark">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/auth/login" className="secondary-btn-large-dark">
                  Login
                </Link>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-5 mt--50">
                {stats.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-gray-800/50 backdrop-blur-sm px--25 py--25 shadow-md"
                  >
                    <h3 className="text--40 font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="text--15 text-gray-400 mt-1">{item.label}</p>
                  </div>
=======
      {/* OVERLAY MENU */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <nav className="flex flex-col items-center gap-8 text-3xl md:text-5xl font-light tracking-wide uppercase">
              <Link href="/home" className="hover:text-red-500 transition-colors" onClick={() => setIsMenuOpen(false)}>Feed</Link>
              <Link href="/users/friends" className="hover:text-red-500 transition-colors" onClick={() => setIsMenuOpen(false)}>Friends</Link>
              <Link href="/users/posts" className="hover:text-red-500 transition-colors" onClick={() => setIsMenuOpen(false)}>Posts</Link>
              <Link href="/auth/login" className="hover:text-red-500 transition-colors" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative">
        
        {/* --- HERO SECTION --- */}
        <section className="relative h-[100svh] w-full flex items-center justify-center overflow-hidden bg-[#111]">
          <HeroVideo />
          
          <div className="relative z-20 flex flex-col items-center mt-20 pointer-events-none">
            <motion.h1 
              className="text-[clamp(3rem,8vw,8rem)] font-bold tracking-tighter uppercase leading-none mix-blend-overlay text-white opacity-90"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 2.2, ease: "easeOut" }}
            >
              PURE TALK
            </motion.h1>
            
            {/* The SVG Stroke Animation component representing the "run" text in the original design */}
            <div className="mt-[-20px] md:mt-[-40px]">
              <AnimatedText />
            </div>
            
            <motion.div 
              className="mt-8 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5, duration: 1 }}
            >
              <p className="text-sm font-mono tracking-widest uppercase border border-white/20 rounded-full px-6 py-2 bg-black/20 backdrop-blur-md">
                Est. 2026
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="absolute bottom-10 left-10 z-20 pointer-events-auto"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3, duration: 1 }}
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono uppercase text-white/50">Next Event</span>
              <AnimatedButton href="/home" variant="gradient">
                Join the Community
              </AnimatedButton>
            </div>
          </motion.div>
        </section>

        {/* --- SECOND SECTION (Mimicking "Uniting Runners") --- */}
        <section id="communities" className="relative z-20 bg-[#111] w-full py-24 md:py-40">
          <div className="max-w-7xl mx-auto px-6">
            <motion.h2 
              className="text-4xl md:text-7xl font-bold uppercase leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              Uniting People.<br/>
              <span className="text-white/40">Community by Community.</span>
            </motion.h2>
            
            <div className="mt-20 grid md:grid-cols-[1fr_1.5fr] gap-12 md:gap-24">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h3 className="text-xl md:text-2xl font-light text-white/80 leading-relaxed">
                  Join for a series of community talks across the globe. Built for conversation, connection, and the simple joy of moving together.
                </h3>
                
                <div className="mt-12 text-sm font-mono text-white/50 uppercase tracking-widest flex flex-col gap-4">
                  <p className="flex justify-between border-b border-white/10 pb-4">
                    <span>Active Users</span>
                    <span className="text-white">100K+</span>
                  </p>
                  <p className="flex justify-between border-b border-white/10 pb-4">
                    <span>Global Reach</span>
                    <span className="text-white">50+ Countries</span>
                  </p>
                  <p className="flex justify-between border-b border-white/10 pb-4">
                    <span>Platform</span>
                    <span className="text-white">Web & Mobile</span>
                  </p>
                </div>
              </motion.div>

              {/* List of "Runs" or Communities */}
              <div className="flex flex-col gap-6">
                {[
                  { city: "Düsseldorf", date: "24.02", members: "1.2K Active", href: "/home" },
                  { city: "Berlin", date: "15.03", members: "3.4K Active", href: "/home" },
                  { city: "London", date: "02.04", members: "5.1K Active", href: "/home" }
                ].map((item, i) => (
                  <motion.div 
                    key={item.city}
                    className="group relative flex flex-col md:flex-row md:items-center justify-between p-8 bg-[#1a1a1a] border border-white/5 hover:border-white/20 transition-colors duration-500"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 + (i * 0.1) }}
                  >
                    <div className="flex flex-col gap-2 mb-6 md:mb-0">
                      <div className="flex items-center gap-4 text-xs font-mono text-white/40 uppercase">
                        <span>Upcoming Event:</span>
                        <span className="text-white/80">{item.date}</span>
                      </div>
                      <h4 className="text-3xl font-bold uppercase">{item.city}</h4>
                      <p className="text-sm text-white/50">{item.members}</p>
                    </div>
                    
                    <AnimatedButton href={item.href} variant="dark">
                      View Event Details
                    </AnimatedButton>
                  </motion.div>
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                ))}
              </div>
            </div>

            {/* Right Column (Hero Image Carousel) */}
            <div className="relative">
              <div className="hero-image-wrapper-dark">
                {heroImages.map((image, index) => (
                  <img
                    key={image}
                    src={image}
                    alt="PureTalk Community"
                    className={`hero-image ${
                      activeHeroImage === index ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                <div className="hero-overlay-dark" />

                {/* Floating Cards */}
                <div className="floating-card-dark top-card">
                  <BellRing className="w-5 h-5 text-cyan" />
                  <div>
                    <h4 className="text--16 font-semibold text-white">
                      Smart Notifications
                    </h4>
                    <p className="text--13 text-gray-300">
                      Stay connected in real-time
                    </p>
                  </div>
                </div>
                <div className="floating-card-dark bottom-card">
                  <Users className="w-5 h-5 text-cyan" />
                  <div>
                    <h4 className="text--16 font-semibold text-white">
                      Community Driven
                    </h4>
                    <p className="text--13 text-gray-300">
                      Build meaningful engagement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

<<<<<<< HEAD
        {/* Features Section */}
        <section className="container--90 pb--100">
          <div className="text-center mb--50">
            <p className="text--15 uppercase tracking-[0.3em] text-cyan font-semibold">
              Platform Features
            </p>
            <h2 className="text--56 font-semibold text-white mt--20">
              Everything You Need
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 space--30">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card-dark">
                <div className="feature-icon-dark">{feature.icon}</div>
                <h3 className="text--28 font-semibold text-white mt--20">
                  {feature.title}
                </h3>
                <p className="text--17 text-gray-300 mt--15 leading-relaxed">
                  {feature.description}
                </p>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-2 text-cyan mt--20 text--15 font-semibold hover:underline"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container--90 pb--100">
          <div className="cta-section-dark">
            <div>
              <p className="text--15 uppercase tracking-[0.3em] text-cyan/80">
                Join PureTalk Today
              </p>
              <h2 className="text--56 font-semibold text-white mt--20">
                Start Your
                <br />
                Communication Journey
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register" className="cta-btn-dark-primary">
                Create Account
              </Link>
              <Link href="/auth/login" className="cta-btn-dark-secondary">
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>
=======
        {/* --- MARQUEE SECTION --- */}
        <section className="border-y border-white/10 py-6 overflow-hidden bg-[#111]">
          <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite]">
            <span className="text-sm font-mono tracking-[0.3em] uppercase text-white/40 px-4">
              Every day is day one · Uniting runners · Join the community · Pure Talk · You vs You · Keep pushing ·
            </span>
            <span className="text-sm font-mono tracking-[0.3em] uppercase text-white/40 px-4">
              Every day is day one · Uniting runners · Join the community · Pure Talk · You vs You · Keep pushing ·
            </span>
            <span className="text-sm font-mono tracking-[0.3em] uppercase text-white/40 px-4">
              Every day is day one · Uniting runners · Join the community · Pure Talk · You vs You · Keep pushing ·
            </span>
          </div>
        </section>

      </main>

      <style jsx global>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.33%); }
        }
      `}</style>
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
    </div>
  );
}