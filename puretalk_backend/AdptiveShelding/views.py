import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .engine import aesm_engine
from .xai import get_lime_word_explanation
from .models import ToxicityRecord
from .serializers import (
    AnalyzeRequestSerializer,
    ExplainRequestSerializer,
    AnalyzeResponseSerializer,
    ToxicityRecordSerializer,
)

logger = logging.getLogger(__name__)


def _aesm_result_to_toxicity_result(result: dict) -> dict:
    """
    Adapt an AESM engine result (strategy/toxicity/behavior/final_score)
    into the {is_toxic, max_score, labels, flagged_labels} shape that
    toxicity_behavior.services.enforce_behavior() expects, so both
    detection pipelines can feed the same UserBehaviorProfile.
    """
    score = float(result.get("final_score", 0.0))
    strategy = result.get("strategy", "Safe")
    return {
        "is_toxic": strategy != "Safe",
        "max_score": score,
        "labels": {"toxic": score},
        "flagged_labels": [strategy.lower()],
    }


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
        content_type = serializer.validated_data.get("content_type", "post")
        # [EN] Language hint from frontend — 'singlish' applies a lower
        #      detection threshold so Singlish toxic words aren't missed.
        # [SL] Frontend eka language hint eka dennawa — 'singlish' nam
        #      lower threshold eka use karannawa, Singlish words catch karanna.
        language = serializer.validated_data.get("language", "english")

        # ── Fetch user's recent toxicity history (last 20 messages) ──
        recent_records = ToxicityRecord.objects.filter(
            user=request.user
        ).order_by("-created_at")[:20]

        user_history = [r.toxicity_score for r in recent_records]

        # ── Run AESM engine (language-aware) ──
        result = aesm_engine(text, user_history=user_history, language=language)

        # LIME is admin-only via POST /api/shield/explain/ — omit here so
        # comment/post shield checks stay fast and do not time out in the browser.
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

        # ── Profile-based enforcement (IT22169594) ──────────────────────
        # "Filtering" is the one AESM strategy that the frontend treats as
        # a hard block: PostSection.tsx shows the toast and returns WITHOUT
        # ever calling postAPI.createPost(). That means posts/views.py's
        # _run_toxicity_check() — the only other place enforce_behavior()
        # is called — never runs for these messages, so UserBehaviorProfile
        # (toxic_count / severity_score / admin dashboard) silently never
        # updates for a user's most toxic messages.
        #
        # Every other strategy (Rewriting/Blurring/Warning/Safe) still lets
        # the (possibly modified) content through to postAPI.createPost(),
        # which already triggers enforce_behavior() on the backend — so we
        # deliberately do NOT call it here for those cases, to avoid
        # double-counting the same message twice.
        if result["strategy"] == "Filtering":
            try:
                from toxicity_behavior.services import enforce_behavior
                enforce_behavior(
                    user=request.user,
                    text=text,
                    toxicity_result=_aesm_result_to_toxicity_result(result),
                    content_type=content_type,
                )
            except Exception as exc:
                logger.error(f"Behaviour enforcement failed (AESM path): {exc}")

        return Response(result, status=status.HTTP_200_OK)


class ExplainMessageView(APIView):
    """
    POST /api/shield/explain/
    Admin-only on-demand LIME explanation without saving a record.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = getattr(request.user, 'role', None)
        if role not in {'admin', 'super_admin', 'moderator'}:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ExplainRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        text = serializer.validated_data["text"]
        try:
            lime = get_lime_word_explanation(text)
        except Exception as exc:
            logger.error(f"LIME explanation failed: {exc}")
            return Response(
                {"detail": "Explanation generation failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"lime_explanation": lime}, status=status.HTTP_200_OK)


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