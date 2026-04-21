// context/theme.ts

export interface ThemeColors {
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };
  surface: {
    glass: string;
    glassHover: string;
    border: string;
    borderHover: string;
  };
  accent: {
    primary: string;
    gradient: string;
    gradientHover: string;
  };
  background: {
    gradient: string[];
    particles: string;
    overlay: string;
  };
  status: {
    error: { bg: string; border: string; text: string };
  };
}

export const darkTheme: ThemeColors = {
  text: {
    primary: 'text-white',
    secondary: 'text-white/80',
    tertiary: 'text-white/60',
    muted: 'text-white/40',
  },
  surface: {
    glass: 'bg-white/5',
    glassHover: 'hover:bg-white/10',
    border: 'border border-white/10',
    borderHover: 'hover:border-white/20',
  },
  accent: {
    primary: 'text-[#fd297b]',
    gradient: 'from-[#fd297b] to-[#ff655b]',
    gradientHover: 'hover:from-[#ff655b] hover:to-[#fd297b]',
  },
  background: {
    gradient: ['#0a0a0a', '#12040a', '#0a0a0a'],
    particles: 'rgba(253, 41, 123, 0.45)',
    overlay: 'bg-transparent',
  },
  status: {
    error: {
      bg: 'bg-red-500/10',
      border: 'border border-red-500/30',
      text: 'text-red-300',
    },
  },
};

export const lightTheme: ThemeColors = {
  text: {
    primary: 'text-slate-900',
    secondary: 'text-slate-700',
    tertiary: 'text-slate-600',
    muted: 'text-slate-400',
  },
  surface: {
    glass: 'bg-white/70',
    glassHover: 'hover:bg-white/90',
    border: 'border border-white/60',
    borderHover: 'hover:border-[#fd297b]/30',
  },
  accent: {
    primary: 'text-[#fd297b]',
    gradient: 'from-[#fd297b] to-[#ff655b]',
    gradientHover: 'hover:from-[#ff655b] hover:to-[#fd297b]',
  },
  background: {
    gradient: ['#fff0f5', '#ffe4ef', '#fff8f0'],
    particles: 'rgba(253, 41, 123, 0.25)',
    overlay: 'bg-transparent',
  },
  status: {
    error: {
      bg: 'bg-red-50',
      border: 'border border-red-200',
      text: 'text-red-600',
    },
  },
};

export function getTheme(isDark: boolean): ThemeColors {
  return isDark ? darkTheme : lightTheme;
}

export function getWaveColors(isDark: boolean) {
  if (isDark) {
    return [
      { amplitude: 32, frequency: 0.007, speed: 0.5,  color: 'rgba(255, 88, 100, 0.12)',  phase: 0   },
      { amplitude: 26, frequency: 0.010, speed: 0.8,  color: 'rgba(255, 101, 91, 0.18)',  phase: 1.2 },
      { amplitude: 20, frequency: 0.014, speed: 1.1,  color: 'rgba(253, 41, 123, 0.22)',  phase: 2.4 },
      { amplitude: 15, frequency: 0.019, speed: 1.4,  color: 'rgba(253, 41, 123, 0.32)',  phase: 3.6 },
    ];
  }
  return [
    { amplitude: 32, frequency: 0.007, speed: 0.5,  color: 'rgba(253, 41, 123, 0.07)',  phase: 0   },
    { amplitude: 26, frequency: 0.010, speed: 0.8,  color: 'rgba(255, 101, 91, 0.11)',  phase: 1.2 },
    { amplitude: 20, frequency: 0.014, speed: 1.1,  color: 'rgba(255, 88, 100, 0.15)',  phase: 2.4 },
    { amplitude: 15, frequency: 0.019, speed: 1.4,  color: 'rgba(253, 41, 123, 0.22)',  phase: 3.6 },
  ];
}

// ========== NEW ADDITIONS (පහත සියල්ල අලුතෙන් එකතු කළා) ==========

// Animation keyframes as CSS strings
export const animationStyles = `
  @keyframes twinkle {
    0%, 100% { opacity: 0.2; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.3); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.3; transform: scale(1); box-shadow: 0 0 4px rgba(255,255,255,0.4); }
    50% { opacity: 0.9; transform: scale(1.15); box-shadow: 0 0 15px rgba(255,255,255,0.9); }
  }
  
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.2; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.05); }
  }
  
  .animate-twinkle {
    animation: twinkle ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow ease-in-out infinite;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 8s ease-in-out infinite;
  }
  
  .delay-1000 {
    animation-delay: 1s;
  }
  
  .delay-2000 {
    animation-delay: 2s;
  }
`;

