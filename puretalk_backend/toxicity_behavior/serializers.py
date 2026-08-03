from rest_framework import serializers
from .models import UserBehaviorProfile, BehaviorEvent, BehaviorPattern


class UserBehaviorProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    effective_threshold = serializers.SerializerMethodField()
    is_currently_suspended = serializers.SerializerMethodField()
    
    # Psychological fields
    psychological_summary = serializers.SerializerMethodField()
    psychological_recommendation = serializers.SerializerMethodField()

    class Meta:
        model = UserBehaviorProfile
        fields = [
            'id', 'user', 'user_email',
            'toxic_count', 'warning_count', 'blocked_count', 'severity_score',
            'warning_level',
            'is_suspended', 'is_currently_suspended',
            'suspended_until', 'suspension_reason',
            'effective_threshold',
            'first_offence_at', 'last_offence_at', 'updated_at',
            # Psychological fields
            'psychological_risk_score', 'psychological_pattern',
            'impulsivity_score', 'malice_score', 'escalation_risk', 
            'recovery_score', 'weighted_toxicity_score',
            'psychological_summary', 'psychological_recommendation',
        ]
        read_only_fields = fields

    def get_effective_threshold(self, obj):
        return round(obj.get_effective_threshold(), 4)

    def get_is_currently_suspended(self, obj):
        return obj.is_currently_suspended()
    
    def get_psychological_summary(self, obj):
        return obj.get_psychological_summary()
    
    def get_psychological_recommendation(self, obj):
        return obj._get_psychological_recommendation()


class BehaviorEventSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = BehaviorEvent
        fields = [
            'id', 'user', 'user_email',
            'content_type', 'post', 'comment',
            'analysed_text', 'toxicity_score', 'severity',
            'threshold_used', 'category_scores', 'flagged_labels',
            'event_type',
            'toxic_count_at_event', 'warning_level_at_event',
            'psych_risk_at_event', 'psych_pattern_at_event',
            'created_at',
        ]
        read_only_fields = fields


class MyBehaviorStatusSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the /my-status/ endpoint"""
    effective_threshold = serializers.SerializerMethodField()
    is_currently_suspended = serializers.SerializerMethodField()
    psychological_summary = serializers.SerializerMethodField()

    class Meta:
        model = UserBehaviorProfile
        fields = [
            'toxic_count', 'warning_level',
            'is_suspended', 'is_currently_suspended',
            'suspended_until',
            'effective_threshold',
            'severity_score',
            'psychological_risk_score', 'psychological_pattern',
            'psychological_summary',
        ]

    def get_effective_threshold(self, obj):
        return round(obj.get_effective_threshold(), 4)

    def get_is_currently_suspended(self, obj):
        return obj.is_currently_suspended()
    
    def get_psychological_summary(self, obj):
        summary = obj.get_psychological_summary()
        # Return user-friendly version without internal codes
        return {
            'risk_level': summary['risk_level'],
            'pattern': summary['pattern'],
            'description': summary['pattern_description'],
            'message': summary['summary']
        }


class PsychologicalProfileSerializer(serializers.Serializer):
    """Detailed psychological profile for research/admin"""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    
    # Core metrics
    risk_score = serializers.FloatField()
    risk_level = serializers.CharField()
    pattern = serializers.CharField()
    pattern_description = serializers.CharField()
    
    # Multi-dimensional scores
    impulsivity_score = serializers.FloatField()
    malice_score = serializers.FloatField()
    escalation_risk = serializers.FloatField()
    recovery_score = serializers.FloatField()
    
    # Weighted metrics
    weighted_toxicity = serializers.FloatField()
    severity_weighted_offenses = serializers.FloatField()
    
    # Counters
    toxic_count = serializers.IntegerField()
    severity_score = serializers.FloatField()
    
    # Recommendation
    recommended_action = serializers.CharField()
    recommended_days = serializers.IntegerField()
    recommendation_reason = serializers.CharField()
    
    # Summary
    behavioral_summary = serializers.CharField()


# SNA Serializers (unchanged)
class SNANodeSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    node_type = serializers.CharField()
    toxic_count = serializers.IntegerField()
    severity_score = serializers.FloatField()
    warning_level = serializers.CharField()
    is_suspended = serializers.BooleanField()
    degree_centrality = serializers.FloatField()
    in_degree_centrality = serializers.FloatField()
    out_degree_centrality = serializers.FloatField()
    betweenness_centrality = serializers.FloatField()
    clustering_coefficient = serializers.FloatField()
    total_interactions = serializers.IntegerField()
    toxic_interactions = serializers.IntegerField()
    toxic_ratio = serializers.FloatField()
    # Psychological fields for SNA (NEW)
    psychological_risk_score = serializers.FloatField()
    psychological_pattern = serializers.CharField()


class SNAEdgeSerializer(serializers.Serializer):
    source = serializers.IntegerField()
    target = serializers.IntegerField()
    weight = serializers.IntegerField()
    toxic_count = serializers.IntegerField()
    is_toxic_edge = serializers.BooleanField()
    max_toxicity_score = serializers.FloatField()
    flagged_labels = serializers.ListField(child=serializers.CharField())
    edge_type = serializers.CharField()


class SNASummarySerializer(serializers.Serializer):
    total_nodes = serializers.IntegerField()
    total_edges = serializers.IntegerField()
    toxic_nodes = serializers.IntegerField()
    at_risk_nodes = serializers.IntegerField()
    normal_nodes = serializers.IntegerField()
    toxic_edges = serializers.IntegerField()
    normal_edges = serializers.IntegerField()
    top_degree = serializers.ListField()
    top_betweenness = serializers.ListField()
    top_toxic_ratio = serializers.ListField()
    avg_clustering = serializers.FloatField()
    toxic_clusters = serializers.ListField()
    contagion_candidates = serializers.ListField()


class SNAFullGraphSerializer(serializers.Serializer):
    nodes = SNANodeSerializer(many=True)
    edges = SNAEdgeSerializer(many=True)
    summary = SNASummarySerializer()