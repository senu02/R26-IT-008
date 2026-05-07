"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Loader2,
} from "lucide-react";
import { postsAPI, getImageUrl, type FeedPost } from "@/lib/api";

function authorLabel(d: FeedPost["author_detail"]): string {
  const withDisplay = d as { display_name?: string };
  if (withDisplay.display_name?.trim()) return withDisplay.display_name.trim();
  if (d.full_name?.trim()) return d.full_name.trim();
  return d.email.split("@")[0];
}

function firstImageUrl(post: FeedPost): string | null {
  for (const m of post.media ?? []) {
    if (m?.file_url && m.media_type !== "video" && m.media_type !== "audio") {
      return getImageUrl(m.file_url) ?? m.file_url;
    }
  }
  for (const m of post.media ?? []) {
    if (m?.file_url) return getImageUrl(m.file_url) ?? m.file_url;
  }
  return null;
}

interface PostCardProps {
  post: FeedPost;
  isDemo?: boolean;
  onUpdated?: () => void;
}

const PostCard = ({ post, isDemo = false, onUpdated }: PostCardProps) => {
  const [liked, setLiked] = useState(post.user_has_liked);
  const [saved, setSaved] = useState(!!post.user_has_saved);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [shareCount, setShareCount] = useState(post.share_count);
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLiked(post.user_has_liked);
    setSaved(!!post.user_has_saved);
    setLikeCount(post.like_count);
    setCommentCount(post.comment_count);
    setShareCount(post.share_count);
  }, [
    post.id,
    post.user_has_liked,
    post.user_has_saved,
    post.like_count,
    post.comment_count,
    post.share_count,
  ]);

  const user = authorLabel(post.author_detail);
  const avatar =
    getImageUrl(post.author_detail.profile_picture ?? undefined) ??
    "https://i.pravatar.cc/150?img=12";
  const imageUrl = firstImageUrl(post);
  const location = post.location_name ?? undefined;

  const needLogin = () => {
    setHint("Log in to use this.");
    setTimeout(() => setHint(null), 3000);
  };

  const handleLike = async () => {
    if (isDemo) {
      needLogin();
      return;
    }
    setLikeBusy(true);
    setHint(null);
    try {
      const r = await postsAPI.likePost(post.id);
      setLikeCount(r.like_count);
      setLiked(!!r.user_reaction);
      onUpdated?.();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setHint(err.message ?? "Could not update like.");
    } finally {
      setLikeBusy(false);
    }
  };

  const handleComment = () => {
    if (isDemo) {
      needLogin();
      return;
    }
    commentInputRef.current?.focus();
  };

  const submitComment = async () => {
    if (isDemo) {
      needLogin();
      return;
    }
    const t = commentText.trim();
    if (!t) return;
    setCommentBusy(true);
    setHint(null);
    try {
      await postsAPI.createComment(post.id, t);
      setCommentText("");
      setCommentCount((c) => c + 1);
      onUpdated?.();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setHint(err.message ?? "Could not post comment.");
    } finally {
      setCommentBusy(false);
    }
  };

  const handleShare = async () => {
    if (isDemo) {
      needLogin();
      return;
    }
    setShareBusy(true);
    setHint(null);
    try {
      await postsAPI.createShare(post.id);
      setShareCount((s) => s + 1);
      onUpdated?.();
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: "PureTalk",
            text: post.content?.slice(0, 160) || "Post on PureTalk",
            url: typeof window !== "undefined" ? window.location.origin + "/home" : "",
          });
        } catch {
          /* user cancelled share sheet */
        }
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setHint(err.message ?? "Could not share post.");
    } finally {
      setShareBusy(false);
    }
  };

  const handleSave = async () => {
    if (isDemo) {
      needLogin();
      return;
    }
    setSaveBusy(true);
    setHint(null);
    try {
      const r = await postsAPI.savePost(post.id);
      if (r.saved !== undefined) setSaved(r.saved);
      onUpdated?.();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setHint(err.message ?? "Could not save post.");
    } finally {
      setSaveBusy(false);
    }
  };

  const formatCount = (n: number) => n.toLocaleString();

  return (
    <article className="mb-10 flex w-full max-w-[470px] flex-col border-b border-[var(--ig-border)] bg-[var(--background)] pb-5 text-[var(--foreground)] last:border-b-0 lg:max-w-[630px] mx-auto">
      <div className="flex items-center justify-between py-3 px-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2px]">
            <div className="absolute inset-[2px] rounded-full bg-white dark:bg-black" />
            <img
              src={avatar}
              alt=""
              className="relative z-10 h-full w-full rounded-full border-2 border-transparent object-cover p-[1px]"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold hover:opacity-70 cursor-pointer">
              {user}
            </span>
            {location && (
              <span className="truncate text-xs text-[var(--ig-muted)]">{location}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 text-[var(--foreground)] hover:opacity-60"
          aria-label="Post options"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {imageUrl ? (
        <div className="relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-[var(--ig-border)]">
          <img
            src={imageUrl}
            alt=""
            className="max-h-[min(800px,90vh)] w-full object-cover object-center"
          />
        </div>
      ) : (
        <div className="flex min-h-[120px] w-full items-center justify-center border border-[var(--ig-border)] bg-neutral-100 px-4 py-8 text-center text-sm text-[var(--ig-muted)] dark:bg-neutral-900">
          {post.content?.trim() || "Post"}
        </div>
      )}

      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={likeBusy}
            onClick={handleLike}
            className="hover:opacity-60 disabled:opacity-50"
            aria-label={liked ? "Unlike" : "Like"}
          >
            {likeBusy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Heart
                className={`h-6 w-6 ${liked ? "fill-red-500 stroke-red-500" : ""}`}
                strokeWidth={liked ? 0 : 1.75}
              />
            )}
          </button>
          <button
            type="button"
            onClick={handleComment}
            className="hover:opacity-60"
            aria-label="Comment"
          >
            <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            disabled={shareBusy}
            onClick={handleShare}
            className="hover:opacity-60 disabled:opacity-50"
            aria-label="Share"
          >
            {shareBusy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Send className="h-6 w-6" strokeWidth={1.75} />
            )}
          </button>
        </div>
        <button
          type="button"
          disabled={saveBusy}
          onClick={handleSave}
          className="hover:opacity-60 disabled:opacity-50"
          aria-label={saved ? "Unsave" : "Save"}
        >
          {saveBusy ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Bookmark
              className={`h-6 w-6 ${saved ? "fill-[var(--foreground)] stroke-[var(--foreground)]" : ""}`}
              strokeWidth={1.75}
            />
          )}
        </button>
      </div>

      <span className="mb-2 text-sm font-semibold">{formatCount(likeCount)} likes</span>

      {post.content?.trim() && (
        <div className="mb-1 text-sm">
          <span className="mr-2 font-semibold hover:opacity-70 cursor-pointer">{user}</span>
          <span>{post.content}</span>
        </div>
      )}

      {shareCount > 0 && (
        <span className="mb-1 text-xs text-[var(--ig-muted)]">{formatCount(shareCount)} shares</span>
      )}

      {post.recent_comments?.length ? (
        <div className="mb-2 space-y-1">
          {post.recent_comments.slice(0, 2).map((c) => (
            <p key={c.id} className="text-sm">
              <span className="mr-2 font-semibold">
                {c.author_detail ? authorLabel(c.author_detail as FeedPost["author_detail"]) : "User"}
              </span>
              <span>{c.content}</span>
            </p>
          ))}
        </div>
      ) : null}

      {commentCount > 0 && (
        <button
          type="button"
          onClick={() => commentInputRef.current?.focus()}
          className="mb-1 cursor-pointer text-left text-sm text-[var(--ig-muted)] hover:opacity-80"
        >
          View all {commentCount} comments
        </button>
      )}

      {hint && (
        <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">{hint}</p>
      )}

      <div className="mt-2 flex items-center gap-2 border-t border-[var(--ig-border)] pt-3">
        <input
          ref={commentInputRef}
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitComment()}
          placeholder="Add a comment..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ig-muted)]"
        />
        <button
          type="button"
          disabled={commentBusy || !commentText.trim()}
          onClick={submitComment}
          className="shrink-0 text-sm font-semibold text-[var(--ig-link)] opacity-90 hover:opacity-100 disabled:opacity-40"
        >
          {commentBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </button>
      </div>
    </article>
  );
};

export default PostCard;
