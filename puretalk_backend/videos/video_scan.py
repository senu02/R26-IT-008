"""Video-only orchestration of visible text and the existing audio detector."""

from django.utils import timezone

from .audio_scan import analyse_video_audio
from .models import VideoTextScan
from .text_scan import FRAME_INTERVAL_SECONDS, _scan_result, analyse_visible_text


def combine_video_results(visible_text: dict, audio: dict) -> dict:
    """Preserve either branch's evidence without inventing probability weights."""
    # Failed audio results can contain fallback zeros from the shared service.
    audio_analysis = audio.get('analysis', {}) if audio['status'] in {'complete', 'partial'} else {}
    is_toxic = bool(visible_text.get('is_toxic') or audio_analysis.get('is_toxic'))
    complete = visible_text['status'] == 'complete' and audio['status'] in {'complete', 'not_present'}
    usable = visible_text['status'] == 'complete' or audio['status'] in {'complete', 'partial'}
    status = 'complete' if complete else 'partial' if usable or is_toxic else 'failed'
    audio_action = audio_analysis.get('fusion', {}).get('action', 'allow')
    if is_toxic:
        action = 'flag_toxic_content'
    elif not complete:
        action = 'review_required'
    elif audio_action in {'possible_victim_report', 'warn_and_monitor'}:
        action = audio_action
    else:
        action = 'allow'
    return {
        'status': status, 'is_toxic': is_toxic, 'action': action,
        'max_score': max(visible_text.get('max_score', 0.0), audio_analysis.get('max_score', 0.0)),
        'flagged_labels': sorted(set(visible_text.get('flagged_labels', [])) | set(audio_analysis.get('flagged_labels', []))),
        'error': '; '.join(
            f"{name}: {result['error']}" for name, result in
            [('Visible text', visible_text), ('Audio', audio)] if result.get('error')
        ) or None,
    }


def scan_video(video, language: str = 'en-US') -> dict:
    scan = VideoTextScan.objects.create(
        video=video, status='processing', action='review_required',
        analysis_version='video_text_audio_v1', sampling_interval=FRAME_INTERVAL_SECONDS,
    )
    # Sequential execution avoids concurrent cold loading of the shared text
    # model and keeps peak memory lower. One branch's failure does not skip the other.
    visible_text = analyse_visible_text(video, scan)
    try:
        audio = analyse_video_audio(video.video_file.path, language=language)
    except Exception as exc:
        audio = {'status': 'failed', 'error': f'Video audio unavailable: {exc}'}
    for key, value in combine_video_results(visible_text, audio).items():
        setattr(scan, key, value)
    scan.modality_results = {'visible_text': visible_text, 'audio': audio}
    scan.observation_count = visible_text.get('observation_count', 0)
    scan.completed_at = timezone.now()
    scan.save()
    return _scan_result(scan, list(scan.observations.all()))
