import React from 'react';
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';


interface PostCardProps {
  post: {
    id: number;
    user: string;
    location?: string;
    userImage: string;
    postImage: string;
    likes: string;
    captionUser: string;
    caption: string;
    commentsCount: number;
    timeAgo: string;
  };
}

const PostCard = ({ post }: PostCardProps) => {
  return (
    <div className="mb-8 flex w-full max-w-[470px] flex-col border border-neutral-200 bg-white text-black rounded-[2rem] p-5 mx-auto shadow-2xl lg:max-w-[630px]">
      
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          {/* Default Story Ring on posts as well, or just image */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2px]">
            <div className="absolute inset-[2px] rounded-full bg-white"></div>
            <img 
              src={post.userImage} 
              alt={post.user} 
              className="relative z-10 h-full w-full rounded-full border-2 border-transparent object-cover p-[1px]"
            />
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-semibold hover:text-neutral-500 cursor-pointer">{post.user}</span>
             {post.location && (
               <span className="text-xs text-neutral-500">{post.location}</span>
             )}
          </div>
        </div>
        <button className="hover:text-neutral-500">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Image Content */}
      <div className="relative flex w-full items-center justify-center rounded-[1.25rem] border border-neutral-200 bg-neutral-100 overflow-hidden shadow-inner">
        {/* We use a standard img tag with aspect ratio to maintain shape */}
        <img 
          src={post.postImage} 
          alt="Post" 
          className="max-h-[800px] w-full object-cover object-center"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-4">
          <button className="hover:text-neutral-500 transition-transform hover:scale-110">
            <Heart className="h-6 w-6" />
          </button>
          <button className="hover:text-neutral-500 transition-transform hover:scale-110">
            <MessageCircle className="h-6 w-6" />
          </button>
          <button className="hover:text-neutral-500 transition-transform hover:scale-110">
            <Send className="h-6 w-6" />
          </button>
        </div>
        <button className="hover:text-neutral-500 transition-transform hover:scale-110">
          <Bookmark className="h-6 w-6" />
        </button>
      </div>

      {/* Likes */}
      <span className="mb-2 text-sm font-semibold">{post.likes} likes</span>

      {/* Caption */}
      <div className="mb-1 text-sm">
        <span className="mr-2 font-semibold hover:text-neutral-500 cursor-pointer">{post.captionUser}</span>
        <span>{post.caption}</span>
      </div>

      {/* Comments */}
      {post.commentsCount > 0 && (
        <span className="mb-1 cursor-pointer text-sm text-neutral-500 hover:text-neutral-300">
          View all {post.commentsCount} comments
        </span>
      )}
      
      {/* Search Input for comment placeholder */}
      <div className="flex items-center justify-between mt-2">
         <input type="text" placeholder="Add a comment..." className="w-full text-sm bg-transparent outline-none placeholder-neutral-500" />
         <button className="text-sm font-semibold text-[#fd297b] hover:text-[#ff655b] transition-colors">Post</button>
      </div>

    </div>
  );
};

export default PostCard;
