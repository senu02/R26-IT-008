from django.test import SimpleTestCase

from .text_scan import FRAME_INTERVAL_SECONDS, OCR_CONFIDENCE_THRESHOLD


class VideoTextScanConfigurationTests(SimpleTestCase):
    def test_scan_uses_bounded_sampling_configuration(self):
        self.assertGreater(FRAME_INTERVAL_SECONDS, 0)
        self.assertGreaterEqual(OCR_CONFIDENCE_THRESHOLD, 0)
        self.assertLessEqual(OCR_CONFIDENCE_THRESHOLD, 1)
