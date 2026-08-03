"""
Social Network Analysis Service
Builds a directed interaction graph from comments and computes network metrics.
Excludes admin and super_admin users from analysis.
Includes psychological metrics for research.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Any

try:
    import networkx as nx
    HAS_NX = True
except ImportError:
    HAS_NX = False


@dataclass
class NodeData:
    """Node representing a user in the network with psychological metrics"""
    user_id: int
    username: str
    node_type: str          # normal | at_risk | toxic
    toxic_count: int
    severity_score: float
    warning_level: str
    is_suspended: bool
    # Psychological metrics (NEW)
    psychological_risk_score: float = 0.0
    psychological_pattern: str = 'one_off'
    malice_score: float = 0.0
    impulsivity_score: float = 0.0
    escalation_risk: float = 0.0
    # SNA metrics
    degree_centrality: float = 0.0
    in_degree_centrality: float = 0.0
    out_degree_centrality: float = 0.0
    betweenness_centrality: float = 0.0
    clustering_coefficient: float = 0.0
    total_interactions: int = 0
    toxic_interactions: int = 0
    toxic_ratio: float = 0.0


@dataclass
class EdgeData:
    """Edge representing interactions between users"""
    source: int
    target: int
    weight: int
    toxic_count: int
    is_toxic_edge: bool
    max_toxicity_score: float
    flagged_labels: list[str]
    edge_type: str


@dataclass
class NetworkSummary:
    """Summary statistics of the network"""
    total_nodes: int
    total_edges: int
    toxic_nodes: int
    at_risk_nodes: int
    normal_nodes: int
    toxic_edges: int
    normal_edges: int
    top_degree: list[dict]
    top_betweenness: list[dict]
    top_toxic_ratio: list[dict]
    avg_clustering: float
    toxic_clusters: list[list[int]]
    contagion_candidates: list[dict]


class SNAService:
    """
    Build a directed interaction graph with psychological metrics.
    """

    def build_graph(self) -> tuple[list[NodeData], list[EdgeData], NetworkSummary]:
        nodes_map = self._load_nodes()
        edges = self._load_edges(nodes_map)

        if HAS_NX:
            self._compute_metrics_nx(nodes_map, edges)
        else:
            self._compute_metrics_basic(nodes_map, edges)

        self._compute_interaction_counts(nodes_map, edges)
        self._compute_toxic_ratios(nodes_map)

        nodes = list(nodes_map.values())
        summary = self._build_summary(nodes, edges, nodes_map)

        return nodes, edges, summary

    def _load_nodes(self) -> dict[int, NodeData]:
        """Load all non-admin users with their behavior and psychological profiles"""
        from django.contrib.auth import get_user_model
        from toxicity_behavior.models import UserBehaviorProfile

        User = get_user_model()

        behavior_map = {
            p.user_id: p
            for p in UserBehaviorProfile.objects.select_related('user').all()
        }

        nodes: dict[int, NodeData] = {}

        for user in User.objects.exclude(role__in=['admin', 'super_admin']):
            bp = behavior_map.get(user.id)

            toxic_count = bp.toxic_count if bp else 0
            severity = bp.severity_score if bp else 0.0
            warning_level = bp.warning_level if bp else 'none'
            is_suspended = bp.is_suspended if bp else False
            
            # Get psychological metrics
            psych_risk = bp.psychological_risk_score if bp else 0.0
            psych_pattern = bp.psychological_pattern if bp else 'one_off'
            malice = bp.malice_score if bp else 0.0
            impulsivity = bp.impulsivity_score if bp else 0.0
            escalation = bp.escalation_risk if bp else 0.0

            # Classify node type (now also based on psychological risk)
            if is_suspended or toxic_count >= 5 or psych_risk > 0.6:
                node_type = 'toxic'
            elif toxic_count >= 1 or warning_level != 'none' or psych_risk > 0.3:
                node_type = 'at_risk'
            else:
                node_type = 'normal'

            nodes[user.id] = NodeData(
                user_id=user.id,
                username=user.username,
                node_type=node_type,
                toxic_count=toxic_count,
                severity_score=round(severity, 4),
                warning_level=warning_level,
                is_suspended=is_suspended,
                psychological_risk_score=round(psych_risk, 4),
                psychological_pattern=psych_pattern,
                malice_score=round(malice, 4),
                impulsivity_score=round(impulsivity, 4),
                escalation_risk=round(escalation, 4),
            )

        return nodes

    def _load_edges(self, nodes_map: dict[int, NodeData]) -> list[EdgeData]:
        """Load all comment interactions between users"""
        from posts.models import Comment
        from toxicity_detection.models import ToxicityLog

        tox_by_comment: dict[int, Any] = {
            t.comment_id: t
            for t in ToxicityLog.objects.filter(content_type='comment')
            if t.comment_id is not None
        }

        edge_acc: dict[tuple[int, int], dict] = defaultdict(lambda: {
            'total': 0,
            'toxic': 0,
            'max_score': 0.0,
            'labels': set(),
        })

        comments = (
            Comment.objects
            .select_related('author', 'post__author')
            .filter(
                author_id__in=nodes_map,
                post__author_id__in=nodes_map,
                is_active=True
            )
        )

        for comment in comments:
            src = comment.author_id
            tgt = comment.post.author_id
            
            if src == tgt:
                continue

            s = edge_acc[(src, tgt)]
            s['total'] += 1

            tlog = tox_by_comment.get(comment.id)
            if tlog and tlog.is_toxic:
                s['toxic'] += 1
                s['max_score'] = max(s['max_score'], tlog.max_score)
                s['labels'].update(tlog.flagged_labels or [])

        edges: list[EdgeData] = []
        for (src, tgt), s in edge_acc.items():
            is_toxic = s['toxic'] > 0
            toxic_ratio = s['toxic'] / s['total'] if s['total'] else 0

            if is_toxic and toxic_ratio > 0.5:
                edge_type = 'toxic_reply'
            elif is_toxic:
                edge_type = 'mixed'
            else:
                edge_type = 'normal'

            edges.append(EdgeData(
                source=src,
                target=tgt,
                weight=s['total'],
                toxic_count=s['toxic'],
                is_toxic_edge=is_toxic,
                max_toxicity_score=round(s['max_score'], 4),
                flagged_labels=sorted(s['labels']),
                edge_type=edge_type,
            ))

        return edges

    def _compute_metrics_nx(self, nodes_map: dict[int, NodeData], edges: list[EdgeData]):
        """Compute network metrics using NetworkX"""
        if not HAS_NX:
            self._compute_metrics_basic(nodes_map, edges)
            return

        G = nx.DiGraph()
        G.add_nodes_from(nodes_map.keys())
        for e in edges:
            G.add_edge(e.source, e.target, weight=e.weight, toxic=e.is_toxic_edge)

        if len(G.nodes) == 0:
            return

        deg_c = nx.degree_centrality(G)
        in_c = nx.in_degree_centrality(G)
        out_c = nx.out_degree_centrality(G)
        
        try:
            bet_c = nx.betweenness_centrality(G, weight='weight', normalized=True)
        except Exception:
            bet_c = {uid: 0.0 for uid in nodes_map.keys()}

        try:
            G_und = G.to_undirected()
            clust = nx.clustering(G_und)
        except Exception:
            clust = {uid: 0.0 for uid in nodes_map.keys()}

        for uid, node in nodes_map.items():
            node.degree_centrality = round(deg_c.get(uid, 0.0), 4)
            node.in_degree_centrality = round(in_c.get(uid, 0.0), 4)
            node.out_degree_centrality = round(out_c.get(uid, 0.0), 4)
            node.betweenness_centrality = round(bet_c.get(uid, 0.0), 4)
            node.clustering_coefficient = round(clust.get(uid, 0.0), 4)

    def _compute_metrics_basic(self, nodes_map: dict[int, NodeData], edges: list[EdgeData]):
        """Simple degree counts when NetworkX is not installed"""
        total_nodes = len(nodes_map)
        if total_nodes <= 1:
            return

        total = total_nodes - 1
        out_deg: dict[int, int] = defaultdict(int)
        in_deg: dict[int, int] = defaultdict(int)

        for e in edges:
            out_deg[e.source] += 1
            in_deg[e.target] += 1

        for uid, node in nodes_map.items():
            node.out_degree_centrality = round(out_deg[uid] / total, 4) if total > 0 else 0.0
            node.in_degree_centrality = round(in_deg[uid] / total, 4) if total > 0 else 0.0
            node.degree_centrality = round(
                (out_deg[uid] + in_deg[uid]) / (2 * total), 4
            ) if total > 0 else 0.0

    def _compute_interaction_counts(self, nodes_map: dict[int, NodeData], edges: list[EdgeData]):
        for e in edges:
            if e.source in nodes_map:
                nodes_map[e.source].total_interactions += e.weight
                nodes_map[e.source].toxic_interactions += e.toxic_count
            if e.target in nodes_map:
                nodes_map[e.target].total_interactions += e.weight

    def _compute_toxic_ratios(self, nodes_map: dict[int, NodeData]):
        for node in nodes_map.values():
            if node.total_interactions > 0:
                node.toxic_ratio = round(node.toxic_interactions / node.total_interactions, 4)

    def _build_summary(
        self,
        nodes: list[NodeData],
        edges: list[EdgeData],
        nodes_map: dict[int, NodeData],
    ) -> NetworkSummary:
        toxic_nodes = [n for n in nodes if n.node_type == 'toxic']
        at_risk_nodes = [n for n in nodes if n.node_type == 'at_risk']
        normal_nodes = [n for n in nodes if n.node_type == 'normal']
        toxic_edges = [e for e in edges if e.is_toxic_edge]

        # Top by psychological risk
        top_psych_risk = sorted(nodes, key=lambda n: n.psychological_risk_score, reverse=True)[:5]
        top_deg = sorted(nodes, key=lambda n: n.degree_centrality, reverse=True)[:5]
        top_bet = sorted(nodes, key=lambda n: n.betweenness_centrality, reverse=True)[:5]
        top_tox = sorted(
            [n for n in nodes if n.total_interactions >= 2],
            key=lambda n: n.toxic_ratio, reverse=True
        )[:5]

        avg_clust = (
            round(sum(n.clustering_coefficient for n in nodes) / len(nodes), 4)
            if nodes else 0.0
        )

        toxic_clusters = self._find_toxic_clusters(toxic_nodes, edges)

        incoming_toxic: dict[int, int] = defaultdict(int)
        for e in toxic_edges:
            incoming_toxic[e.target] += 1

        contagion = [
            {
                'user_id': uid,
                'username': nodes_map[uid].username,
                'incoming_toxic_edges': cnt,
                'toxic_ratio': nodes_map[uid].toxic_ratio,
                'psychological_risk': nodes_map[uid].psychological_risk_score,
            }
            for uid, cnt in incoming_toxic.items()
            if uid in nodes_map and nodes_map[uid].node_type == 'normal' and cnt >= 2
        ]
        contagion.sort(key=lambda x: x['incoming_toxic_edges'], reverse=True)

        def node_to_dict(n: NodeData) -> dict:
            return {
                'user_id': n.user_id,
                'username': n.username,
                'node_type': n.node_type,
                'degree_centrality': n.degree_centrality,
                'betweenness_centrality': n.betweenness_centrality,
                'toxic_ratio': n.toxic_ratio,
                'toxic_count': n.toxic_count,
                'severity_score': n.severity_score,
                'psychological_risk_score': n.psychological_risk_score,
                'psychological_pattern': n.psychological_pattern,
            }

        return NetworkSummary(
            total_nodes=len(nodes),
            total_edges=len(edges),
            toxic_nodes=len(toxic_nodes),
            at_risk_nodes=len(at_risk_nodes),
            normal_nodes=len(normal_nodes),
            toxic_edges=len(toxic_edges),
            normal_edges=len(edges) - len(toxic_edges),
            top_degree=[node_to_dict(n) for n in top_deg],
            top_betweenness=[node_to_dict(n) for n in top_bet],
            top_toxic_ratio=[node_to_dict(n) for n in top_tox],
            avg_clustering=avg_clust,
            toxic_clusters=toxic_clusters,
            contagion_candidates=contagion,
        )

    def _find_toxic_clusters(
        self, toxic_nodes: list[NodeData], edges: list[EdgeData]
    ) -> list[list[int]]:
        if not toxic_nodes:
            return []

        toxic_ids = {n.user_id for n in toxic_nodes}
        
        toxic_edge_pairs = {
            (e.source, e.target)
            for e in edges
            if e.is_toxic_edge and e.source in toxic_ids and e.target in toxic_ids
        }

        parent: dict[int, int] = {uid: uid for uid in toxic_ids}

        def find(x: int) -> int:
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(a: int, b: int):
            root_a = find(a)
            root_b = find(b)
            if root_a != root_b:
                parent[root_b] = root_a

        for src, tgt in toxic_edge_pairs:
            union(src, tgt)

        groups: dict[int, list[int]] = defaultdict(list)
        for uid in toxic_ids:
            groups[find(uid)].append(uid)

        return [g for g in groups.values() if len(g) >= 2]


sna_service = SNAService()