from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .engine import aesm_engine
from .models import ToxicityRecord
from users.models import UserRole


class AnalyzeMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get("text", "").strip()
        if not text:
            return Response({"error": "text field is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get last 20 toxicity scores for behavior tracking
        recent = ToxicityRecord.objects.filter(user=request.user).order_by("-created_at")[:20]
        user_history = [r.toxicity_score for r in recent]

        result = aesm_engine(text, user_history=user_history)

        # Save record
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


class UserHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        records = ToxicityRecord.objects.filter(user=request.user)[:50]
        data = [
            {
                "id": r.id,
                "message": r.message,
                "strategy": r.strategy,
                "toxicity_score": r.toxicity_score,
                "final_score": r.final_score,
                "processed_output": r.processed_output,
                "created_at": r.created_at,
            }
            for r in records
        ]
        return Response(data)


class BehaviorScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        recent = ToxicityRecord.objects.filter(user=request.user).order_by("-created_at")[:20]
        scores = [r.toxicity_score for r in recent]
        avg = sum(scores) / len(scores) if scores else 0.0
        return Response({"behavior_score": round(avg, 4), "based_on": len(scores)})

class AdminAllRecordsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
            
        records = ToxicityRecord.objects.all().order_by("-created_at")[:100]
        data = [
            {
                "id": r.id,
                "user": r.user.email,
                "message": r.message,
                "strategy": r.strategy,
                "toxicity_score": r.toxicity_score,
                "behavior_score": r.behavior_score,
                "final_score": r.final_score,
                "processed_output": r.processed_output,
                "created_at": r.created_at,
            }
            for r in records
        ]
        return Response(data)