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
    <div className="mt-8 flex w-full max-w-[320px] flex-col px-4 text-sm">
      
      {/* Current User Profile Switch */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer">
          <div className="h-14 w-14 overflow-hidden rounded-full">
             <img src="https://i.pravatar.cc/150?img=11" alt="azevedo_drdr" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col text-sm">
            <span className="font-semibold text-neutral-900">azevedo_drdr</span>
            <span className="text-neutral-500">Azevedo</span>
          </div>
        </div>
        <button className="text-xs font-semibold text-[#fd297b] hover:text-[#ff655b] transition-colors">Switch</button>
      </div>

      {/* Suggestions Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold text-neutral-500">Suggestions For You</span>
        <button className="text-xs font-semibold text-neutral-900 hover:text-neutral-500">See All</button>
      </div>

      {/* Suggestion List */}
      <div className="flex flex-col gap-4">
        {mockSuggestions.map((suggestion) => (
          <div key={suggestion.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer">
               <div className="h-11 w-11 overflow-hidden rounded-full">
                  <img src={suggestion.image} alt={suggestion.user} className="h-full w-full object-cover" />
               </div>
               <div className="flex flex-col">
                  <span className="font-semibold text-neutral-900 text-sm hover:text-neutral-500">{suggestion.user}</span>
                  <span className="text-xs text-neutral-500 w-[180px] truncate">{suggestion.subText}</span>
               </div>
            </div>
            <button className="text-xs font-semibold text-[#fd297b] hover:text-[#ff655b] transition-colors">Follow</button>
          </div>
        ))}
      </div>

      {/* Footer Links */}
      <div className="mt-8 flex flex-col gap-4 text-xs font-normal text-neutral-400">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
           <a href="#" className="hover:underline">About</a>
           <a href="#" className="hover:underline">Help</a>
           <a href="#" className="hover:underline">Press</a>
           <a href="#" className="hover:underline">API</a>
           <a href="#" className="hover:underline">Jobs</a>
           <a href="#" className="hover:underline">Privacy</a>
           <a href="#" className="hover:underline">Terms</a>
           <a href="#" className="hover:underline">Locations</a>
           <a href="#" className="hover:underline">Top Accounts</a>
           <a href="#" className="hover:underline">Hashtags</a>
           <a href="#" className="hover:underline">Language</a>
        </div>
        <span>© 2024 PURETALK FROM META</span>
      </div>

    </div>
  );
};

export default RightSidebar;
