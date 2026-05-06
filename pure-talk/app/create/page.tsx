"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Globe, Lock, Users, Loader2, Sparkles, Send } from 'lucide-react';
import Sidebar from '@/components/Home/Sidebar';
import { postsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Please select an image or video file.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError('File size must be less than 20MB.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) {
      setError('Please add some text or an image to your post.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await postsAPI.createPost(
        content, 
        selectedFile ? [selectedFile] : undefined, 
        privacy
      );
      // Redirect to home page on success
      router.push('/home');
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const privacyOptions = [
    { id: 'public', icon: <Globe size={16} />, label: 'Public', desc: 'Anyone can see this' },
    { id: 'friends', icon: <Users size={16} />, label: 'Friends', desc: 'Only your friends' },
    { id: 'private', icon: <Lock size={16} />, label: 'Only me', desc: 'Private to you' },
  ];

  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] font-sans relative overflow-x-hidden">
      <Sidebar />
      
      <main className="flex w-full flex-1 justify-center pb-16 pt-0 relative z-10 md:ml-[72px] lg:ml-[245px]">
        <div className="flex w-full max-w-[650px] flex-col px-4 md:px-8 py-8 lg:py-12">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
              <Sparkles className="text-[#fd297b]" size={32} />
              Create Post
            </h1>
            <p className="text-[var(--ig-muted)] text-sm md:text-base">
              Share your thoughts, photos, or updates with your network.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm border border-red-500/20 flex items-start gap-2"
                >
                  <X className="shrink-0 mt-0.5 cursor-pointer hover:text-red-700" size={16} onClick={() => setError('')} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="bg-[var(--background)] border border-[var(--ig-border)] rounded-3xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[#fd297b]/50 focus-within:border-[#fd297b]/50 transition-all">
              
              {/* Text Area */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[150px] p-5 bg-transparent border-none resize-none focus:outline-none text-[var(--foreground)] placeholder-[var(--ig-muted)] text-lg"
              />

              {/* Media Preview */}
              <AnimatePresence>
                {previewUrl && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative mx-5 mb-5 rounded-2xl overflow-hidden border border-[var(--ig-border)] group"
                  >
                    <img src={previewUrl} alt="Preview" className="w-full max-h-[400px] object-cover" />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Bar inside textarea */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--ig-border)] bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center p-2 rounded-xl text-[#fd297b] hover:bg-[#fd297b]/10 transition-colors"
                    title="Add Photo/Video"
                  >
                    <ImagePlus size={22} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*,video/*" 
                    className="hidden" 
                  />
                </div>
                <div className="text-xs text-[var(--ig-muted)]">
                  {content.length} / 500
                </div>
              </div>
            </div>

            {/* Privacy & Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Privacy Selector */}
              <div className="flex items-center gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl w-full sm:w-auto overflow-x-auto scrollbar-none">
                {privacyOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrivacy(opt.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                      privacy === opt.id 
                        ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md' 
                        : 'text-[var(--ig-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                    title={opt.desc}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (!content.trim() && !selectedFile)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#fd297b] to-[#ff655b] hover:from-[#ff655b] hover:to-[#fd297b] text-white font-bold transition-all shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                <span>Post</span>
              </button>
            </div>
          </form>
          
        </div>
      </main>
    </div>
  );
}
