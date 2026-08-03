from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .engine import aesm_engine
from .models import ToxicityRecord
from .serializers import (
    AnalyzeRequestSerializer,
    AnalyzeResponseSerializer,
    ToxicityRecordSerializer,
)


class AnalyzeMessageView(APIView):
    """
    POST /api/shield/analyze/
    Body: { "text": "your message here" }

    Returns the AESM result (strategy + processed output + scores).
    Also saves the result to the user's toxicity history.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AnalyzeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        text = serializer.validated_data["text"]

        # ── Fetch user's recent toxicity history (last 20 messages) ──
        recent_records = ToxicityRecord.objects.filter(
            user=request.user
        ).order_by("-created_at")[:20]

        user_history = [r.toxicity_score for r in recent_records]

        # ── Run AESM engine ──
        result = aesm_engine(text, user_history=user_history)

        # ── Persist the result ──
        ToxicityRecord.objects.create(
            user=request.user,
            message=text,
            strategy=result["strategy"],
            toxicity_score=result["toxicity"],
            behavior_score=result["behavior"],
            final_score=result["final_score"],
            processed_output=result["output"],
        )

        return Response(result, status=status.HTTP_200_OK)


class UserToxicityHistoryView(APIView):
    """
    GET /api/shield/history/
    Returns the authenticated user's toxicity record history.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        records = ToxicityRecord.objects.filter(user=request.user)[:50]
        serializer = ToxicityRecordSerializer(records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserBehaviorScoreView(APIView):
    """
    GET /api/shield/behavior-score/
    Returns the current user's averaged behavioral toxicity score.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        recent = ToxicityRecord.objects.filter(
            user=request.user
        ).order_by("-created_at")[:20]

        scores = [r.toxicity_score for r in recent]
        avg = sum(scores) / len(scores) if scores else 0.0

        return Response({
            "behavior_score": round(avg, 4),
            "based_on_messages": len(scores),
        })


class AdminAllRecordsView(APIView):
    """
    GET /api/shield/admin-records/
    Returns ALL toxicity records for admin dashboard.
    Only admins/moderators can access this endpoint.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, 'role', None)
        allowed_roles = {'admin', 'super_admin', 'moderator'}
        if role not in allowed_roles:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN
            )

        records = ToxicityRecord.objects.select_related('user').order_by('-created_at')[:200]
        data = []
        for r in records:
            data.append({
                "id": r.id,
                "user": r.user.email if r.user else "Anonymous",
                "user_full_name": r.user.full_name if r.user else "Unknown",
                "message": r.message,
                "strategy": r.strategy,
                "toxicity_score": r.toxicity_score,
                "behavior_score": r.behavior_score,
                "final_score": r.final_score,
                "processed_output": r.processed_output,
                "created_at": r.created_at.isoformat(),
            })
        return Response({"count": len(data), "records": data}, status=status.HTTP_200_OK)
