"""Video-only audio extraction adapter; shared audio analysis stays unchanged."""

import os
import tempfile
import wave

from django.core.files import File

from toxicity_detection.services import transcribe_and_analyse_audio


def extract_audio(video_path: str, wav_path: str) -> dict:
    """Decode the first audio track as mono 16 kHz PCM WAV using PyAV.

    PyAV wheels include the media libraries; no ffmpeg executable is required.
    A missing track is distinct from a corrupt or undecodable audio track.
    """
    try:
        import av
    except ImportError as exc:
        raise RuntimeError('Video audio extraction requires PyAV: pip install av') from exc

    with av.open(video_path) as container:
        streams = list(container.streams.audio)
        if not streams:
            return {'has_audio': False, 'track_count': 0}
        stream = streams[0]
        resampler = av.AudioResampler(format='s16', layout='mono', rate=16000)
        sample_count = 0
        with wave.open(wav_path, 'wb') as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(16000)
            for frame in container.decode(stream):
                for converted in resampler.resample(frame):
                    output.writeframesraw(converted.to_ndarray().astype('<i2', copy=False).tobytes())
                    sample_count += converted.samples
            for converted in resampler.resample(None):
                output.writeframesraw(converted.to_ndarray().astype('<i2', copy=False).tobytes())
                sample_count += converted.samples
        if not sample_count:
            raise ValueError('An audio track exists but no audio samples could be decoded.')
        return {
            'has_audio': True, 'track_count': len(streams),
            'selected_track_index': stream.index,
            'sample_rate': 16000, 'channels': 1,
            'duration_seconds': round(sample_count / 16000, 3),
        }


def analyse_video_audio(video_path: str, language: str = 'en-US') -> dict:
    metadata = {}
    try:
        with tempfile.TemporaryDirectory(prefix='puretalk_video_audio_') as directory:
            wav_path = os.path.join(directory, 'audio.wav')
            metadata = extract_audio(video_path, wav_path)
            if not metadata['has_audio']:
                return {'status': 'not_present', 'error': None, **metadata}
            # Pass a file object, never the original video path. The shared
            # service owns its temporary copy; this adapter owns the WAV.
            with open(wav_path, 'rb') as audio:
                result = transcribe_and_analyse_audio(File(audio, name='video_audio.wav'), language=language)
        if result.get('error'):
            return {'status': 'failed', 'error': result['error'], 'analysis': result, **metadata}
        emotion = result.get('audio_emotion', {})
        warning = emotion.get('error')
        if not emotion.get('probabilities'):
            warning = warning or 'Vocal emotion analysis was unavailable; transcript analysis is retained.'
        if metadata['track_count'] > 1:
            warning = ' '.join(filter(None, [warning, 'Only the first audio track was analysed.']))
        return {
            'status': 'partial' if warning else 'complete',
            'error': warning, 'analysis': result, 'language': language, **metadata,
        }
    except Exception as exc:
        return {'status': 'failed', 'error': f'Video audio analysis failed: {exc}', **metadata}
