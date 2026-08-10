'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function HeroVideo() {
  const ref = useRef<HTMLDivElement>(null);
  
  // Parallax effect as we scroll down
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <motion.div 
      ref={ref}
      style={{ y, opacity }}
      className="absolute inset-0 z-0 w-full h-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-black/40 z-10" />
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover scale-[1.05]"
        poster="https://cdn.prod.website-files.com/6a01f769fb0d9bd286987755%2F6a070b5f1143849e34396535_1b9bf193512c46fda8e1fdfc43344378.HD-720p-4.5Mbps-34334206_poster.0000000.jpg"
      >
        <source src="https://cdn.prod.website-files.com/6a01f769fb0d9bd286987755%2F6a070b5f1143849e34396535_1b9bf193512c46fda8e1fdfc43344378.HD-720p-4.5Mbps-34334206_mp4.mp4" type="video/mp4" />
        <source src="https://cdn.prod.website-files.com/6a01f769fb0d9bd286987755%2F6a070b5f1143849e34396535_1b9bf193512c46fda8e1fdfc43344378.HD-720p-4.5Mbps-34334206_webm.webm" type="video/webm" />
      </video>
    </motion.div>
  );
}
