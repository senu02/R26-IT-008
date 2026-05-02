import React from 'react';

const mockSuggestions = [
  { id: 1, user: 'alex.anyways18', subText: 'Suggested for you', image: 'https://i.pravatar.cc/150?img=33' },
  { id: 2, user: 'chantouflowergirl', subText: 'Follows you', image: 'https://i.pravatar.cc/150?img=61' },
  { id: 3, user: 'gwangurl77', subText: 'Followed by chantouflower...', image: 'https://i.pravatar.cc/150?img=42' },
  { id: 4, user: 'mishka_songs', subText: 'Follows you', image: 'https://i.pravatar.cc/150?img=20' },
  { id: 5, user: 'pierre_thecomet', subText: 'Followed by mishka_songs + 6 more', image: 'https://i.pravatar.cc/150?img=17' },
];

const RightSidebar = () => {
  return (
    <div className="flex w-full max-w-[320px] flex-col text-sm text-[var(--foreground)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex min-w-0 cursor-pointer items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[var(--ig-border)]">
            <img src="https://i.pravatar.cc/150?img=11" alt="azevedo_drdr" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex flex-col text-sm">
            <span className="truncate font-semibold">azevedo_drdr</span>
            <span className="truncate text-[var(--ig-muted)]">Azevedo</span>
          </div>
        </div>
        <button type="button" className="shrink-0 text-xs font-semibold text-[var(--ig-link)] hover:opacity-80">
          Switch
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold text-[var(--ig-muted)]">Suggestions for you</span>
        <button type="button" className="text-xs font-semibold text-[var(--foreground)] hover:opacity-70">
          See all
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {mockSuggestions.map((suggestion) => (
          <div key={suggestion.id} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 cursor-pointer items-center gap-3">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <img src={suggestion.image} alt={suggestion.user} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="truncate text-sm font-semibold hover:opacity-70">{suggestion.user}</span>
                <span className="w-full max-w-[180px] truncate text-xs text-[var(--ig-muted)]">{suggestion.subText}</span>
              </div>
            </div>
            <button type="button" className="shrink-0 text-xs font-semibold text-[var(--ig-link)] hover:opacity-80">
              Follow
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 text-xs font-normal text-[var(--ig-muted)]">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:underline">
            About
          </a>
          <a href="#" className="hover:underline">
            Help
          </a>
          <a href="#" className="hover:underline">
            Press
          </a>
          <a href="#" className="hover:underline">
            API
          </a>
          <a href="#" className="hover:underline">
            Jobs
          </a>
          <a href="#" className="hover:underline">
            Privacy
          </a>
          <a href="#" className="hover:underline">
            Terms
          </a>
          <a href="#" className="hover:underline">
            Locations
          </a>
          <a href="#" className="hover:underline">
            Language
          </a>
        </div>
        <span className="uppercase tracking-wide">© {new Date().getFullYear()} PureTalk</span>
      </div>
    </div>
  );
};

export default RightSidebar;
