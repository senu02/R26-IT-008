'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

interface AnimatedButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'dark' | 'gradient';
  className?: string;
}

export default function AnimatedButton({ href, children, variant = 'dark', className = '' }: AnimatedButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // The scribble path from the webflow site
  const scribblePath = "M11.4537 22.3596C19.6545 18.1847 27.8552 14.0098 32.8344 11.6445C41.5581 7.50052 10.5956 39.1206 6.13386 45.1438C2.89568 49.5152 3.9942 49.3863 5.19398 49.025C6.39374 48.6638 7.66149 48.0741 16.6566 42.4134C25.6517 36.7528 42.3355 26.0392 51.4912 20.0762C60.6469 14.1132 61.7484 12.4942 62.1378 12.8874C62.5272 13.2807 62.0891 12.7872 55.478 21.125C48.8669 29.4627 36.0752 45.8928 29.3568 54.687C22.6384 63.4811 22.3809 64.1413 22.567 64.3494C22.8772 64.6964 42.6498 51.3989 42.9267 51.203C56.191 41.8144 67.6277 33.8285 81.2663 24.2328C94.9049 14.6371 97.8293 12.9711 99.9697 11.818C100.642 11.4558 105.373 8.65201 104.36 10.5163C103.993 11.1922 103.237 12.3518 94.5861 22.3596C85.935 32.3674 62.1378 61.3918 62.1378 61.3918C62.1378 61.3918 53.0608 71.5223 53.3949 72.0021C53.729 72.482 56.2351 70.9697 67.1706 62.6156C78.1062 54.2615 118.271 23.2751 121.489 24.184C124.707 25.093 95.9878 68.8273 94.5862 74.2402C93.1846 79.6531 124.396 46.4414 134.63 39.8584";

  return (
    <Link 
      href={href}
      className={`relative inline-flex items-center justify-center px-10 py-5 group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 z-0">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 139 85" 
          fill="none" 
          preserveAspectRatio="none" 
          className="w-full h-full text-white"
        >
          <motion.path 
            d={scribblePath} 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{ 
              pathLength: isHovered ? 1 : 0, 
              opacity: isHovered ? 1 : 0.3 
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </svg>
      </div>
      
      <span className="relative z-10 text-white font-mono text-sm tracking-widest uppercase flex items-center gap-2">
        {children}
      </span>
      
      {/* Background fill shape to mimic the button structure */}
      <div className={`absolute inset-0 z-[-1] rounded-full blur-md opacity-30 transition-opacity duration-300 ${isHovered ? 'opacity-70' : 'opacity-30'} ${variant === 'gradient' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-white/10'}`} />
    </Link>
  );
}
