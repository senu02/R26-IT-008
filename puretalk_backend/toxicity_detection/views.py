from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.utils import timezone

# pyrefly: ignore [missing-import]
from .models import ToxicityLog, UserToxicityProfile
# pyrefly: ignore [missing-import]
from .serializers import ToxicityLogSerializer, UserToxicityProfileSerializer
# pyrefly: ignore [missing-import]
from .services import analyse_toxicity, transcribe_and_analyse_audio


class ToxicityViewSet(viewsets.GenericViewSet):
    """
    Endpoints:
        POST /api/toxicity/check/          — check arbitrary text (admin/debug use)
        POST /api/toxicity/check-audio/    — check audio by converting to text
        GET  /api/toxicity/logs/           — list all logs (admin)
        GET  /api/toxicity/logs/{id}/      — single log detail (admin)
        POST /api/toxicity/logs/{id}/review/ — admin review / override
        GET  /api/toxicity/user-profiles/  — user toxicity profiles (admin)
        GET  /api/toxicity/user-profiles/{id}/ — single user profile
    """
    permission_classes = [permissions.IsAuthenticated]

    # ------------------------------------------------------------------ #
    #  Text & Audio checks                                                #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['post'], url_path='check')
    def check_text(self, request):
        """
        Analyse any text snippet.
        Body: { "text": "..." }
        """
        text = request.data.get('text', '').strip()
        if not text:
            return Response(
                {"error": "text field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = analyse_toxicity(text)
        return Response(result)

    @action(
        detail=False,
        methods=['post'],
        url_path='check-audio',
        parser_classes=[MultiPartParser, FormParser, JSONParser]
    )
    def check_audio(self, request):
        """
        Analyse an uploaded audio file for toxicity by converting it to text.
        Multipart data: 'audio' file
        """
        audio_file = request.FILES.get('audio') or request.FILES.get('file')
        if not audio_file:
            return Response(
                {"error": "Audio file is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        language = request.data.get('language', 'en-US')
        result = transcribe_and_analyse_audio(audio_file, language=language)

        if result.get('error') and not result.get('transcribed_text'):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        # Log entry for audit
        if result.get('transcribed_text'):
            try:
                ToxicityLog.objects.create(
                    author=request.user if request.user and request.user.is_authenticated else None,
                    analysed_text=result['transcribed_text'],
                    is_toxic=result.get('is_toxic', False),
                    max_score=result.get('max_score', 0.0),
                    label_scores=result.get('labels', {}),
                    flagged_labels=result.get('flagged_labels', []),
                    content_type='audio'
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning("Failed to save ToxicityLog for audio: %s", e)

        return Response(result)

    # ------------------------------------------------------------------ #
    #  Logs                                                                #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'], url_path='logs')
    def list_logs(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        qs = ToxicityLog.objects.select_related('author', 'post', 'comment')

        # Optional filters
        is_toxic = request.query_params.get('is_toxic')
        content_type = request.query_params.get('content_type')
        user_id = request.query_params.get('user_id')
        reviewed = request.query_params.get('reviewed')

        if is_toxic is not None:
            qs = qs.filter(is_toxic=is_toxic.lower() == 'true')
        if content_type:
            qs = qs.filter(content_type=content_type)
        if user_id:
            qs = qs.filter(author_id=user_id)
        if reviewed is not None:
            qs = qs.filter(is_reviewed=reviewed.lower() == 'true')

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ToxicityLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        return Response(ToxicityLogSerializer(qs, many=True).data)

    @action(detail=True, methods=['get'], url_path='logs/(?P<log_id>[^/.]+)')
    def log_detail(self, request, log_id=None):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)
        log = get_object_or_404(ToxicityLog, id=log_id)
        return Response(ToxicityLogSerializer(log).data)

    @action(detail=False, methods=['post'], url_path='logs/(?P<log_id>[^/.]+)/review')
    def review_log(self, request, log_id=None):
        """
        Admin reviews / overrides a toxicity log.
        Body: { "overridden": true/false, "review_notes": "..." }
        """
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        log = get_object_or_404(ToxicityLog, id=log_id)
        log.is_reviewed = True
        log.reviewer = request.user
        log.overridden = request.data.get('overridden', False)
        log.review_notes = request.data.get('review_notes', '')
        log.save()

        return Response({
            "message": "Review saved",
            "log": ToxicityLogSerializer(log).data
        })

    # ------------------------------------------------------------------ #
    #  User profiles                                                       #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'], url_path='user-profiles')
    def user_profiles(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        qs = UserToxicityProfile.objects.select_related('user').order_by(
            '-toxic_post_count', '-toxic_comment_count'
        )

        flagged = request.query_params.get('flagged')
        if flagged is not None:
            qs = qs.filter(is_flagged=flagged.lower() == 'true')

        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(
                UserToxicityProfileSerializer(page, many=True).data
            )
        return Response(UserToxicityProfileSerializer(qs, many=True).data)

    @action(
        detail=False,
        methods=['post'],
        url_path='user-profiles/(?P<user_id>[^/.]+)/flag'
    )
    def flag_user(self, request, user_id=None):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        profile, _ = UserToxicityProfile.objects.get_or_create(user_id=user_id)
        profile.is_flagged = not profile.is_flagged
        profile.save()

        return Response({
            "user_id": user_id,
            "is_flagged": profile.is_flagged
        })