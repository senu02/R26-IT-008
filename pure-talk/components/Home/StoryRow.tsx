"use client";
import React, { useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const mockStories = [
  { id: 1, user: 'chchoitoi', image: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, user: 'gwangurl77', image: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, user: 'mishka_so...', image: 'https://i.pravatar.cc/150?img=3' },
  { id: 4, user: 'clubsodab...', image: 'https://i.pravatar.cc/150?img=4' },
  { id: 5, user: 'vasudaydr...', image: 'https://i.pravatar.cc/150?img=5' },
  { id: 6, user: 'hi_ki...', image: 'https://i.pravatar.cc/150?img=6' },
  { id: 7, user: 'alex.anyway', image: 'https://i.pravatar.cc/150?img=7' },
  { id: 8, user: 'jane_doe', image: 'https://i.pravatar.cc/150?img=8' },
];

const StoryRow = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative mb-6 w-full max-w-[630px] rounded-[1.5rem] bg-white text-black border border-neutral-200 pt-4 pb-2 shadow-2xl">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-hidden pt-2 scrollbar-none pb-4"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        {mockStories.map((story) => (
          <div key={story.id} className="flex flex-col items-center justify-center gap-1 cursor-pointer">
            {/* Story Ring */}
            <div className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2px] transition-transform hover:scale-105">
              <div className="absolute inset-[2px] rounded-full bg-white"></div>
              <img 
                src={story.image} 
                alt={story.user} 
                className="relative z-10 h-full w-full rounded-full border-2 border-transparent object-cover p-[1px]"
              />
            </div>
            <span className="w-16 truncate text-center text-xs text-neutral-800">
              {story.user}
            </span>
          </div>
        ))}
      </div>

      {showLeft && (
        <button 
          onClick={() => scroll('left')}
          className="absolute left-2 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-black shadow-md transition-transform hover:scale-110"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {showRight && (
        <button 
          onClick={() => scroll('right')}
          className="absolute right-2 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-black shadow-md transition-transform hover:scale-110"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default StoryRow;
