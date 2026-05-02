from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import UserBehaviorProfile, BehaviorEvent
from .serializers import (
    UserBehaviorProfileSerializer,
    BehaviorEventSerializer,
    MyBehaviorStatusSerializer,
)
from .services import get_user_status


class BehaviorViewSet(viewsets.GenericViewSet):
    """
    Endpoints
    ---------
    GET  /api/behavior/my-status/                   — own behaviour profile
    GET  /api/behavior/profiles/                    — all profiles (admin)
    GET  /api/behavior/profiles/{id}/               — single profile (admin)
    POST /api/behavior/profiles/{id}/suspend/       — suspend user (admin)
    POST /api/behavior/profiles/{id}/lift-suspend/  — lift suspension (admin)
    GET  /api/behavior/events/                      — all events (admin)
    GET  /api/behavior/events/?user_id=X            — events for one user (admin)
    """

    permission_classes = [permissions.IsAuthenticated]

    # ------------------------------------------------------------------ #
    # Current user's own status                                            #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'], url_path='my-status')
    def my_status(self, request):
        """Return the logged-in user's behaviour profile (safe subset)."""
        profile, _ = UserBehaviorProfile.objects.get_or_create(user=request.user)
        return Response(MyBehaviorStatusSerializer(profile).data)

    # ------------------------------------------------------------------ #
    # Admin: profile list & detail                                         #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'], url_path='profiles')
    def list_profiles(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        qs = UserBehaviorProfile.objects.select_related('user').order_by('-toxic_count')

        # Optional filters
        level = request.query_params.get('warning_level')
        suspended = request.query_params.get('is_suspended')
        if level:
            qs = qs.filter(warning_level=level)
        if suspended is not None:
            qs = qs.filter(is_suspended=suspended.lower() == 'true')

        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(UserBehaviorProfileSerializer(page, many=True).data)
        return Response(UserBehaviorProfileSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path=r'profiles/(?P<profile_id>[^/.]+)')
    def profile_detail(self, request, profile_id=None):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)
        profile = get_object_or_404(UserBehaviorProfile, id=profile_id)
        return Response(UserBehaviorProfileSerializer(profile).data)

    # ------------------------------------------------------------------ #
    # Admin: suspend / lift                                                #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['post'], url_path=r'profiles/(?P<profile_id>[^/.]+)/suspend')
    def suspend_user(self, request, profile_id=None):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        profile = get_object_or_404(UserBehaviorProfile, id=profile_id)
        from django.utils import timezone
        hours = int(request.data.get('hours', 24))
        reason = request.data.get('reason', 'Manual suspension by admin.')

        profile.is_suspended    = True
        profile.suspended_until = timezone.now() + timezone.timedelta(hours=hours)
        profile.suspension_reason = reason
        profile.save()

        return Response({
            'message': f"User suspended for {hours} hours.",
            'suspended_until': profile.suspended_until,
        })

    @action(detail=False, methods=['post'], url_path=r'profiles/(?P<profile_id>[^/.]+)/lift-suspend')
    def lift_suspension(self, request, profile_id=None):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        profile = get_object_or_404(UserBehaviorProfile, id=profile_id)
        profile.is_suspended    = False
        profile.suspended_until = None
        profile.suspension_reason = None
        profile.save()

        return Response({'message': 'Suspension lifted.'})

    # ------------------------------------------------------------------ #
    # Admin: event log                                                     #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'], url_path='events')
    def list_events(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        qs = BehaviorEvent.objects.select_related('user', 'post', 'comment')

        # Optional filters
        user_id      = request.query_params.get('user_id')
        event_type   = request.query_params.get('event_type')
        content_type = request.query_params.get('content_type')

        if user_id:
            qs = qs.filter(user_id=user_id)
        if event_type:
            qs = qs.filter(event_type=event_type)
        if content_type:
            qs = qs.filter(content_type=content_type)

        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(BehaviorEventSerializer(page, many=True).data)
        return Response(BehaviorEventSerializer(qs, many=True).data)


# ──────────────────────────────────────────────────────────────
# SNA ViewSet  —  /api/behavior/sna/...
# ──────────────────────────────────────────────────────────────

from .sna_service import sna_service
from .serializers import SNAFullGraphSerializer, SNASummarySerializer


class SNAViewSet(viewsets.GenericViewSet):
    """
    Social Network Analysis endpoints (admin only).

    GET  /api/behavior/sna/graph/        — full graph (nodes + edges + summary)
    GET  /api/behavior/sna/summary/      — dashboard summary only
    GET  /api/behavior/sna/nodes/        — nodes list (filterable by node_type)
    GET  /api/behavior/sna/edges/        — edges list (filterable by edge_type)
    GET  /api/behavior/sna/user/<id>/    — single user node metrics
    """

    permission_classes = [permissions.IsAuthenticated]

    def _require_admin(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required.'}, status=403)
        return None

    # ── Full graph ────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='graph')
    def graph(self, request):
        err = self._require_admin(request)
        if err:
            return err

        nodes, edges, summary = sna_service.build_graph()

        data = SNAFullGraphSerializer({
            'nodes':   nodes,
            'edges':   edges,
            'summary': summary,
        }).data

        return Response(data)

    # ── Summary only (admin dashboard card) ──────────────────

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        err = self._require_admin(request)
        if err:
            return err

        _, __, summary = sna_service.build_graph()
        return Response(SNASummarySerializer(summary).data)

    # ── Nodes list ────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='nodes')
    def nodes(self, request):
        err = self._require_admin(request)
        if err:
            return err

        from .serializers import SNANodeSerializer
        nodes, _, __ = sna_service.build_graph()

        node_type = request.query_params.get('node_type')
        if node_type:
            nodes = [n for n in nodes if n.node_type == node_type]

        # Sort options
        sort_by = request.query_params.get('sort', 'degree_centrality')
        valid_sorts = {
            'degree_centrality', 'betweenness_centrality',
            'toxic_ratio', 'toxic_count', 'severity_score',
        }
        if sort_by in valid_sorts:
            nodes = sorted(nodes, key=lambda n: getattr(n, sort_by), reverse=True)

        return Response(SNANodeSerializer(nodes, many=True).data)

    # ── Edges list ────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='edges')
    def edges(self, request):
        err = self._require_admin(request)
        if err:
            return err

        from .serializers import SNAEdgeSerializer
        _, edges, __ = sna_service.build_graph()

        edge_type = request.query_params.get('edge_type')
        if edge_type:
            edges = [e for e in edges if e.edge_type == edge_type]

        edges = sorted(edges, key=lambda e: e.weight, reverse=True)
        return Response(SNAEdgeSerializer(edges, many=True).data)

    # ── Single user node metrics ──────────────────────────────

    @action(detail=False, methods=['get'], url_path=r'user/(?P<user_id>[^/.]+)')
    def user_node(self, request, user_id=None):
        err = self._require_admin(request)
        if err:
            return err

        from .serializers import SNANodeSerializer
        nodes, edges, _ = sna_service.build_graph()

        try:
            uid = int(user_id)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid user_id.'}, status=400)

        node = next((n for n in nodes if n.user_id == uid), None)
        if not node:
            return Response({'error': 'User not found in network.'}, status=404)

        # Include this user's edges too
        from .serializers import SNAEdgeSerializer
        user_edges = [e for e in edges if e.source == uid or e.target == uid]

        return Response({
            'node':  SNANodeSerializer(node).data,
            'edges': SNAEdgeSerializer(user_edges, many=True).data,
        })
