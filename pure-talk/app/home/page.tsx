"use client";
import React from 'react';
import Sidebar from '@/components/Home/Sidebar';
import StoryRow from '@/components/Home/StoryRow';
import Feed from '@/components/Home/Feed';

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-neutral-50 text-black w-full font-sans relative">
      
      {/* Left Navigation Sidebar */}
      <Sidebar />
      
      {/* Main Layout Content Area - Scrollable */}
      <main className="flex w-full flex-grow justify-center pb-12 relative z-10 lg:ml-[245px] xl:ml-[245px] md:ml-[72px] ml-[72px]">
        
        {/* Container for Feed */}
        <div className="flex w-full max-w-[630px] justify-center px-0 pt-8 lg:px-4">
          
          {/* Main Feed Column */}
          <div className="flex w-full max-w-[630px] flex-col pt-0 items-center md:px-0 px-2 mx-auto">
            <StoryRow />
            <Feed />
          </div>
          
        </div>
      </main>

    </div>
  );
}
