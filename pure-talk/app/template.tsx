'use client';

import React from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-transition w-full h-full flex flex-col flex-grow">
      {children}
    </div>
  );
}
