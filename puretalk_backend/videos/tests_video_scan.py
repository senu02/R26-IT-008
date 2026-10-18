import copy
import os
import tempfile
import wave
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from .audio_scan import analyse_video_audio, extract_audio
from .text_scan import analyse_visible_text
from .video_scan import combine_video_results, scan_video
from .views import VideoViewSet


def text_result(toxic=False, status='complete'):
    return {
        'status': status, 'error': 'OCR unavailable' if status == 'failed' else None,
        'is_toxic': toxic, 'max_score': 0.9 if toxic else 0.1,
        'flagged_labels': ['insult'] if toxic else [], 'observation_count': 1,
    }


def audio_result(toxic=False, status='complete', action=None):
    return {
        'status': status, 'error': 'Audio unavailable' if status in {'failed', 'partial'} else None,
        'analysis': {
            'transcribed_text': 'sample speech', 'is_toxic': toxic,
            'max_score': 0.85 if toxic else 0.1,
            'flagged_labels': ['threat'] if toxic else [],
            'labels': {'threat': 0.85 if toxic else 0.1}, 'error': None,
            'audio_emotion': {'available': True, 'probabilities': {'calm': 0.8}, 'error': None},
            'fusion': {'action': action or ('flag_toxic_content' if toxic else 'allow')},
        },
    }


class VideoAggregationTests(SimpleTestCase):
    def test_toxicity_from_either_source_is_preserved(self):
        for text_toxic, audio_toxic in [(True, False), (False, True), (True, True)]:
            with self.subTest(text=text_toxic, audio=audio_toxic):
                result = combine_video_results(text_result(text_toxic), audio_result(audio_toxic))
                self.assertTrue(result['is_toxic'])
                self.assertEqual(result['action'], 'flag_toxic_content')
                self.assertEqual(result['status'], 'complete')
        both = combine_video_results(text_result(True), audio_result(True))
        self.assertEqual(both['flagged_labels'], ['insult', 'threat'])
        self.assertEqual(both['max_score'], 0.9)

    def test_no_audio_track_is_not_a_failure(self):
        result = combine_video_results(text_result(), {'status': 'not_present'})
        self.assertEqual((result['status'], result['action']), ('complete', 'allow'))

    def test_failure_never_allows_clean_remaining_branch(self):
        for text, audio in [(text_result(status='failed'), audio_result()),
                            (text_result(), audio_result(status='failed')),
                            (text_result(), audio_result(status='partial'))]:
            result = combine_video_results(text, audio)
            self.assertEqual((result['status'], result['action']), ('partial', 'review_required'))
        result = combine_video_results(text_result(status='failed'), audio_result(status='failed'))
        self.assertEqual((result['status'], result['action']), ('failed', 'review_required'))

    def test_toxic_evidence_survives_other_branch_failure(self):
        for text, audio in [(text_result(True), audio_result(status='failed')),
                            (text_result(status='failed'), audio_result(True))]:
            result = combine_video_results(text, audio)
            self.assertEqual((result['status'], result['action']), ('partial', 'flag_toxic_content'))

    def test_audio_actions_retained_but_do_not_hide_toxic_screen_text(self):
        for action in ['possible_victim_report', 'warn_and_monitor']:
            audio = audio_result(action=action)
            self.assertEqual(combine_video_results(text_result(), audio)['action'], action)
            self.assertEqual(combine_video_results(text_result(True), audio)['action'], 'flag_toxic_content')

    def test_combination_does_not_mutate_shared_audio_result(self):
        audio = audio_result(True)
        original = copy.deepcopy(audio)
        combine_video_results(text_result(True), audio)
        self.assertEqual(audio, original)


