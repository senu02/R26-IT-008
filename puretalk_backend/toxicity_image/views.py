from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import ImageToxicityLog
from .serializers import ImageToxicityLogSerializer, ImageCheckResultSerializer
from .services import analyse_image


class ImageToxicityViewSet(viewsets.GenericViewSet):
    """
    Image toxicity detection endpoints.

    POST /api/toxicity_image/check/        — Check an image (saves log)
    POST /api/toxicity_image/quick-check/  — Check an image (no DB save)
    GET  /api/toxicity_image/logs/         — List all scan logs  (admin)
    GET  /api/toxicity_image/logs/{id}/    — Single log detail   (admin)
    POST /api/toxicity_image/logs/{id}/review/ — Admin review/override
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    # ------------------------------------------------------------------ #
    #  1. Check image and save a log                                       #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['post'], url_path='check')
    def check_image(self, request):
        """
        Upload an image, run the ML model, save the result to DB.

        Request (multipart/form-data):
            image       — required image file
            content_type — optional: post | profile | story | standalone
            post        — optional: post ID to link

        Response:
            {
                "is_toxic": bool,
                "confidence_score": float,
                "toxic_probability": float,
                "non_toxic_probability": float,
                "model_available": bool,
                "message": str,
                "log_id": int
            }
        """
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {"error": "image file is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Run inference
        result = analyse_image(image_file)

        # Build a human-readable message
        if not result['model_available']:
            message = "Model not available. Image was not scanned."
        elif result['is_toxic']:
            message = (
                f"⚠️ Toxic image detected "
                f"(confidence: {result['confidence_score']*100:.1f}%). "
                "This image has been flagged."
            )
        else:
            message = (
                f"✅ Image appears safe "
                f"(confidence: {result['confidence_score']*100:.1f}%)."
            )

        # Save log
        content_type = request.data.get('content_type', 'standalone')
        post_id = request.data.get('post', None)

        # Reset file pointer before saving
        image_file.seek(0)

        log = ImageToxicityLog.objects.create(
            author=request.user,
            post_id=post_id,
            content_type=content_type,
            image=image_file,
            is_toxic=result['is_toxic'],
            confidence_score=result['confidence_score'],
            toxic_probability=result['toxic_probability'],
            non_toxic_probability=result['non_toxic_probability'],
            model_available=result['model_available'],
        )

        return Response(
            {
                **result,
                "message": message,
                "log_id": log.id,
            },
            status=status.HTTP_200_OK
        )

    # ------------------------------------------------------------------ #
    #  2. Quick check — no DB save                                         #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['post'], url_path='quick-check')
    def quick_check(self, request):
        """
        Run inference without saving to DB.
        Useful for real-time front-end validation before upload.

        Request (multipart/form-data):
            image — required image file
        """
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {"error": "image file is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = analyse_image(image_file)

        if not result['model_available']:
            message = "Model not available."
        elif result['is_toxic']:
            message = f"⚠️ Toxic image ({result['confidence_score']*100:.1f}% confidence)."
        else:
            message = f"✅ Safe image ({result['confidence_score']*100:.1f}% confidence)."

        return Response({**result, "message": message}, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------ #
    #  3. List all logs (admin only)                                       #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'], url_path='logs')
    def list_logs(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN
            )

        logs = ImageToxicityLog.objects.select_related('author', 'post').all()

        # Optional filters
        is_toxic = request.query_params.get('is_toxic')
        if is_toxic is not None:
            logs = logs.filter(is_toxic=is_toxic.lower() == 'true')

        is_reviewed = request.query_params.get('is_reviewed')
        if is_reviewed is not None:
            logs = logs.filter(is_reviewed=is_reviewed.lower() == 'true')

        serializer = ImageToxicityLogSerializer(logs, many=True)
        return Response(serializer.data)

    # ------------------------------------------------------------------ #
    #  4. Single log detail (admin only)                                   #
    # ------------------------------------------------------------------ #

    @action(detail=True, methods=['get'], url_path='detail')
    def log_detail(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            log = ImageToxicityLog.objects.get(pk=pk)
        except ImageToxicityLog.DoesNotExist:
            return Response(
                {"error": "Log not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ImageToxicityLogSerializer(log)
        return Response(serializer.data)

    # ------------------------------------------------------------------ #
    #  5. Admin review / override                                          #
    # ------------------------------------------------------------------ #

    @action(detail=True, methods=['post'], url_path='review')
    def review_log(self, request, pk=None):
        """
        Admin can override the ML decision.

        Body:
            {
                "override_decision": true | false,   // new is_toxic value
                "review_notes": "..."
            }
        """
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            log = ImageToxicityLog.objects.get(pk=pk)
        except ImageToxicityLog.DoesNotExist:
            return Response(
                {"error": "Log not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        override_decision = request.data.get('override_decision')
        review_notes = request.data.get('review_notes', '')

        if override_decision is not None:
            log.is_toxic = bool(override_decision)
            log.overridden = True

        log.is_reviewed = True
        log.reviewer = request.user
        log.review_notes = review_notes
        log.save()

        serializer = ImageToxicityLogSerializer(log)
        return Response(serializer.data)

    # ------------------------------------------------------------------ #
    #  6. My own image scan history                                        #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'], url_path='my-logs')
    def my_logs(self, request):
        """Returns the current user's image scan history."""
        logs = ImageToxicityLog.objects.filter(author=request.user)
        serializer = ImageToxicityLogSerializer(logs, many=True)
        return Response(serializer.data)
