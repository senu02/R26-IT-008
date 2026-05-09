// app/page.tsx

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
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
    </div>
  );
}
