"""OCR-based visible-text toxicity scanning for uploaded videos."""

import logging
import os
from typing import Any

from django.utils import timezone

from toxicity_detection.services import analyse_toxicity

from .models import Video, VideoTextObservation, VideoTextScan

logger = logging.getLogger(__name__)

FRAME_INTERVAL_SECONDS = 2.0
OCR_CONFIDENCE_THRESHOLD = 0.40
_ocr_reader = None
_ocr_load_attempted = False


def _get_ocr_reader():
    """Load EasyOCR once, using CPU by default for cross-platform runs."""
    global _ocr_reader, _ocr_load_attempted

    if _ocr_load_attempted:
        return _ocr_reader

    _ocr_load_attempted = True
    try:
        import easyocr

        use_gpu = os.getenv('VIDEO_OCR_GPU', 'false').lower() == 'true'
        _ocr_reader = easyocr.Reader(['en'], gpu=use_gpu, verbose=False)
    except Exception as exc:
        logger.warning('EasyOCR is unavailable: %s', exc)
        _ocr_reader = None

    return _ocr_reader


def scan_video_text(video: Video) -> dict[str, Any]:
    """Sample video frames, OCR visible text, and score each text segment.

    This service deliberately does not inspect audio or scene content. OCR is
    optional so an unavailable Python OCR runtime is reported as a failed scan
    rather than allowing or blocking a video silently.
    """
    scan = VideoTextScan.objects.create(
        video=video,
        status='processing',
        analysis_version='video_text_v2_easyocr',
        sampling_interval=FRAME_INTERVAL_SECONDS,
    )
    result = analyse_visible_text(video, scan)
    scan.modality_results = {'visible_text': result}
    scan.status = result['status']
    scan.is_toxic = result['is_toxic']
    scan.max_score = result['max_score']
    scan.flagged_labels = result['flagged_labels']
    scan.action = ('flag_toxic_content' if scan.is_toxic else
                   'allow' if scan.status == 'complete' else 'review_required')
    scan.observation_count = result['observation_count']
    scan.error = result['error']
    scan.completed_at = timezone.now()
    scan.save()
    return _scan_result(scan, list(scan.observations.all()))


def analyse_visible_text(video: Video, scan: VideoTextScan) -> dict[str, Any]:
    """Collect OCR evidence independently of the video's audio branch."""
    observations = []
    try:
        return _extract_visible_text(video, scan, observations)
    except Exception as exc:
        logger.exception('Video OCR scan failed for video %s', video.pk)
        return _text_summary(observations, 'failed', f'Video OCR scan failed: {exc}')


def _extract_visible_text(video: Video, scan: VideoTextScan, observations: list) -> dict:

    try:
        import cv2
    except ImportError as exc:
        raise RuntimeError(f'Video frame dependency is unavailable: {exc}') from exc

    reader = _get_ocr_reader()
    if reader is None:
        raise RuntimeError(
            'EasyOCR is unavailable. Install dependencies and allow the '
            'English OCR model to download before scanning videos.',
        )

    video_path = video.video_file.path
    if not os.path.exists(video_path):
        raise ValueError('Uploaded video file is not available on disk.')

    capture = cv2.VideoCapture(video_path)
    if not capture.isOpened():
        capture.release()
        raise ValueError('Video could not be opened for frame extraction.')

    frames_read = 0
    next_sample_ms = 0.0
    try:
        while True:
            success, frame = capture.read()
            if not success:
                break
            frames_read += 1

            timestamp_ms = float(capture.get(cv2.CAP_PROP_POS_MSEC))
            if timestamp_ms < next_sample_ms:
                continue
            next_sample_ms = timestamp_ms + (FRAME_INTERVAL_SECONDS * 1000)

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            data = reader.readtext(frame_rgb, detail=1, paragraph=False)
            words = []
            confidences = []
            for _, text, confidence in data:
                text = text.strip()
                try:
                    confidence_value = float(confidence)
                except (TypeError, ValueError):
                    continue
                if text and confidence_value >= OCR_CONFIDENCE_THRESHOLD:
                    words.append(text)
                    confidences.append(confidence_value)

            extracted_text = ' '.join(words).strip()
            if not extracted_text:
                continue

            toxicity = analyse_toxicity(extracted_text)
            if toxicity.get('error'):
                raise RuntimeError(f"Text toxicity analysis failed: {toxicity['error']}")
            observations.append(VideoTextObservation.objects.create(
                scan=scan,
                timestamp_seconds=round(timestamp_ms / 1000, 3),
                frame_number=int(capture.get(cv2.CAP_PROP_POS_FRAMES)),
                extracted_text=extracted_text,
                ocr_confidence=round(sum(confidences) / len(confidences), 3),
                text_labels=toxicity.get('labels', {}),
                flagged_labels=toxicity.get('flagged_labels', []),
                toxicity_score=toxicity.get('max_score', 0.0),
                is_toxic=toxicity.get('is_toxic', False),
            ))
    finally:
        capture.release()
    if not frames_read:
        raise ValueError('No video frames could be decoded.')
    return _text_summary(observations, 'complete', None)


def _text_summary(observations: list, status: str, error: str | None) -> dict:
    toxic_observations = [item for item in observations if item.is_toxic]
    return {
        'status': status, 'error': error,
        'is_toxic': bool(toxic_observations),
        'max_score': max((item.toxicity_score for item in observations), default=0.0),
        'flagged_labels': sorted({label for item in toxic_observations for label in item.flagged_labels}),
        'observation_count': len(observations),
    }


def _scan_result(scan: VideoTextScan, observations: list) -> dict[str, Any]:
    return {
        'id': scan.id,
        'video': scan.video_id,
        'status': scan.status,
        'is_toxic': scan.is_toxic,
        'max_score': scan.max_score,
        'flagged_labels': scan.flagged_labels,
        'action': scan.action,
        'analysis_version': scan.analysis_version,
        'sampling_interval': scan.sampling_interval,
        'observation_count': scan.observation_count,
        'error': scan.error,
        'modality_results': scan.modality_results,
        'observations': [
            {
                'timestamp_seconds': item.timestamp_seconds,
                'frame_number': item.frame_number,
                'extracted_text': item.extracted_text,
                'ocr_confidence': item.ocr_confidence,
                'text_labels': item.text_labels,
                'flagged_labels': item.flagged_labels,
                'toxicity_score': item.toxicity_score,
                'is_toxic': item.is_toxic,
            }
            for item in observations
        ],
    }
