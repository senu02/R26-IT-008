from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Count
from django.utils import timezone

from .models import UserBehaviorProfile, BehaviorEvent
from .serializers import (
    UserBehaviorProfileSerializer,
    BehaviorEventSerializer,
    MyBehaviorStatusSerializer,
    PsychologicalProfileSerializer,
)
from .services import get_user_status


class BehaviorViewSet(viewsets.GenericViewSet):
    """
    Endpoints for behavior management with psychological analysis
    """

    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='my-status')
    def my_status(self, request):
        """Return the logged-in user's behaviour profile with psychological analysis"""
        profile, _ = UserBehaviorProfile.objects.get_or_create(user=request.user)
        return Response(MyBehaviorStatusSerializer(profile).data)

    @action(detail=False, methods=['get'], url_path='my-psychological-profile')
    def my_psychological_profile(self, request):
        """Get detailed psychological analysis for the logged-in user"""
        profile, _ = UserBehaviorProfile.objects.get_or_create(user=request.user)
        psych_summary = profile.get_psychological_summary()
        
        return Response({
            'user_id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'psychological_profile': {
                'risk_score': profile.psychological_risk_score,
                'risk_level': psych_summary['risk_level'],
                'pattern': psych_summary['pattern'],
                'pattern_description': psych_summary['pattern_description'],
                'impulsivity_score': profile.impulsivity_score,
                'malice_score': profile.malice_score,
                'escalation_risk': profile.escalation_risk,
                'recovery_score': profile.recovery_score,
                'weighted_toxicity': profile.weighted_toxicity_score,
            },
            'behavioral_summary': psych_summary['summary'],
            'recommendation': psych_summary['recommendation'],
            'counters': {
                'toxic_count': profile.toxic_count,
                'warning_count': profile.warning_count,
                'blocked_count': profile.blocked_count,
                'severity_score': profile.severity_score,
            }
        })

    @action(detail=False, methods=['get'], url_path='profiles')
    def list_profiles(self, request):
        """List all user behavior profiles - sorted by psychological risk"""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        qs = UserBehaviorProfile.objects.select_related('user').order_by(
            '-psychological_risk_score', '-toxic_count'
        )
        
        # Filter out admin users
        qs = qs.exclude(
            Q(user__role='admin') | Q(user__role='super_admin')
        )

        # Optional filters (including psychological pattern)
        level = request.query_params.get('warning_level')
        suspended = request.query_params.get('is_suspended')
        pattern = request.query_params.get('psychological_pattern')
        
        if level:
            qs = qs.filter(warning_level=level)
        if suspended is not None:
            qs = qs.filter(is_suspended=suspended.lower() == 'true')
        if pattern:
            qs = qs.filter(psychological_pattern=pattern)

        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(UserBehaviorProfileSerializer(page, many=True).data)
        return Response(UserBehaviorProfileSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path=r'profiles/(?P<profile_id>[^/.]+)')
    def profile_detail(self, request, profile_id=None):
        """Get single user profile (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)
        
        profile = get_object_or_404(UserBehaviorProfile, id=profile_id)
        
        if profile.user.role in ['admin', 'super_admin']:
            return Response(
                {'error': 'Admin user profiles cannot be viewed here'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response(UserBehaviorProfileSerializer(profile).data)

    @action(detail=False, methods=['get'], url_path=r'users/(?P<user_id>[^/.]+)/psychological-analysis')
    def user_psychological_analysis(self, request, user_id=None):
        """
        Get detailed psychological analysis for a specific user (admin only)
        This is the main research endpoint
        """
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            target_user = User.objects.get(id=int(user_id))
        except (ValueError, User.DoesNotExist):
            return Response({'error': 'User not found'}, status=404)
        
        if target_user.role in ['admin', 'super_admin']:
            return Response({'error': 'Cannot analyze admin users'}, status=403)
        
        profile, _ = UserBehaviorProfile.objects.get_or_create(user=target_user)
        psych_summary = profile.get_psychological_summary()
        psych_rec = profile._get_psychological_recommendation()
        
        # Get recent events for trend analysis
        recent_events = BehaviorEvent.objects.filter(
            user=target_user
        ).order_by('-created_at')[:10]
        
        event_trend = []
        for event in reversed(recent_events):  # Oldest to newest
            event_trend.append({
                'date': event.created_at.strftime('%Y-%m-%d'),
                'severity': event.severity,
                'toxicity_score': event.toxicity_score,
                'event_type': event.event_type,
                'psych_risk': event.psych_risk_at_event,
            })
        
        return Response({
            'user': {
                'id': target_user.id,
                'username': target_user.username,
                'email': target_user.email,
                'account_status': target_user.account_status,
            },
            'psychological_profile': {
                'risk_score': profile.psychological_risk_score,
                'risk_level': psych_summary['risk_level'],
                'pattern': psych_summary['pattern'],
                'pattern_description': psych_summary['pattern_description'],
                'impulsivity_score': profile.impulsivity_score,
                'malice_score': profile.malice_score,
                'escalation_risk': profile.escalation_risk,
                'recovery_score': profile.recovery_score,
                'weighted_toxicity': profile.weighted_toxicity_score,
                'severity_weighted_offenses': profile.severity_weighted_offenses,
            },
            'behavioral_summary': psych_summary['summary'],
            'recommended_action': {
                'action': psych_rec['action'],
                'days': psych_rec['days'],
                'reason': psych_rec['reason'],
                'priority': psych_rec['priority'],
            },
            'counters': {
                'toxic_count': profile.toxic_count,
                'warning_count': profile.warning_count,
                'blocked_count': profile.blocked_count,
                'severity_score': profile.severity_score,
                'warning_level': profile.get_warning_level_display(),
            },
            'suspension_status': {
                'is_suspended': profile.is_suspended,
                'suspended_until': profile.suspended_until,
                'suspension_reason': profile.suspension_reason,
            },
            'recent_timeline': event_trend,
            'research_notes': {
                'analysis_based_on': 'Multi-dimensional psychological model',
                'metrics_used': ['Recency decay', 'Severity weighting', 'Pattern detection', 'Trend analysis'],
                'confidence': 'HIGH' if profile.toxic_count >= 3 else 'MEDIUM' if profile.toxic_count >= 1 else 'LOW',
            }
        })

    @action(detail=False, methods=['get'], url_path='psychological-stats')
    def psychological_stats(self, request):
        """Get aggregate psychological statistics for research (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)
        
        profiles = UserBehaviorProfile.objects.exclude(
            Q(user__role='admin') | Q(user__role='super_admin')
        )
        
        from collections import Counter
        
        pattern_counts = Counter(profiles.values_list('psychological_pattern', flat=True))
        
        # Risk distribution
        high_risk = profiles.filter(psychological_risk_score__gt=0.6).count()
        medium_risk = profiles.filter(psychological_risk_score__gt=0.3, psychological_risk_score__lte=0.6).count()
        low_risk = profiles.filter(psychological_risk_score__lte=0.3).count()
        
        # Pattern-specific stats
        pattern_stats = {}
        for pattern in ['one_off', 'chronic_low', 'escalating', 'malicious', 'recovering', 'impulsive']:
            pattern_profiles = profiles.filter(psychological_pattern=pattern)
            pattern_stats[pattern] = {
                'count': pattern_profiles.count(),
                'avg_risk': pattern_profiles.aggregate(Avg('psychological_risk_score'))['psychological_risk_score__avg'] or 0,
                'avg_toxic_count': pattern_profiles.aggregate(Avg('toxic_count'))['toxic_count__avg'] or 0,
                'suspended_count': pattern_profiles.filter(is_suspended=True).count(),
            }
        
        return Response({
            'total_users_analyzed': profiles.count(),
            'pattern_distribution': dict(pattern_counts),
            'risk_distribution': {
                'high_risk': high_risk,
                'medium_risk': medium_risk,
                'low_risk': low_risk,
            },
            'pattern_statistics': pattern_stats,
            'average_metrics': {
                'avg_psychological_risk': profiles.aggregate(Avg('psychological_risk_score'))['psychological_risk_score__avg'] or 0,
                'avg_malice_score': profiles.aggregate(Avg('malice_score'))['malice_score__avg'] or 0,
                'avg_impulsivity': profiles.aggregate(Avg('impulsivity_score'))['impulsivity_score__avg'] or 0,
                'avg_escalation_risk': profiles.aggregate(Avg('escalation_risk'))['escalation_risk__avg'] or 0,
            }
        })

    @action(detail=False, methods=['post'], url_path=r'profiles/(?P<profile_id>[^/.]+)/suspend')
    def suspend_user(self, request, profile_id=None):
        """Manually suspend a user (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        profile = get_object_or_404(UserBehaviorProfile, id=profile_id)
        
        if profile.user.role in ['admin', 'super_admin']:
            return Response(
                {'error': 'Cannot suspend admin users'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        from knox.models import AuthToken

        hours = int(request.data.get('hours', 24))
        reason = request.data.get('reason', f'Manual suspension by {request.user.email}')
        suspended_until = timezone.now() + timezone.timedelta(hours=hours)

        profile.is_suspended = True
        profile.suspended_until = suspended_until
        profile.suspension_reason = reason
        profile.save()

        user = profile.user
        user.account_status = 'suspended'
        user.suspended_until = suspended_until
        user.suspension_reason = reason
        user.save(update_fields=['account_status', 'suspended_until', 'suspension_reason'])

        AuthToken.objects.filter(user=user).delete()

        return Response({
            'message': f"User {user.email} suspended for {hours} hours.",
            'suspended_until': profile.suspended_until,
        })

    @action(detail=False, methods=['post'], url_path=r'profiles/(?P<profile_id>[^/.]+)/lift-suspend')
    def lift_suspension(self, request, profile_id=None):
        """Lift user suspension (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        profile = get_object_or_404(UserBehaviorProfile, id=profile_id)
        
        if profile.user.role in ['admin', 'super_admin']:
            return Response(
                {'error': 'Cannot modify admin users'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        profile.is_suspended = False
        profile.suspended_until = None
        profile.suspension_reason = None
        profile.save()

        user = profile.user
        user.account_status = 'active'
        user.suspended_until = None
        user.suspension_reason = None
        user.save(update_fields=['account_status', 'suspended_until', 'suspension_reason'])

        return Response({'message': f'Suspension lifted for {user.email}.'})

    @action(detail=False, methods=['post'], url_path=r'profiles/(?P<profile_id>[^/.]+)/reset')
    def reset_profile(self, request, profile_id=None):
        """Reset a user's behavior profile (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        profile = get_object_or_404(UserBehaviorProfile, id=profile_id)
        
        if profile.user.role in ['admin', 'super_admin']:
            return Response(
                {'error': 'Cannot reset admin user profiles'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Reset all fields including psychological
        profile.toxic_count = 0
        profile.warning_count = 0
        profile.blocked_count = 0
        profile.severity_score = 0.0
        profile.warning_level = 'none'
        profile.is_suspended = False
        profile.suspended_until = None
        profile.suspension_reason = None
        profile.first_offence_at = None
        profile.last_offence_at = None
        
        # Reset psychological fields
        profile.psychological_risk_score = 0.0
        profile.psychological_pattern = 'one_off'
        profile.impulsivity_score = 0.0
        profile.malice_score = 0.0
        profile.escalation_risk = 0.0
        profile.recovery_score = 0.0
        profile.weighted_toxicity_score = 0.0
        profile.severity_weighted_offenses = 0.0
        
        profile.save()

        user = profile.user
        if user.account_status == 'suspended':
            user.account_status = 'active'
            user.suspended_until = None
            user.suspension_reason = None
            user.save(update_fields=['account_status', 'suspended_until', 'suspension_reason'])

        return Response({'message': f'Behavior profile reset for {user.email}.'})

    @action(detail=False, methods=['get'], url_path='events')
    def list_events(self, request):
        """List behavior events (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        qs = BehaviorEvent.objects.select_related('user', 'post', 'comment').exclude(
            Q(user__role='admin') | Q(user__role='super_admin')
        )

        user_id = request.query_params.get('user_id')
        event_type = request.query_params.get('event_type')
        content_type = request.query_params.get('content_type')
        psych_pattern = request.query_params.get('psych_pattern')

        if user_id:
            qs = qs.filter(user_id=user_id)
        if event_type:
            qs = qs.filter(event_type=event_type)
        if content_type:
            qs = qs.filter(content_type=content_type)
        if psych_pattern:
            qs = qs.filter(psych_pattern_at_event=psych_pattern)

        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(BehaviorEventSerializer(page, many=True).data)
        return Response(BehaviorEventSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='analytics/summary')
    def analytics_summary(self, request):
        """Get overall behavior analytics summary (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        profiles = UserBehaviorProfile.objects.exclude(
            Q(user__role='admin') | Q(user__role='super_admin')
        )
        
        week_ago = timezone.now() - timezone.timedelta(days=7)
        
        analytics = {
            'overview': {
                'total_users_tracked': profiles.count(),
                'total_toxic_users': profiles.filter(toxic_count__gte=1).count(),
                'suspended_users': profiles.filter(is_suspended=True).count(),
                'severe_users': profiles.filter(warning_level='severe').count(),
                'moderate_users': profiles.filter(warning_level='moderate').count(),
                'mild_users': profiles.filter(warning_level='mild').count(),
                'average_severity': round(profiles.aggregate(Avg('severity_score'))['severity_score__avg'] or 0, 3),
                'total_offenses': profiles.aggregate(Count('toxic_count'))['toxic_count__count'] or 0,
            },
            'psychological_summary': {
                'avg_psychological_risk': round(profiles.aggregate(Avg('psychological_risk_score'))['psychological_risk_score__avg'] or 0, 3),
                'pattern_distribution': {
                    'one_off': profiles.filter(psychological_pattern='one_off').count(),
                    'chronic_low': profiles.filter(psychological_pattern='chronic_low').count(),
                    'escalating': profiles.filter(psychological_pattern='escalating').count(),
                    'malicious': profiles.filter(psychological_pattern='malicious').count(),
                    'recovering': profiles.filter(psychological_pattern='recovering').count(),
                    'impulsive': profiles.filter(psychological_pattern='impulsive').count(),
                },
                'high_risk_users_count': profiles.filter(psychological_risk_score__gt=0.6).count(),
                'escalating_users_count': profiles.filter(psychological_pattern='escalating').count(),
                'malicious_users_count': profiles.filter(psychological_pattern='malicious').count(),
            },
            'distribution': {
                'by_warning_level': {
                    'none': profiles.filter(warning_level='none').count(),
                    'mild': profiles.filter(warning_level='mild').count(),
                    'moderate': profiles.filter(warning_level='moderate').count(),
                    'severe': profiles.filter(warning_level='severe').count(),
                },
                'by_toxic_count_range': {
                    '0': profiles.filter(toxic_count=0).count(),
                    '1-2': profiles.filter(toxic_count__gte=1, toxic_count__lte=2).count(),
                    '3-4': profiles.filter(toxic_count__gte=3, toxic_count__lte=4).count(),
                    '5-9': profiles.filter(toxic_count__gte=5, toxic_count__lte=9).count(),
                    '10+': profiles.filter(toxic_count__gte=10).count(),
                }
            },
            'weekly_trends': {
                'offenses_last_7_days': BehaviorEvent.objects.filter(
                    event_type='blocked',
                    created_at__gte=week_ago
                ).exclude(
                    Q(user__role='admin') | Q(user__role='super_admin')
                ).count(),
                'suspensions_last_7_days': BehaviorEvent.objects.filter(
                    event_type='suspended',
                    created_at__gte=week_ago
                ).exclude(
                    Q(user__role='admin') | Q(user__role='super_admin')
                ).count(),
            },
            'high_risk_users': UserBehaviorProfileSerializer(
                profiles.filter(psychological_risk_score__gt=0.5).order_by('-psychological_risk_score')[:10],
                many=True
            ).data
        }
        
        return Response(analytics)

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)/timeline')
    def user_timeline(self, request, user_id=None):
        """Get a user's behavior timeline with psychological metrics (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)
        
        try:
            user_id = int(user_id)
        except ValueError:
            return Response({'error': 'Invalid user ID'}, status=400)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            target_user = User.objects.get(id=user_id)
            if target_user.role in ['admin', 'super_admin']:
                return Response({'error': 'Cannot view admin user timeline'}, status=403)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        events = BehaviorEvent.objects.filter(user_id=user_id).order_by('-created_at')[:50]
        
        timeline = []
        for event in events:
            timeline.append({
                'date': event.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'event_type': event.event_type,
                'toxicity_score': event.toxicity_score,
                'severity': event.severity,
                'threshold_used': event.threshold_used,
                'toxic_count_at_event': event.toxic_count_at_event,
                'flagged_labels': event.flagged_labels,
                'psych_risk_at_event': event.psych_risk_at_event,
                'psych_pattern_at_event': event.psych_pattern_at_event,
            })
        
        return Response({
            'user_id': user_id,
            'user_email': target_user.email,
            'total_events': events.count(),
            'timeline': timeline
        })


# SNA ViewSet (Updated with psychological node data)
from .sna_service import sna_service
from .serializers import SNAFullGraphSerializer, SNASummarySerializer, SNANodeSerializer, SNAEdgeSerializer


class SNAViewSet(viewsets.GenericViewSet):
    """
    Social Network Analysis endpoints with psychological metrics (admin only)
    """

    permission_classes = [permissions.IsAuthenticated]

    def _require_admin(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required.'}, status=403)
        return None

    @action(detail=False, methods=['get'], url_path='graph')
    def graph(self, request):
        """Get full graph with nodes (including psychological metrics), edges, and summary"""
        err = self._require_admin(request)
        if err:
            return err

        nodes, edges, summary = sna_service.build_graph()
        
        data = SNAFullGraphSerializer({
            'nodes': nodes,
            'edges': edges,
            'summary': summary,
        }).data
        
        return Response(data)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """Get dashboard summary only"""
        err = self._require_admin(request)
        if err:
            return err

        _, __, summary = sna_service.build_graph()
        return Response(SNASummarySerializer(summary).data)

    @action(detail=False, methods=['get'], url_path='nodes')
    def nodes(self, request):
        """Get nodes list with psychological filtering options"""
        err = self._require_admin(request)
        if err:
            return err

        nodes, _, __ = sna_service.build_graph()

        # Filter by node type
        node_type = request.query_params.get('node_type')
        if node_type:
            nodes = [n for n in nodes if n.node_type == node_type]
        
        # Filter by psychological pattern
        psych_pattern = request.query_params.get('psychological_pattern')
        if psych_pattern:
            nodes = [n for n in nodes if getattr(n, 'psychological_pattern', '') == psych_pattern]

        # Filter by risk level
        risk_min = request.query_params.get('risk_min')
        if risk_min:
            nodes = [n for n in nodes if getattr(n, 'psychological_risk_score', 0) >= float(risk_min)]

        # Filter by suspended status
        suspended = request.query_params.get('is_suspended')
        if suspended is not None:
            is_suspended = suspended.lower() == 'true'
            nodes = [n for n in nodes if n.is_suspended == is_suspended]

        # Sort options
        sort_by = request.query_params.get('sort', 'psychological_risk_score')
        valid_sorts = {
            'degree_centrality', 'betweenness_centrality',
            'toxic_ratio', 'toxic_count', 'severity_score',
            'psychological_risk_score', 'malice_score', 'escalation_risk'
        }
        if sort_by in valid_sorts:
            nodes = sorted(nodes, key=lambda n: getattr(n, sort_by, 0), reverse=True)

        # Pagination
        page_size = int(request.query_params.get('page_size', 50))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_nodes = nodes[start:end]
        
        return Response({
            'total': len(nodes),
            'page': page,
            'page_size': page_size,
            'nodes': SNANodeSerializer(paginated_nodes, many=True).data
        })

    @action(detail=False, methods=['get'], url_path='edges')
    def edges(self, request):
        """Get edges list with filtering options"""
        err = self._require_admin(request)
        if err:
            return err

        _, edges, __ = sna_service.build_graph()

        edge_type = request.query_params.get('edge_type')
        if edge_type:
            edges = [e for e in edges if e.edge_type == edge_type]

        is_toxic = request.query_params.get('is_toxic_edge')
        if is_toxic is not None:
            is_toxic_edge = is_toxic.lower() == 'true'
            edges = [e for e in edges if e.is_toxic_edge == is_toxic_edge]

        edges = sorted(edges, key=lambda e: e.weight, reverse=True)

        page_size = int(request.query_params.get('page_size', 100))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_edges = edges[start:end]
        
        return Response({
            'total': len(edges),
            'page': page,
            'page_size': page_size,
            'edges': SNAEdgeSerializer(paginated_edges, many=True).data
        })