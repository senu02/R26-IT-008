"""
PureTalk — Social Network Analysis (SNA) Service
=================================================
ඔයාගේ existing models ගෙන් directed weighted graph build කරලා
network metrics calculate කරනවා.

Node  = User
Edge  = comment interaction (commenter → post author)
       weighted by interaction frequency, flagged if toxic

Metrics computed
----------------
  degree_centrality       
  in_degree_centrality    
  out_degree_centrality   
  betweenness_centrality   
  clustering_coefficient   
  node_type                
  toxic_ratio             
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any

# NetworkX is an optional dependency — graceful fallback if missing
try:
    import networkx as nx
    HAS_NX = True
except ImportError:
    HAS_NX = False


# ──────────────────────────────────────────────
# Data classes
# ──────────────────────────────────────────────

@dataclass
class NodeData:
    user_id: int
    username: str
    node_type: str          # normal | at_risk | toxic
    toxic_count: int
    severity_score: float
    warning_level: str
    is_suspended: bool
    # SNA metrics (filled after graph build)
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
    source: int
    target: int
    weight: int             # total interaction count
    toxic_count: int
    is_toxic_edge: bool
    max_toxicity_score: float
    flagged_labels: list[str]
    edge_type: str          # normal | mixed | toxic_reply


@dataclass
class NetworkSummary:
    total_nodes: int
    total_edges: int
    toxic_nodes: int
    at_risk_nodes: int
    normal_nodes: int
    toxic_edges: int
    normal_edges: int
    # Top users by metric
    top_degree: list[dict]
    top_betweenness: list[dict]
    top_toxic_ratio: list[dict]
    # Cluster stats
    avg_clustering: float
    toxic_clusters: list[list[int]]     # groups of mutually-toxic users
    # Contagion
    contagion_candidates: list[dict]    # normal users exposed to many toxic edges


# ──────────────────────────────────────────────
# Main service
# ──────────────────────────────────────────────

class SNAService:
    """
    Build a directed interaction graph from PureTalk DB and compute
    SNA metrics for research and admin dashboard use.
    """

    def build_graph(self) -> tuple[list[NodeData], list[EdgeData], NetworkSummary]:
        """
        Main entry point.
        Returns (nodes, edges, summary).
        """
        nodes_map = self._load_nodes()          # user_id → NodeData
        edges     = self._load_edges(nodes_map) # list[EdgeData]

        if HAS_NX:
            self._compute_metrics_nx(nodes_map, edges)
        else:
            self._compute_metrics_basic(nodes_map, edges)

        self._compute_interaction_counts(nodes_map, edges)

        nodes   = list(nodes_map.values())
        summary = self._build_summary(nodes, edges, nodes_map)

        return nodes, edges, summary

    # ──────────────────────────────────────────
    # Node loader
    # ──────────────────────────────────────────

    def _load_nodes(self) -> dict[int, NodeData]:
        from django.contrib.auth import get_user_model
        from toxicity_behavior.models import UserBehaviorProfile

        User = get_user_model()

        behavior_map: dict[int, Any] = {
            p.user_id: p
            for p in UserBehaviorProfile.objects.select_related('user').all()
        }

        nodes: dict[int, NodeData] = {}

        for user in User.objects.all():
            bp = behavior_map.get(user.id)

            toxic_count   = bp.toxic_count    if bp else 0
            severity      = bp.severity_score if bp else 0.0
            warning_level = bp.warning_level  if bp else 'none'
            is_suspended  = bp.is_suspended   if bp else False

            if is_suspended or toxic_count >= 5:
                node_type = 'toxic'
            elif toxic_count >= 1 or warning_level != 'none':
                node_type = 'at_risk'
            else:
                node_type = 'normal'

            nodes[user.id] = NodeData(
                user_id       = user.id,
                username      = user.username,
                node_type     = node_type,
                toxic_count   = toxic_count,
                severity_score= round(severity, 4),
                warning_level = warning_level,
                is_suspended  = is_suspended,
            )

        return nodes

    # ──────────────────────────────────────────
    # Edge loader
    # ──────────────────────────────────────────

    def _load_edges(self, nodes_map: dict[int, NodeData]) -> list[EdgeData]:
        from posts.models import Comment
        from toxicity_detection.models import ToxicityLog

        # Build toxicity lookup: comment_id → ToxicityLog
        tox_by_comment: dict[int, Any] = {
            t.comment_id: t
            for t in ToxicityLog.objects.filter(content_type='comment')
            if t.comment_id is not None
        }

        # Accumulate per (commenter, post_author) pair
        edge_acc: dict[tuple[int,int], dict] = defaultdict(lambda: {
            'total': 0, 'toxic': 0,
            'max_score': 0.0, 'labels': set(),
        })

        comments = (
            Comment.objects
            .select_related('author', 'post__author')
            .filter(
                author_id__in=nodes_map,
                post__author_id__in=nodes_map,
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
                source             = src,
                target             = tgt,
                weight             = s['total'],
                toxic_count        = s['toxic'],
                is_toxic_edge      = is_toxic,
                max_toxicity_score = round(s['max_score'], 4),
                flagged_labels     = sorted(s['labels']),
                edge_type          = edge_type,
            ))

        return edges

    # ──────────────────────────────────────────
    # Metrics — NetworkX path (recommended)
    # ──────────────────────────────────────────

    def _compute_metrics_nx(self, nodes_map: dict[int, NodeData], edges: list[EdgeData]):
        G = nx.DiGraph()
        G.add_nodes_from(nodes_map.keys())
        for e in edges:
            G.add_edge(e.source, e.target, weight=e.weight, toxic=e.is_toxic_edge)

        deg_c   = nx.degree_centrality(G)
        in_c    = nx.in_degree_centrality(G)
        out_c   = nx.out_degree_centrality(G)
        bet_c   = nx.betweenness_centrality(G, weight='weight', normalized=True)

        # Clustering on undirected version
        G_und   = G.to_undirected()
        clust   = nx.clustering(G_und)

        for uid, node in nodes_map.items():
            node.degree_centrality      = round(deg_c.get(uid, 0.0),  4)
            node.in_degree_centrality   = round(in_c.get(uid, 0.0),   4)
            node.out_degree_centrality  = round(out_c.get(uid, 0.0),  4)
            node.betweenness_centrality = round(bet_c.get(uid, 0.0),  4)
            node.clustering_coefficient = round(clust.get(uid, 0.0),  4)

    # ──────────────────────────────────────────
    # Metrics — fallback (no NetworkX)
    # ──────────────────────────────────────────

    def _compute_metrics_basic(self, nodes_map: dict[int, NodeData], edges: list[EdgeData]):
        """Simple degree counts when NetworkX is not installed."""
        total = max(len(nodes_map) - 1, 1)
        out_deg: dict[int, int] = defaultdict(int)
        in_deg:  dict[int, int] = defaultdict(int)

        for e in edges:
            out_deg[e.source] += 1
            in_deg[e.target]  += 1

        for uid, node in nodes_map.items():
            node.out_degree_centrality = round(out_deg[uid] / total, 4)
            node.in_degree_centrality  = round(in_deg[uid]  / total, 4)
            node.degree_centrality     = round(
                (out_deg[uid] + in_deg[uid]) / (2 * total), 4
            )

    # ──────────────────────────────────────────
    # Interaction count & toxic ratio per node
    # ──────────────────────────────────────────

    def _compute_interaction_counts(self, nodes_map: dict[int, NodeData], edges: list[EdgeData]):
        for e in edges:
            if e.source in nodes_map:
                nodes_map[e.source].total_interactions += e.weight
                nodes_map[e.source].toxic_interactions += e.toxic_count
            if e.target in nodes_map:
                nodes_map[e.target].total_interactions += e.weight

        for node in nodes_map.values():
            if node.total_interactions > 0:
                node.toxic_ratio = round(node.toxic_interactions / node.total_interactions, 4)

    # ──────────────────────────────────────────
    # Summary builder
    # ──────────────────────────────────────────

    def _build_summary(
        self,
        nodes: list[NodeData],
        edges: list[EdgeData],
        nodes_map: dict[int, NodeData],
    ) -> NetworkSummary:

        toxic_nodes  = [n for n in nodes if n.node_type == 'toxic']
        at_risk      = [n for n in nodes if n.node_type == 'at_risk']
        normal_nodes = [n for n in nodes if n.node_type == 'normal']
        toxic_edges  = [e for e in edges if e.is_toxic_edge]

        # Top 5 by degree
        top_deg = sorted(nodes, key=lambda n: n.degree_centrality, reverse=True)[:5]
        # Top 5 by betweenness
        top_bet = sorted(nodes, key=lambda n: n.betweenness_centrality, reverse=True)[:5]
        # Top 5 by toxic ratio (min 2 interactions to be meaningful)
        top_tox = sorted(
            [n for n in nodes if n.total_interactions >= 2],
            key=lambda n: n.toxic_ratio, reverse=True
        )[:5]

        avg_clust = (
            round(sum(n.clustering_coefficient for n in nodes) / len(nodes), 4)
            if nodes else 0.0
        )

        # Toxic clusters — groups where all members are 'toxic' and mutually interacted
        toxic_clusters = self._find_toxic_clusters(toxic_nodes, edges)

        # Contagion candidates — normal users who received 2+ toxic edges
        incoming_toxic: dict[int, int] = defaultdict(int)
        for e in toxic_edges:
            incoming_toxic[e.target] += 1

        contagion = [
            {'user_id': uid, 'username': nodes_map[uid].username, 'incoming_toxic_edges': cnt}
            for uid, cnt in incoming_toxic.items()
            if uid in nodes_map and nodes_map[uid].node_type == 'normal' and cnt >= 2
        ]
        contagion.sort(key=lambda x: x['incoming_toxic_edges'], reverse=True)

        def node_to_dict(n: NodeData) -> dict:
            return {
                'user_id':              n.user_id,
                'username':             n.username,
                'node_type':            n.node_type,
                'degree_centrality':    n.degree_centrality,
                'betweenness_centrality': n.betweenness_centrality,
                'toxic_ratio':          n.toxic_ratio,
                'toxic_count':          n.toxic_count,
            }

        return NetworkSummary(
            total_nodes         = len(nodes),
            total_edges         = len(edges),
            toxic_nodes         = len(toxic_nodes),
            at_risk_nodes       = len(at_risk),
            normal_nodes        = len(normal_nodes),
            toxic_edges         = len(toxic_edges),
            normal_edges        = len(edges) - len(toxic_edges),
            top_degree          = [node_to_dict(n) for n in top_deg],
            top_betweenness     = [node_to_dict(n) for n in top_bet],
            top_toxic_ratio     = [node_to_dict(n) for n in top_tox],
            avg_clustering      = avg_clust,
            toxic_clusters      = toxic_clusters,
            contagion_candidates= contagion,
        )

    def _find_toxic_clusters(
        self, toxic_nodes: list[NodeData], edges: list[EdgeData]
    ) -> list[list[int]]:
        """
        Simple cluster detection — groups of 2+ toxic users who
        share at least one toxic interaction edge between them.
        """
        toxic_ids = {n.user_id for n in toxic_nodes}
        toxic_edge_pairs = {
            (e.source, e.target)
            for e in edges
            if e.is_toxic_edge and e.source in toxic_ids and e.target in toxic_ids
        }

        # Union-Find
        parent: dict[int, int] = {uid: uid for uid in toxic_ids}

        def find(x: int) -> int:
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(a: int, b: int):
            parent[find(a)] = find(b)

        for src, tgt in toxic_edge_pairs:
            union(src, tgt)

        groups: dict[int, list[int]] = defaultdict(list)
        for uid in toxic_ids:
            groups[find(uid)].append(uid)

        return [g for g in groups.values() if len(g) >= 2]


# Singleton
sna_service = SNAService()
