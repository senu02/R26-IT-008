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
    PostReportSerializer, FeedPostSerializer, PostStatsSerializer
)
from .permissions import IsAuthorOrReadOnly, CanModeratePost, CanDeleteAnyPost, CanViewPost


class PostViewSet(viewsets.ModelViewSet):
    """ViewSet for Post CRUD operations"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PostSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Base queryset with necessary prefetch
        base_qs = Post.objects.select_related('author').prefetch_related(
            'media', 'likes', 'comments', 'shares'
        ).filter(status=PostStatus.PUBLISHED)
        
        if user.is_authenticated:
            # Get friends list
            from friends.models import Friendship
            friend_ids = Friendship.objects.filter(
                user=user
            ).values_list('friend_id', flat=True)
            
            # Posts that user can see:
            # 1. Public posts
            # 2. Friends-only posts from friends
            # 3. User's own posts
            # 4. Posts from users that haven't blocked them
            from friends.models import FriendBlock
            blocked_by_ids = FriendBlock.objects.filter(
                blocked=user
            ).values_list('blocker_id', flat=True)
            
            qs = base_qs.filter(
                Q(privacy=PostPrivacy.PUBLIC) |
                Q(author=user) |
                (Q(privacy=PostPrivacy.FRIENDS) & Q(author__in=friend_ids))
            ).exclude(
                author__in=blocked_by_ids
            )
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
        """List posts with pagination"""
        page = self.paginate_queryset(self.get_queryset())
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(self.get_queryset(), many=True, context={'request': request})
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get single post with view permission check"""
        post = get_object_or_404(Post, pk=pk)
        
        # Check view permission
        if not post.can_view(request.user):
            return Response(
                {"error": "You don't have permission to view this post"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(post, context={'request': request})
        return Response(serializer.data)
    
    def create(self, request):
        """Create a new post"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            post = serializer.save()
            return Response(
                PostSerializer(post, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, pk=None):
        """Update a post"""
        post = get_object_or_404(Post, pk=pk)
        
        if post.author != request.user:
            return Response(
                {"error": "You can only edit your own posts"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = PostUpdateSerializer(post, data=request.data, partial=True)
        if serializer.is_valid():
            updated_post = serializer.save()
            return Response(PostSerializer(updated_post, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """Delete a post (soft delete)"""
        post = get_object_or_404(Post, pk=pk)
        
        if post.author != request.user and not request.user.is_moderator:
            return Response(
                {"error": "You don't have permission to delete this post"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        post.status = PostStatus.DELETED
        post.save()
        
        return Response(
            {"message": "Post deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=False, methods=['get'], url_path='feed')
    def feed(self, request):
        """Get user's feed (posts from friends and pages)"""
        user = request.user
        
        # Get friends
        from friends.models import Friendship
        friend_ids = Friendship.objects.filter(user=user).values_list('friend_id', flat=True)
        
        # Get blocked users
        from friends.models import FriendBlock
        blocked_ids = FriendBlock.objects.filter(blocker=user).values_list('blocked_id', flat=True)
        blocked_by_ids = FriendBlock.objects.filter(blocked=user).values_list('blocker_id', flat=True)
        
        # Feed posts: from user, friends, and public posts
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
        
        # Pagination
        page = self.paginate_queryset(feed_posts)
        if page is not None:
            serializer = FeedPostSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = FeedPostSerializer(feed_posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='my-posts')
    def my_posts(self, request):
        """Get current user's posts"""
        user = request.user
        posts = Post.objects.filter(
            author=user
        ).exclude(
            status=PostStatus.DELETED
        ).order_by('-created_at')
        
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)/posts')
    def user_posts(self, request, user_id=None):
        """Get posts by a specific user"""
        target_user = get_object_or_404(User, id=user_id, is_active=True)
        current_user = request.user
        
        # Check privacy
        if target_user == current_user:
            posts = Post.objects.filter(author=target_user).exclude(status=PostStatus.DELETED)
        else:
            from friends.models import Friendship, FriendBlock
            
            # Check if blocked
            if FriendBlock.objects.filter(blocker=target_user, blocked=current_user).exists():
                return Response(
                    {"error": "You cannot view this user's posts"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            are_friends = Friendship.objects.filter(user=target_user, friend=current_user).exists()
            
            if are_friends:
                posts = Post.objects.filter(
                    author=target_user,
                    status=PostStatus.PUBLISHED
                ).exclude(privacy=PostPrivacy.ONLY_ME)
            else:
                posts = Post.objects.filter(
                    author=target_user,
                    status=PostStatus.PUBLISHED,
                    privacy=PostPrivacy.PUBLIC
                )
        
        posts = posts.order_by('-created_at')
        page = self.paginate_queryset(posts)
        
        if page is not None:
            serializer = PostSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='like')
    def like_post(self, request, pk=None):
        """Like or react to a post"""
        post = get_object_or_404(Post, pk=pk)
        
        # Check if user can see the post
        if not post.can_view(request.user):
            return Response(
                {"error": "You cannot interact with this post"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ReactionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        reaction_type = serializer.validated_data['reaction_type']
        
        like, created = PostLike.objects.get_or_create(
            post=post,
            user=request.user,
            defaults={'reaction_type': reaction_type}
        )
        
        if not created:
            if like.reaction_type == reaction_type:
                # Remove like if same reaction
                like.is_active = False
                like.save()
                return Response({
                    "message": "Reaction removed",
                    "like_count": post.like_count,
                    "user_reaction": None
                })
            else:
                # Update reaction
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
        """Remove like from a post"""
        post = get_object_or_404(Post, pk=pk)
        
        like = PostLike.objects.filter(post=post, user=request.user).first()
        if like:
            like.is_active = False
            like.save()
        
        return Response({
            "message": "Like removed",
            "like_count": post.like_count,
            "user_reaction": None
        })
    
    @action(detail=True, methods=['get'], url_path='likes')
    def post_likes(self, request, pk=None):
        """Get users who liked the post"""
        post = get_object_or_404(Post, pk=pk)
        
        if not post.can_view(request.user):
            return Response(
                {"error": "You cannot view this post"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        likes = PostLike.objects.filter(post=post, is_active=True).select_related('user')
        
        page = self.paginate_queryset(likes)
        if page is not None:
            serializer = PostLikeSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PostLikeSerializer(likes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='save')
    def save_post(self, request, pk=None):
        """Save/Bookmark a post"""
        post = get_object_or_404(Post, pk=pk)
        
        if not post.can_view(request.user):
            return Response(
                {"error": "You cannot save this post"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        saved, created = PostSave.objects.get_or_create(
            post=post,
            user=request.user
        )
        
        if not created:
            saved.delete()
            return Response({"message": "Post removed from saved", "saved": False})
        
        return Response({"message": "Post saved", "saved": True})
    
    @action(detail=False, methods=['get'], url_path='saved')
    def saved_posts(self, request):
        """Get user's saved/bookmarked posts"""
        saved_posts = PostSave.objects.filter(user=request.user).select_related('post')
        
        posts = [sp.post for sp in saved_posts if sp.post.can_view(request.user)]
        
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='report')
    def report_post(self, request, pk=None):
        """Report a post for inappropriate content"""
        post = get_object_or_404(Post, pk=pk)
        
        if post.author == request.user:
            return Response(
                {"error": "You cannot report your own post"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already reported
        existing_report = PostReport.objects.filter(
            post=post,
            reporter=request.user
        ).first()
        
        if existing_report:
            return Response(
                {"error": "You have already reported this post"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PostReportSerializer(
            data=request.data,
            context={'request': request, 'post_id': post.id}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Post reported successfully"})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='stats')
    def post_stats(self, request):
        """Get post statistics (admin only)"""
        if not request.user.can_manage_users():
            return Response(
                {"error": "Only admins can view statistics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        today = timezone.now().date()
        week_ago = today - timezone.timedelta(days=7)
        month_ago = today - timezone.timedelta(days=30)
        
        stats = {
            'total_posts': Post.objects.filter(status=PostStatus.PUBLISHED).count(),
            'today_posts': Post.objects.filter(
                created_at__date=today,
                status=PostStatus.PUBLISHED
            ).count(),
            'week_posts': Post.objects.filter(
                created_at__date__gte=week_ago,
                status=PostStatus.PUBLISHED
            ).count(),
            'month_posts': Post.objects.filter(
                created_at__date__gte=month_ago,
                status=PostStatus.PUBLISHED
            ).count(),
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
            'top_posts': PostSerializer(
                Post.objects.filter(status=PostStatus.PUBLISHED)
                .annotate(total_engagement=F('like_count') + F('comment_count') + F('share_count'))
                .order_by('-total_engagement')[:10],
                many=True,
                context={'request': request}
            ).data
        }
        
        return Response(stats)
    
    # Admin/Moderator Actions
    
    @action(
        detail=True,
        methods=['post'],
        url_path='admin/hide',
        permission_classes=[CanModeratePost]
    )
    def admin_hide_post(self, request, pk=None):
        """Admin/Moderator: Hide a post"""
        post = get_object_or_404(Post, pk=pk)
        
        post.status = PostStatus.REPORTED
        post.save()
        
        return Response({"message": "Post hidden from feed"})
    
    @action(
        detail=True,
        methods=['post'],
        url_path='admin/restore',
        permission_classes=[CanModeratePost]
    )
    def admin_restore_post(self, request, pk=None):
        """Admin/Moderator: Restore a hidden post"""
        post = get_object_or_404(Post, pk=pk)
        
        post.status = PostStatus.PUBLISHED
        post.save()
        
        return Response({"message": "Post restored"})
    
    @action(
        detail=True,
        methods=['delete'],
        url_path='admin/delete',
        permission_classes=[CanModeratePost]
    )
    def admin_delete_post(self, request, pk=None):
        """Admin/Moderator: Permanently delete a post"""
        post = get_object_or_404(Post, pk=pk)
        
        post.status = PostStatus.DELETED
        post.save()
        
        return Response({"message": "Post deleted"})


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for comments"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommentSerializer
    
    def get_queryset(self):
        user = self.request.user
        post_id = self.request.query_params.get('post_id')
        
        queryset = Comment.objects.filter(
            is_active=True,
            parent__isnull=True
        ).select_related('author', 'post')
        
        if post_id:
            post = get_object_or_404(Post, id=post_id)
            if post.can_view(user):
                queryset = queryset.filter(post_id=post_id)
            else:
                queryset = queryset.none()
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateCommentSerializer
        return CommentSerializer
    
    def create(self, request):
        """Create a new comment"""
        serializer = CreateCommentSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            comment = serializer.save()
            return Response(
                CommentSerializer(comment, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """Delete a comment (soft delete)"""
        comment = get_object_or_404(Comment, pk=pk)
        
        if comment.author != request.user and not request.user.is_moderator:
            return Response(
                {"error": "You don't have permission to delete this comment"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        comment.is_active = False
        comment.save()
        
        return Response(
            {"message": "Comment deleted"},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=True, methods=['post'], url_path='like')
    def like_comment(self, request, pk=None):
        """Like a comment"""
        comment = get_object_or_404(Comment, pk=pk, is_active=True)
        
        like, created = CommentLike.objects.get_or_create(
            comment=comment,
            user=request.user
        )
        
        if not created:
            like.is_active = not like.is_active
            like.save()
            message = "Like removed" if not like.is_active else "Comment liked"
        else:
            message = "Comment liked"
        
        return Response({
            "message": message,
            "like_count": comment.like_count
        })
    
    @action(detail=True, methods=['get'], url_path='replies')
    def get_replies(self, request, pk=None):
        """Get replies for a comment"""
        comment = get_object_or_404(Comment, pk=pk, is_active=True)
        
        replies = comment.replies.filter(is_active=True).select_related('author')
        
        page = self.paginate_queryset(replies)
        if page is not None:
            serializer = CommentSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = CommentSerializer(replies, many=True, context={'request': request})
        return Response(serializer.data)