// Space background component (JSX) - තරු ගණන අඩු කරන ලදී
export function getSpaceBackground(isDark: boolean) {
  if (!isDark) return null;
  
  return {
    container: "fixed inset-0 bg-black",
    gradient: "absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#050510]",
    stars: [...Array(80)].map((_, i) => ({  // 300 න් 80 ට අඩු කළා
      key: i,
      className: "absolute rounded-full bg-white animate-twinkle",
      style: {
        width: `${Math.random() * 2.5 + 0.5}px`,
        height: `${Math.random() * 2.5 + 0.5}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${Math.random() * 3 + 2}s`,
        opacity: Math.random() * 0.8 + 0.2,
      }
    })),
    brightStars: [...Array(20)].map((_, i) => ({  // 80 න් 20 ට අඩු කළා
      key: `bright-${i}`,
      className: "absolute rounded-full bg-white animate-pulse-glow",
      style: {
        width: `${Math.random() * 4 + 1.5}px`,
        height: `${Math.random() * 4 + 1.5}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 8}s`,
        animationDuration: `${Math.random() * 4 + 2}s`,
        opacity: Math.random() * 0.6 + 0.3,
        boxShadow: `0 0 ${Math.random() * 8 + 3}px rgba(255,255,255,0.6)`,
      }
    })),
    nebulas: [
      { className: "absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl animate-pulse-slow" },
      { className: "absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-pink-600/5 blur-3xl animate-pulse-slow delay-1000" },
      { className: "absolute top-1/2 left-1/2 w-120 h-120 rounded-full bg-blue-500/3 blur-3xl animate-pulse-slow delay-2000" },
    ]
  };
}

// Background wrapper component - තරු ගණන අඩු කරන ලදී
export function BackgroundWrapper({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {isDark ? (
        <div className="fixed inset-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#050510]"></div>
          <div className="absolute inset-0 overflow-hidden">
            {/* සාමාන්‍ය තරු - 80 ක් පමණි */}
            {[...Array(80)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white animate-twinkle"
                style={{
                  width: `${Math.random() * 2.5 + 0.5}px`,
                  height: `${Math.random() * 2.5 + 0.5}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${Math.random() * 3 + 2}s`,
                  opacity: Math.random() * 0.8 + 0.2,
                }}
              />
            ))}
            {/* දීප්තිමත් තරු - 20 ක් පමණි */}
            {[...Array(20)].map((_, i) => (
              <div
                key={`bright-${i}`}
                className="absolute rounded-full bg-white animate-pulse-glow"
                style={{
                  width: `${Math.random() * 4 + 1.5}px`,
                  height: `${Math.random() * 4 + 1.5}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 8}s`,
                  animationDuration: `${Math.random() * 4 + 2}s`,
                  opacity: Math.random() * 0.6 + 0.3,
                  boxShadow: `0 0 ${Math.random() * 8 + 3}px rgba(255,255,255,0.6)`,
                }}
              />
            ))}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-pink-600/5 blur-3xl animate-pulse-slow delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-120 h-120 rounded-full bg-blue-500/3 blur-3xl animate-pulse-slow delay-2000"></div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-gradient-to-br from-[#fff0f5] via-[#ffe4ef] to-[#fff8f0]"></div>
      )}
      <div className="relative z-10">{children}</div>
      
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
    </div>
  );
}

// Helper function to get background class names
export function getBackgroundClasses(isDark: boolean): string {
  if (isDark) {
    return "bg-black";
  }
  return "bg-gradient-to-br from-[#fff0f5] via-[#ffe4ef] to-[#fff8f0]";
}

// Helper function to get stars (for custom implementation) - තරු ගණන අඩු කරන ලදී
export function getStars(isDark: boolean, count: number = 80) {  // පෙරනිමි ගණන 300 න් 80 ට වෙනස් කළා
  if (!isDark) return [];
  
  return Array(count).fill(null).map((_, i) => ({
    id: i,
    size: Math.random() * 2.5 + 0.5,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
    opacity: Math.random() * 0.8 + 0.2,
  }));
}