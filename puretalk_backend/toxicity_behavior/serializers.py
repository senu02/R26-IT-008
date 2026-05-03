from rest_framework import serializers
from .models import UserBehaviorProfile, BehaviorEvent


class UserBehaviorProfileSerializer(serializers.ModelSerializer):
    user_email           = serializers.EmailField(source='user.email', read_only=True)
    effective_threshold  = serializers.SerializerMethodField()
    is_currently_suspended = serializers.SerializerMethodField()

    class Meta:
        model  = UserBehaviorProfile
        fields = [
            'id', 'user', 'user_email',
            'toxic_count', 'warning_count', 'blocked_count', 'severity_score',
            'warning_level',
            'is_suspended', 'is_currently_suspended',
            'suspended_until', 'suspension_reason',
            'effective_threshold',
            'first_offence_at', 'last_offence_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_effective_threshold(self, obj):
        return round(obj.get_effective_threshold(), 4)

    def get_is_currently_suspended(self, obj):
        return obj.is_currently_suspended()


class BehaviorEventSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model  = BehaviorEvent
        fields = [
            'id', 'user', 'user_email',
            'content_type', 'post', 'comment',
            'analysed_text', 'toxicity_score', 'severity',
            'threshold_used', 'category_scores', 'flagged_labels',
            'event_type',
            'toxic_count_at_event', 'warning_level_at_event',
            'created_at',
        ]
        read_only_fields = fields


class MyBehaviorStatusSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the /my-status/ endpoint (no admin-only fields)."""
    effective_threshold    = serializers.SerializerMethodField()
    is_currently_suspended = serializers.SerializerMethodField()

    class Meta:
        model  = UserBehaviorProfile
        fields = [
            'toxic_count', 'warning_level',
            'is_suspended', 'is_currently_suspended',
            'suspended_until',
            'effective_threshold',
            'severity_score',
        ]

    def get_effective_threshold(self, obj):
        return round(obj.get_effective_threshold(), 4)

    def get_is_currently_suspended(self, obj):
        return obj.is_currently_suspended()


# ──────────────────────────────────────────────────────────────
# SNA Serializers
# ──────────────────────────────────────────────────────────────

class SNANodeSerializer(serializers.Serializer):
    user_id                 = serializers.IntegerField()
    username                = serializers.CharField()
    node_type               = serializers.CharField()   # normal | at_risk | toxic
    toxic_count             = serializers.IntegerField()
    severity_score          = serializers.FloatField()
    warning_level           = serializers.CharField()
    is_suspended            = serializers.BooleanField()
    degree_centrality       = serializers.FloatField()
    in_degree_centrality    = serializers.FloatField()
    out_degree_centrality   = serializers.FloatField()
    betweenness_centrality  = serializers.FloatField()
    clustering_coefficient  = serializers.FloatField()
    total_interactions      = serializers.IntegerField()
    toxic_interactions      = serializers.IntegerField()
    toxic_ratio             = serializers.FloatField()


class SNAEdgeSerializer(serializers.Serializer):
    source                  = serializers.IntegerField()
    target                  = serializers.IntegerField()
    weight                  = serializers.IntegerField()
    toxic_count             = serializers.IntegerField()
    is_toxic_edge           = serializers.BooleanField()
    max_toxicity_score      = serializers.FloatField()
    flagged_labels          = serializers.ListField(child=serializers.CharField())
    edge_type               = serializers.CharField()   # normal | mixed | toxic_reply


class SNASummarySerializer(serializers.Serializer):
    total_nodes             = serializers.IntegerField()
    total_edges             = serializers.IntegerField()
    toxic_nodes             = serializers.IntegerField()
    at_risk_nodes           = serializers.IntegerField()
    normal_nodes            = serializers.IntegerField()
    toxic_edges             = serializers.IntegerField()
    normal_edges            = serializers.IntegerField()
    top_degree              = serializers.ListField()
    top_betweenness         = serializers.ListField()
    top_toxic_ratio         = serializers.ListField()
    avg_clustering          = serializers.FloatField()
    toxic_clusters          = serializers.ListField()
    contagion_candidates    = serializers.ListField()


class SNAFullGraphSerializer(serializers.Serializer):
    nodes   = SNANodeSerializer(many=True)
    edges   = SNAEdgeSerializer(many=True)
    summary = SNASummarySerializer()