class VideoAudioAdapterTests(SimpleTestCase):
    def extract_stub(self, source, output):
        self.output = output
        with wave.open(output, 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(16000)
            wav.writeframes(b'\x00\x00' * 16000)
        return {'has_audio': True, 'track_count': 1, 'duration_seconds': 1}

    @patch('videos.audio_scan.transcribe_and_analyse_audio')
    @patch('videos.audio_scan.extract_audio')
    def test_passes_readable_wav_and_cleans_up(self, extract, analyse):
        extract.side_effect = self.extract_stub
        expected = audio_result()['analysis']
        def check_file(audio, language):
            self.assertEqual(language, 'en-GB')
            self.assertEqual(audio.name, 'video_audio.wav')
            with wave.open(audio, 'rb') as wav:
                self.assertEqual((wav.getnchannels(), wav.getsampwidth(), wav.getframerate()), (1, 2, 16000))
            return expected
        analyse.side_effect = check_file
        result = analyse_video_audio('original.mp4', 'en-GB')
        self.assertEqual(result['status'], 'complete')
        self.assertIs(result['analysis'], expected)
        self.assertFalse(os.path.exists(self.output))

    @patch('videos.audio_scan.transcribe_and_analyse_audio')
    @patch('videos.audio_scan.extract_audio', return_value={'has_audio': False, 'track_count': 0})
    def test_no_track_skips_shared_audio_analysis(self, extract, analyse):
        self.assertEqual(analyse_video_audio('silent.mp4')['status'], 'not_present')
        analyse.assert_not_called()

    @patch('videos.audio_scan.transcribe_and_analyse_audio', side_effect=RuntimeError('recognizer unavailable'))
    @patch('videos.audio_scan.extract_audio')
    def test_exception_cleans_up_and_reports_failure(self, extract, analyse):
        extract.side_effect = self.extract_stub
        result = analyse_video_audio('original.mp4')
        self.assertEqual(result['status'], 'failed')
        self.assertFalse(os.path.exists(self.output))

    @patch('videos.audio_scan.transcribe_and_analyse_audio')
    @patch('videos.audio_scan.extract_audio')
    def test_shared_error_and_missing_emotion_are_not_clean(self, extract, analyse):
        extract.side_effect = self.extract_stub
        analyse.return_value = {'error': 'Speech could not be understood', 'is_toxic': False}
        self.assertEqual(analyse_video_audio('clip.mp4')['status'], 'failed')
        result = audio_result()['analysis']
        result['audio_emotion'] = {'available': False, 'probabilities': {}, 'error': 'Model unavailable'}
        analyse.return_value = result
        self.assertEqual(analyse_video_audio('clip.mp4')['status'], 'partial')


class RealMediaExtractionTests(SimpleTestCase):
    """Decode real media, with no network, OCR weights or speech service required."""

    def create_clip(self, path, with_audio=True):
        import av
        import numpy as np
        with av.open(str(path), 'w') as output:
            mp4 = path.suffix == '.mp4'
            video = output.add_stream('mpeg4' if mp4 else 'ffv1', rate=25)
            video.width = 32
            video.height = 32
            video.pix_fmt = 'yuv420p'
            audio = output.add_stream('aac' if mp4 else 'pcm_s16le', rate=48000) if with_audio else None
            if audio:
                audio.layout = 'stereo'
            for index in range(25):
                frame = av.VideoFrame.from_ndarray(np.zeros((32, 32, 3), dtype=np.uint8), format='rgb24')
                for packet in video.encode(frame):
                    output.mux(packet)
                if audio:
                    samples = (np.sin(2 * np.pi * 440 * np.arange(1920) / 48000) * 8000).astype(np.int16)
                    packed = np.repeat(samples, 2).reshape(1, -1)
                    frame = av.AudioFrame.from_ndarray(packed, format='s16', layout='stereo')
                    frame.sample_rate = 48000
                    frame.pts = index * 1920
                    for packet in audio.encode(frame):
                        output.mux(packet)
            for stream in [video] + ([audio] if audio else []):
                for packet in stream.encode(None):
                    output.mux(packet)

    def test_real_video_converts_stereo_48k_to_mono_16k(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'clip.mkv'
            wav_path = Path(directory) / 'audio.wav'
            self.create_clip(source)
            original = source.read_bytes()
            metadata = extract_audio(str(source), str(wav_path))
            self.assertTrue(metadata['has_audio'])
            with wave.open(str(wav_path), 'rb') as wav:
                self.assertEqual((wav.getframerate(), wav.getnchannels(), wav.getsampwidth()), (16000, 1, 2))
                self.assertAlmostEqual(wav.getnframes() / 16000, 1.0, places=2)
            self.assertEqual(source.read_bytes(), original)

    def test_real_video_without_audio(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'silent.mkv'
            self.create_clip(source, with_audio=False)
            result = analyse_video_audio(str(source))
            self.assertEqual(result['status'], 'not_present')

    @patch('videos.audio_scan.transcribe_and_analyse_audio')
    def test_real_mp4_aac_reaches_existing_audio_service(self, analyse):
        analyse.return_value = audio_result(True)['analysis']
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'clip.mp4'
            self.create_clip(source)
            result = analyse_video_audio(str(source))
            self.assertEqual(result['status'], 'complete')
            self.assertTrue(result['analysis']['is_toxic'])
            self.assertAlmostEqual(result['duration_seconds'], 1, delta=0.1)
            analyse.assert_called_once()

    def test_corrupt_video_is_a_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'broken.mp4'
            source.write_bytes(b'not a video')
            self.assertEqual(analyse_video_audio(str(source))['status'], 'failed')


class VideoScanOrchestrationTests(SimpleTestCase):
    @patch('videos.video_scan.VideoTextScan.objects.create')
    @patch('videos.video_scan.analyse_video_audio')
    @patch('videos.video_scan.analyse_visible_text')
    def test_audio_still_runs_when_ocr_fails_and_results_are_saved(self, text, audio, create):
        text.return_value = text_result(status='failed')
        audio.return_value = audio_result(True)
        record = SimpleNamespace(id=7, video_id=9, analysis_version='video_text_audio_v1',
                                 sampling_interval=2.0, save=Mock(), observations=Mock())
        record.observations.all.return_value = []
        create.return_value = record
        video = SimpleNamespace(video_file=SimpleNamespace(path='clip.mp4'))
        result = scan_video(video)
        audio.assert_called_once_with('clip.mp4', language='en-US')
        record.save.assert_called_once()
        self.assertEqual(result['status'], 'partial')
        self.assertTrue(result['is_toxic'])
        self.assertEqual(result['modality_results']['audio']['analysis']['transcribed_text'], 'sample speech')

    @patch('videos.text_scan._extract_visible_text', side_effect=RuntimeError('Text model unavailable'))
    def test_text_failure_is_explicit(self, extract):
        with self.assertLogs('videos.text_scan', level='ERROR'):
            result = analyse_visible_text(SimpleNamespace(pk=1), Mock())
        self.assertEqual(result['status'], 'failed')
        self.assertIn('Text model unavailable', result['error'])

    @patch('videos.text_scan.VideoTextObservation.objects.create')
    @patch('videos.text_scan.analyse_toxicity', return_value={'error': 'Model not available', 'is_toxic': False})
    @patch('videos.text_scan._get_ocr_reader')
    @patch('videos.text_scan.os.path.exists', return_value=True)
    @patch('cv2.cvtColor')
    @patch('cv2.VideoCapture')
    def test_ocr_does_not_save_model_failure_as_clean(self, capture_factory, convert, exists, reader, toxicity, create):
        capture = capture_factory.return_value
        capture.isOpened.return_value = True
        capture.read.return_value = (True, object())
        capture.get.return_value = 0
        reader.return_value.readtext.return_value = [(None, 'detected text', 0.9)]
        video = SimpleNamespace(pk=1, video_file=SimpleNamespace(path='clip.mp4'))
        with self.assertLogs('videos.text_scan', level='ERROR'):
            result = analyse_visible_text(video, Mock())
        self.assertEqual(result['status'], 'failed')
        self.assertIn('Model not available', result['error'])
        create.assert_not_called()
        capture.release.assert_called_once()

    @patch('videos.video_scan.scan_video')
    def test_scan_endpoint_requires_moderator(self, scan):
        request = APIRequestFactory().post('/scan-toxicity/')
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, is_moderator=False))
        response = VideoViewSet.as_view({'post': 'scan_toxicity'})(request, pk='1')
        self.assertEqual(response.status_code, 403)
        scan.assert_not_called()

    @patch.object(VideoViewSet, 'get_object')
    @patch('videos.video_scan.scan_video', return_value={'status': 'partial', 'error': 'Audio unavailable'})
    def test_endpoint_returns_partial_evidence_for_review(self, scan, get_object):
        request = APIRequestFactory().post('/scan-toxicity/', {'language': 'en-GB'})
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, is_moderator=True))
        response = VideoViewSet.as_view({'post': 'scan_toxicity'})(request, pk='1')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'partial')
        scan.assert_called_once_with(get_object.return_value, language='en-GB')
