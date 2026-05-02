"use client";
import React from 'react';
import Sidebar from '@/components/Home/Sidebar';
import StoryRow from '@/components/Home/StoryRow';
import Feed from '@/components/Home/Feed';
import RightSidebar from '@/components/Home/RightSidebar';

export default function HomePage() {
  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] font-sans relative">
      <Sidebar />

      <main className="flex w-full flex-1 justify-center pb-16 pt-0 relative z-10 md:ml-[72px] lg:ml-[245px]">
        <div className="flex w-full max-w-[1014px] justify-center gap-8 xl:gap-16 px-0 md:px-4">
          <div className="flex w-full max-w-[470px] shrink-0 flex-col items-stretch lg:max-w-[630px]">
            <StoryRow />
            <Feed />
          </div>

          <aside className="hidden xl:block w-[320px] shrink-0">
            <div className="sticky top-8 pt-8">
              <RightSidebar />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
