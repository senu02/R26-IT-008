from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .engine import predict_toxic_image
from .models import ToxicImageLog
from .serializers import (
    ToxicImageSerializer,
    ToxicImageBatchSerializer,
    ToxicImageLogSerializer,
)


# ─── 1. Single Image Detection ────────────────────────────────────────────────

class ToxicImageDetectView(APIView):
    """
    POST /api/toxicity/detect/

    Upload one image → get toxicity result.
    Saves the result to ToxicImageLog automatically.

    Form fields:
        image     (required)
        model     (optional) "h5" | "pkl"       default: h5
        threshold (optional) float 0.0–1.0      default: 0.5
    """
    parser_classes     = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ToxicImageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        image_file = serializer.validated_data["image"]
        model      = serializer.validated_data.get("model", "h5")
        threshold  = serializer.validated_data.get("threshold", 0.5)

        try:
            result = predict_toxic_image(image_file, model=model, threshold=threshold)
        except Exception as e:
            return Response(
                {"error": f"Model inference failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── Save log to DB ──
        ToxicImageLog.objects.create(
            user       = request.user,
            image_name = image_file.name,
            score      = result["score"],
            label      = result["label"],
            is_toxic   = result["is_toxic"],
            confidence = result["confidence"],
            model_used = result["model_used"],
            threshold  = threshold,
        )

        return Response(result, status=status.HTTP_200_OK)


# ─── 2. Batch Image Detection ─────────────────────────────────────────────────

class ToxicImageBatchDetectView(APIView):
    """
    POST /api/toxicity/detect/batch/

    Upload multiple images (max 10) at once.
    Each is analyzed individually. All logs saved.

    Form fields:
        images[]  (required)  — multiple files
        model     (optional)  "h5" | "pkl"
        threshold (optional)  float 0.0–1.0
    """
    parser_classes     = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]
    MAX_BATCH          = 10

    def post(self, request, *args, **kwargs):
        images = request.FILES.getlist("images[]")
        if not images:
            return Response(
                {"error": "No images provided. Send files with key 'images[]'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(images) > self.MAX_BATCH:
            return Response(
                {"error": f"Max batch size is {self.MAX_BATCH} images."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        s         = ToxicImageBatchSerializer(data=request.data)
        model     = s.initial_data.get("model", "h5")
        threshold = float(s.initial_data.get("threshold", 0.5))

        results = []
        for img_file in images:
            try:
                result = predict_toxic_image(img_file, model=model, threshold=threshold)
                result["filename"] = img_file.name

                ToxicImageLog.objects.create(
                    user       = request.user,
                    image_name = img_file.name,
                    score      = result["score"],
                    label      = result["label"],
                    is_toxic   = result["is_toxic"],
                    confidence = result["confidence"],
                    model_used = result["model_used"],
                    threshold  = threshold,
                )
                results.append(result)

            except Exception as e:
                results.append({"filename": img_file.name, "error": str(e)})

        toxic_count = sum(1 for r in results if r.get("is_toxic"))

        return Response(
            {
                "total"       : len(results),
                "toxic_count" : toxic_count,
                "safe_count"  : len(results) - toxic_count,
                "results"     : results,
            },
            status=status.HTTP_200_OK,
        )


# ─── 3. My Detection History ──────────────────────────────────────────────────

class MyToxicityHistoryView(generics.ListAPIView):
    """
    GET /api/toxicity/history/

    Returns all toxicity checks made by the current logged-in user.
    """
    serializer_class   = ToxicImageLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ToxicImageLog.objects.filter(user=self.request.user)


# ─── 4. Admin — All Logs ──────────────────────────────────────────────────────

class AllToxicityLogsView(generics.ListAPIView):
    """
    GET /api/toxicity/admin/logs/

    Admin only. Returns all toxicity check logs across all users.
    """
    serializer_class   = ToxicImageLogSerializer
    permission_classes = [IsAdminUser]
    queryset           = ToxicImageLog.objects.all()