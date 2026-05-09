'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const socialServices = [
  {
    id: '01',
    title: 'Brand Identity',
    description:
      'Profile systems, visual language, and creator identity tools that make users memorable.'
  },
  {
    id: '02',
    title: 'Web & Digital',
    description:
      'High-performance feed surfaces and interaction patterns that convert visitors to active members.'
  },
  {
    id: '03',
    title: 'Campaign Design',
    description:
      'Launch mechanics, social motion, and growth loops built for community impact.'
  }
];

const heroImages = [
  'https://images.unsplash.com/photo-1523464862212-d6631d073194?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=1400&q=80'
];

export default function Home() {
  const [activeHeroImage, setActiveHeroImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 opacity-45 bg-[radial-gradient(circle_at_22%_8%,#6e41ff55,transparent_35%),radial-gradient(circle_at_62%_55%,#4020b833,transparent_35%),radial-gradient(circle_at_85%_10%,#ffffff14,transparent_28%)]" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/45 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xl leading-tight font-semibold tracking-[0.18em]">
            PURE<br />TALK
          </p>
          <nav className="hidden md:flex items-center gap-10 text-xs tracking-[0.24em] text-white/70 uppercase">
            <a href="/home" className="hover:text-white transition-colors">Feed</a>
            <a href="/users/friends" className="hover:text-white transition-colors">Friends</a>
            <a href="/users/posts" className="hover:text-white transition-colors">Posts</a>
            <a href="/users/notifications" className="hover:text-white transition-colors">Notifications</a>
          </nav>
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-md border border-white/30 px-5 py-2 text-sm tracking-[0.12em] uppercase hover:bg-white/10 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-14 border-b border-white/10">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-stretch">
            <div>
              <p className="text-xs tracking-[0.35em] text-white/60 uppercase">
                Making communities unforgettable
              </p>
              <h1 className="mt-5 text-[clamp(72px,15vw,170px)] font-semibold leading-[0.86] tracking-tight uppercase">
                Pure
                <br />
                Talk
              </h1>
              <div className="mt-7 grid md:grid-cols-2 gap-8 items-end">
                <p className="text-sm tracking-[0.24em] uppercase text-white/70 leading-relaxed">
                  Social media design and growth studio
                  <br />
                  est. 2026 - Global
                </p>
                <p className="hidden md:block text-right text-6xl font-light italic text-white/15">Pure Talk</p>
              </div>
            </div>

            <div className="relative min-h-[380px] overflow-hidden bg-transparent">
              {heroImages.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt="People connecting on social platform"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 scale-[1.06] animate-hero-pan ${
                    activeHeroImage === index ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-linear-to-t from-[#050507] via-[#050507]/45 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-r from-[#6e41ff2a] to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[11px] tracking-[0.2em] uppercase text-white/80 backdrop-blur-md">
                  Trending Now
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-xs tracking-[0.28em] uppercase text-white/60">Live Community</p>
                <p className="mt-2 text-2xl font-semibold text-white">Real people. Real conversations.</p>
              </div>
              <div className="absolute bottom-5 right-6 flex gap-2">
                {heroImages.map((_, index) => (
                  <span
                    key={`dot-${index}`}
                    className={`h-1.5 rounded-full transition-all ${
                      activeHeroImage === index ? 'w-7 bg-white' : 'w-3 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-4 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-xs tracking-[0.3em] uppercase text-white/45 whitespace-nowrap marquee-track">
            Brand Identity · Web Design · Motion · Social Strategy · Creator Growth ·
          </div>
        </section>

        <section id="services" className="max-w-7xl mx-auto px-6 py-14 md:py-20 border-b border-white/10">
          <p className="text-xs tracking-[0.35em] uppercase text-white/50 mb-8">What We Do</p>
          <div className="grid md:grid-cols-3">
            {socialServices.map((service) => (
              <article key={service.id} className="py-10 md:py-8 pr-8 border-r border-white/10 last:border-r-0">
                <p className="text-xs tracking-[0.3em] text-white/45 mb-5">{service.id}</p>
                <h3 className="text-4xl leading-[1.02] font-medium">{service.title}</h3>
                <p className="text-white/60 mt-5 max-w-sm">{service.description}</p>
                <Link
                  href="/home"
                  className="mt-7 inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase text-violet-300 hover:text-violet-200"
                >
                  Explore <ArrowRight className="w-4 h-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-14 md:py-20">
          <div className="rounded-2xl border border-white/12 bg-white/3 px-7 py-10 md:px-10 md:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <h2 className="text-5xl md:text-6xl font-semibold leading-[0.95]">
              Ready to be
              <br />
              <span className="italic text-white/75">Unforgettable?</span>
            </h2>
            <p className="text-white/60 max-w-xl">
              Pure Talk is a social media platform focused on authentic conversations, creator growth, and safe communities.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm tracking-[0.18em] uppercase hover:bg-white/10 transition-colors"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes hero-pan {
          0% {
            transform: scale(1.06) translate3d(0, 0, 0);
          }
          50% {
            transform: scale(1.12) translate3d(-1.5%, -1%, 0);
          }
          100% {
            transform: scale(1.08) translate3d(1%, 0.8%, 0);
          }
        }
        .animate-hero-pan {
          animation: hero-pan 8s ease-in-out infinite alternate;
        }
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .marquee-track {
          width: max-content;
          display: inline-block;
          animation: marquee 18s linear infinite;
        }
      `}</style>
    </div>
  );
}
