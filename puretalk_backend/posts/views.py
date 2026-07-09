from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, F
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import (
    Post, PostLike, Comment, CommentLike, PostSave, PostReport,
    PostPrivacy, PostStatus, PostType
)
from .serializers import (
    PostSerializer, CreatePostSerializer, PostUpdateSerializer,
    CommentSerializer, CreateCommentSerializer, ReactionSerializer,
    PostReportSerializer, FeedPostSerializer, PostStatsSerializer,
    PostLikeSerializer,
)
from .permissions import IsAuthorOrReadOnly, CanModeratePost, CanDeleteAnyPost, CanViewPost

# ── Toxicity helpers ──────────────────────────────────────────────────────────

def _run_toxicity_check(text, author, post=None, comment=None, content_type='post'):
    """
    Call the toxicity service, persist a ToxicityLog and update the user
    profile. Returns the raw result dict.
    Does NOT raise — any failure is logged and ignored so posting still works.
    """
    if not text:
        return None
    try:
        from toxicity_detection.services import analyse_toxicity
        from toxicity_detection.models import ToxicityLog, UserToxicityProfile
        from django.utils import timezone as tz

        result = analyse_toxicity(text)

        if result.get('error'):
            return result

        # Persist log
        ToxicityLog.objects.create(
            post=post,
            comment=comment,
            content_type=content_type,
            author=author,
            analysed_text=text[:2000],   # cap stored text
            is_toxic=result['is_toxic'],
            max_score=result['max_score'],
            label_scores=result['labels'],
            flagged_labels=result['flagged_labels'],
        )

        # Update user profile stats
        profile, _ = UserToxicityProfile.objects.get_or_create(user=author)

        if content_type == 'post':
            profile.total_posts_checked = F('total_posts_checked') + 1
            if result['is_toxic']:
                profile.toxic_post_count = F('toxic_post_count') + 1
        else:
            profile.total_comments_checked = F('total_comments_checked') + 1
            if result['is_toxic']:
                profile.toxic_comment_count = F('toxic_comment_count') + 1

        if result['is_toxic']:
            profile.last_toxic_at = tz.now()

        # Refresh to get actual numeric values before comparing floats
        profile.save()
        profile.refresh_from_db()

        if result['max_score'] > profile.highest_toxicity_score:
            profile.highest_toxicity_score = result['max_score']
            profile.save(update_fields=['highest_toxicity_score'])

        # ── Behaviour enforcement (updates UserBehaviorProfile + BehaviorEvent) ──
        try:
            from toxicity_behavior.services import enforce_behavior
            enforce_behavior(
                user=author,
                text=text,
                toxicity_result=result,
                post=post,
                comment=comment,
                content_type=content_type,
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Behaviour enforcement failed: {e}")

        return result

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Toxicity check failed: {e}")
        return None


TOXIC_BLOCK = True   # Set False to log-only (warn but still allow the post)


def _toxicity_response(result):
    """Return a 400 Response if content is toxic and blocking is enabled."""
    if TOXIC_BLOCK and result and result.get('is_toxic'):
        labels = result.get('flagged_labels', [])
        return Response(
            {
                "error": "Your content was flagged as inappropriate and could not be posted.",
                "flagged_categories": labels,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


# ── PostViewSet ───────────────────────────────────────────────────────────────

class PostViewSet(viewsets.ModelViewSet):
    """ViewSet for Post CRUD operations"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PostSerializer

    def get_queryset(self):
        user = self.request.user

        base_qs = Post.objects.select_related('author').prefetch_related(
            'media', 'likes', 'comments', 'shares'
        ).filter(status=PostStatus.PUBLISHED)

        if user.is_authenticated:
            from friends.models import Friendship, FriendBlock

            friend_ids = Friendship.objects.filter(
                user=user
            ).values_list('friend_id', flat=True)

            blocked_by_ids = FriendBlock.objects.filter(
                blocked=user
            ).values_list('blocker_id', flat=True)

            qs = base_qs.filter(
                Q(privacy=PostPrivacy.PUBLIC) |
                Q(author=user) |
                (Q(privacy=PostPrivacy.FRIENDS) & Q(author__in=friend_ids))
            ).exclude(author__in=blocked_by_ids)
        else:
            qs = base_qs.filter(privacy=PostPrivacy.PUBLIC)

        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return CreatePostSerializer
        elif self.action in ['update', 'partial_update']:
            return PostUpdateSerializer
        elif self.action == 'feed':
            return FeedPostSerializer
        return PostSerializer

    def list(self, request):
        page = self.paginate_queryset(self.get_queryset())
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(self.get_queryset(), many=True, context={'request': request})
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        if not post.can_view(request.user):
            return Response(
                {"error": "You don't have permission to view this post"},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(post, context={'request': request})
        return Response(serializer.data)

    def create(self, request):
        """Create a new post — runs toxicity check before saving."""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # ── Toxicity check on the text content ───────────────────────────
        content = request.data.get('content', '') or ''
        if content.strip():
            # We need the post object to link the log, so save first then check.
            # This keeps the flow simple: save → check → if toxic & blocking,
            # soft-delete the post and return error.
            post = serializer.save()

            result = _run_toxicity_check(
                text=content,
                author=request.user,
                post=post,
                content_type='post',
            )

            blocked = _toxicity_response(result)
            if blocked:
                # Soft-delete the post so it isn't visible
                post.status = PostStatus.REPORTED
                post.save(update_fields=['status'])
                return blocked
        else:
            post = serializer.save()
        # ─────────────────────────────────────────────────────────────────

        return Response(
            PostSerializer(post, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        if post.author != request.user:
            return Response(
                {"error": "You can only edit your own posts"},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── Toxicity check on updated content ────────────────────────────
        new_content = request.data.get('content', '') or ''
        if new_content.strip():
            result = _run_toxicity_check(
                text=new_content,
                author=request.user,
                post=post,
                content_type='post',
            )
            blocked = _toxicity_response(result)
            if blocked:
                return blocked
        # ─────────────────────────────────────────────────────────────────

        serializer = PostUpdateSerializer(post, data=request.data, partial=True)
        if serializer.is_valid():
            updated_post = serializer.save()
            return Response(PostSerializer(updated_post, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        if post.author != request.user and not request.user.is_moderator:
            return Response(
                {"error": "You don't have permission to delete this post"},
                status=status.HTTP_403_FORBIDDEN
            )
        post.status = PostStatus.DELETED
        post.save()
        return Response({"message": "Post deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

    # ── Feed ──────────────────────────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='feed')
    def feed(self, request):
        user = request.user

        from friends.models import Friendship, FriendBlock
        friend_ids = Friendship.objects.filter(user=user).values_list('friend_id', flat=True)
        blocked_ids = FriendBlock.objects.filter(blocker=user).values_list('blocked_id', flat=True)
        blocked_by_ids = FriendBlock.objects.filter(blocked=user).values_list('blocker_id', flat=True)

        feed_posts = Post.objects.filter(
            status=PostStatus.PUBLISHED
        ).filter(
            Q(author=user) |
            Q(author__in=friend_ids) |
            (Q(privacy=PostPrivacy.PUBLIC) & ~Q(author=user))
        ).exclude(
            author__in=blocked_ids
        ).exclude(
            author__in=blocked_by_ids
        ).select_related('author').prefetch_related(
            'media', 'likes', 'comments'
        ).order_by('-created_at')

        page = self.paginate_queryset(feed_posts)
        if page is not None:
            serializer = FeedPostSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = FeedPostSerializer(feed_posts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-posts')
    def my_posts(self, request):
        posts = Post.objects.filter(
            author=request.user
        ).exclude(status=PostStatus.DELETED).order_by('-created_at')
        page = self.paginate_queryset(posts)
        if page is not None:
            return self.get_paginated_response(
                PostSerializer(page, many=True, context={'request': request}).data
            )
        return Response(PostSerializer(posts, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)/posts')
    def user_posts(self, request, user_id=None):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        target_user = get_object_or_404(User, id=user_id, is_active=True)
        current_user = request.user

        if target_user == current_user:
            posts = Post.objects.filter(author=target_user).exclude(status=PostStatus.DELETED)
        else:
            from friends.models import Friendship, FriendBlock
            if FriendBlock.objects.filter(blocker=target_user, blocked=current_user).exists():
                return Response({"error": "You cannot view this user's posts"}, status=403)

            are_friends = Friendship.objects.filter(user=target_user, friend=current_user).exists()
            if are_friends:
                posts = Post.objects.filter(
                    author=target_user, status=PostStatus.PUBLISHED
                ).exclude(privacy=PostPrivacy.ONLY_ME)
            else:
                posts = Post.objects.filter(
                    author=target_user, status=PostStatus.PUBLISHED, privacy=PostPrivacy.PUBLIC
                )

        posts = posts.order_by('-created_at')
        page = self.paginate_queryset(posts)
        if page is not None:
            return self.get_paginated_response(
                PostSerializer(page, many=True, context={'request': request}).data
            )
        return Response(PostSerializer(posts, many=True, context={'request': request}).data)

    # ── Like / Unlike ─────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='like')
    def like_post(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        if not post.can_view(request.user):
            return Response({"error": "You cannot interact with this post"}, status=403)

        serializer = ReactionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        reaction_type = serializer.validated_data['reaction_type']
        like, created = PostLike.objects.get_or_create(
            post=post, user=request.user,
            defaults={'reaction_type': reaction_type}
        )

        if not created:
            if like.reaction_type == reaction_type:
                like.is_active = False
                like.save()
                return Response({"message": "Reaction removed", "like_count": post.like_count, "user_reaction": None})
            like.reaction_type = reaction_type
            like.is_active = True
            like.save()

        return Response({
            "message": "Post liked" if created else "Reaction updated",
            "like_count": post.like_count,
            "user_reaction": reaction_type
        })

    @action(detail=True, methods=['post'], url_path='unlike')
    def unlike_post(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        like = PostLike.objects.filter(post=post, user=request.user).first()
        if like:
            like.is_active = False
            like.save()
        return Response({"message": "Like removed", "like_count": post.like_count, "user_reaction": None})

    @action(detail=True, methods=['get'], url_path='likes')
    def post_likes(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        if not post.can_view(request.user):
            return Response({"error": "You cannot view this post"}, status=403)
        likes = PostLike.objects.filter(post=post, is_active=True).select_related('user')
        page = self.paginate_queryset(likes)
        if page is not None:
            return self.get_paginated_response(PostLikeSerializer(page, many=True).data)
        return Response(PostLikeSerializer(likes, many=True).data)

    # ── Save / Bookmark ───────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='save')
    def save_post(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        if not post.can_view(request.user):
            return Response({"error": "You cannot save this post"}, status=403)
        saved, created = PostSave.objects.get_or_create(post=post, user=request.user)
        if not created:
            saved.delete()
            return Response({"message": "Post removed from saved", "saved": False})
        return Response({"message": "Post saved", "saved": True})

    @action(detail=False, methods=['get'], url_path='saved')
    def saved_posts(self, request):
        saved_posts = PostSave.objects.filter(user=request.user).select_related('post')
        posts = [sp.post for sp in saved_posts if sp.post.can_view(request.user)]
        page = self.paginate_queryset(posts)
        if page is not None:
            return self.get_paginated_response(
                PostSerializer(page, many=True, context={'request': request}).data
            )
        return Response(PostSerializer(posts, many=True, context={'request': request}).data)

    # ── Report ────────────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='report')
    def report_post(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        if post.author == request.user:
            return Response({"error": "You cannot report your own post"}, status=400)
        if PostReport.objects.filter(post=post, reporter=request.user).exists():
            return Response({"error": "You have already reported this post"}, status=400)

        serializer = PostReportSerializer(
            data=request.data,
            context={'request': request, 'post_id': post.id}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Post reported successfully"})
        return Response(serializer.errors, status=400)

    # ── Stats ─────────────────────────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='stats')
    def post_stats(self, request):
        if not request.user.can_manage_users():
            return Response({"error": "Only admins can view statistics"}, status=403)

        today = timezone.now().date()
        week_ago = today - timezone.timedelta(days=7)
        month_ago = today - timezone.timedelta(days=30)

        stats = {
            'total_posts': Post.objects.filter(status=PostStatus.PUBLISHED).count(),
            'today_posts': Post.objects.filter(created_at__date=today, status=PostStatus.PUBLISHED).count(),
            'week_posts': Post.objects.filter(created_at__date__gte=week_ago, status=PostStatus.PUBLISHED).count(),
            'month_posts': Post.objects.filter(created_at__date__gte=month_ago, status=PostStatus.PUBLISHED).count(),
            'total_likes': PostLike.objects.filter(is_active=True).count(),
            'total_comments': Comment.objects.filter(is_active=True).count(),
            'total_shares': Post.objects.filter(post_type=PostType.SHARE).count(),
            'posts_by_type': {
                'text': Post.objects.filter(post_type=PostType.TEXT).count(),
                'image': Post.objects.filter(post_type=PostType.IMAGE).count(),
                'video': Post.objects.filter(post_type=PostType.VIDEO).count(),
                'link': Post.objects.filter(post_type=PostType.LINK).count(),
                'share': Post.objects.filter(post_type=PostType.SHARE).count(),
            },
        }
        return Response(stats)

    # ── Admin actions ─────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='admin/hide', permission_classes=[CanModeratePost])
    def admin_hide_post(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        post.status = PostStatus.REPORTED
        post.save()
        return Response({"message": "Post hidden from feed"})

    @action(detail=True, methods=['post'], url_path='admin/restore', permission_classes=[CanModeratePost])
    def admin_restore_post(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        post.status = PostStatus.PUBLISHED
        post.save()
        return Response({"message": "Post restored"})

    @action(detail=True, methods=['delete'], url_path='admin/delete', permission_classes=[CanModeratePost])
    def admin_delete_post(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        post.status = PostStatus.DELETED
        post.save()
        return Response({"message": "Post deleted"})


# ── CommentViewSet ────────────────────────────────────────────────────────────

class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for comments — toxicity checked on create."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommentSerializer

    def get_queryset(self):
        user = self.request.user
        post_id = self.request.query_params.get('post_id')

        queryset = Comment.objects.filter(
            is_active=True, parent__isnull=True
        ).select_related('author', 'post')

        if post_id:
            post = get_object_or_404(Post, id=post_id)
            queryset = queryset.filter(post_id=post_id) if post.can_view(user) else queryset.none()

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateCommentSerializer
        return CommentSerializer

    def create(self, request):
        """Create a new comment — runs toxicity check before saving."""
        serializer = CreateCommentSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        content = request.data.get('content', '') or ''

        # ── Toxicity check ─────────────────────────────────────────────
        if content.strip():
            # Save first so we have the comment PK for the log
            comment = serializer.save()

            result = _run_toxicity_check(
                text=content,
                author=request.user,
                comment=comment,
                content_type='comment',
            )

            blocked = _toxicity_response(result)
            if blocked:
                comment.is_active = False
                comment.save(update_fields=['is_active'])
                return blocked
        else:
            comment = serializer.save()
        # ──────────────────────────────────────────────────────────────

        return Response(
            CommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, pk=None):
        comment = get_object_or_404(Comment, pk=pk)
        if comment.author != request.user and not request.user.is_moderator:
            return Response({"error": "You don't have permission to delete this comment"}, status=403)
        comment.is_active = False
        comment.save()
        return Response({"message": "Comment deleted"}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='like')
    def like_comment(self, request, pk=None):
        comment = get_object_or_404(Comment, pk=pk, is_active=True)
        like, created = CommentLike.objects.get_or_create(comment=comment, user=request.user)
        if not created:
            like.is_active = not like.is_active
            like.save()
            message = "Like removed" if not like.is_active else "Comment liked"
        else:
            message = "Comment liked"
        return Response({"message": message, "like_count": comment.like_count})

    @action(detail=True, methods=['get'], url_path='replies')
    def get_replies(self, request, pk=None):
        comment = get_object_or_404(Comment, pk=pk, is_active=True)
        replies = comment.replies.filter(is_active=True).select_related('author')
        page = self.paginate_queryset(replies)
        if page is not None:
            return self.get_paginated_response(
                CommentSerializer(page, many=True, context={'request': request}).data
            )
        return Response(CommentSerializer(replies, many=True, context={'request': request}).data)