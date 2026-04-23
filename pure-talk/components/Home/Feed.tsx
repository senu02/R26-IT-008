import React from 'react';
import PostCard from './PostCard';

const mockPosts = [
  {
    id: 1,
    user: 'tartinebakery',
    location: 'San Francisco, California',
    userImage: 'https://i.pravatar.cc/150?img=12',
    postImage: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=2692&auto=format&fit=crop',
    likes: '1,422',
    captionUser: 'tartinebakery',
    caption: 'Fresh out of the oven! 🥧 Our seasonal pies feature local ingredients.',
    commentsCount: 24,
    timeAgo: '2 HOURS AGO',
  },
  {
    id: 2,
    user: 'johndoe_designs',
    location: 'New York, USA',
    userImage: 'https://i.pravatar.cc/150?img=15',
    postImage: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2669&auto=format&fit=crop',
    likes: '892',
    captionUser: 'johndoe_designs',
    caption: 'Workspace views for the week. 💻☕',
    commentsCount: 15,
    timeAgo: '4 HOURS AGO',
  },
];

const Feed = () => {
  return (
    <div className="flex w-full flex-col">
      {mockPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default Feed;
