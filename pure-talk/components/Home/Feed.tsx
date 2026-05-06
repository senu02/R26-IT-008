"use client";
import React, { useCallback, useEffect, useState } from "react";
import PostCard from "./PostCard";

// Local type definitions
type User = {
  id: number;
  email: string;
  full_name: string;
  profile_picture: string;
};

type FeedPost = {
  id: number;
  author_detail: User & { display_name: string };
  content: string;
  post_type: string;
  media: Array<{ file_url: string; media_type: string }>;
  like_count: number;
  comment_count: number;
  share_count: number;
  user_has_liked: boolean;
  user_has_saved: boolean;
  recent_comments: any[];
  created_at: string;
  location_name: string | null;
};

const demoSeed: Array<{
  user: string;
  location?: string;
  userImage: string;
  postImage: string;
  likes: string;
  caption: string;
  commentsCount: number;
}> = [
  {
    user: "tartinebakery",
    location: "San Francisco, California",
    userImage: "https://i.pravatar.cc/150?img=12",
    postImage:
      "https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=2692&auto=format&fit=crop",
    likes: "1,422",
    caption:
      "Fresh out of the oven! 🥧 Our seasonal pies feature local ingredients.",
    commentsCount: 24,
  },
  {
    user: "johndoe_designs",
    location: "New York, USA",
    userImage: "https://i.pravatar.cc/150?img=15",
    postImage:
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2669&auto=format&fit=crop",
    likes: "892",
    caption: "Workspace views for the week. 💻☕",
    commentsCount: 15,
  },
];

function toDemoFeedPosts(): FeedPost[] {
  return demoSeed.map((m, i) => {
    const likesNum = parseInt(m.likes.replace(/,/g, ""), 10) || 0;
    const detail = {
      id: 9000 + i,
      email: `${m.user.replace(/\W/g, "")}@demo.local`,
      full_name: m.user,
      profile_picture: m.userImage,
    } as User;
    return {
      id: -(i + 1),
      author_detail: { ...detail, display_name: m.user },
      content: m.caption,
      post_type: "image",
      media: [{ file_url: m.postImage, media_type: "image" }],
      like_count: likesNum,
      comment_count: m.commentsCount,
      share_count: 0,
      user_has_liked: false,
      user_has_saved: false,
      recent_comments: [],
      created_at: new Date().toISOString(),
      location_name: m.location ?? null,
    };
  });
}

const Feed = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPosts(toDemoFeedPosts());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex w-full flex-col items-center py-12 text-sm text-[var(--ig-muted)]">
        Loading feed…
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex w-full flex-col items-center py-12 px-4 text-center text-sm text-[var(--ig-muted)]">
        <p>No posts in your feed yet.</p>
        <p className="mt-2 text-xs">Follow friends or share something to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isDemo={true}
          onUpdated={undefined}
        />
      ))}
    </div>
  );
};

export default Feed;