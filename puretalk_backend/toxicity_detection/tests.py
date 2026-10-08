from django.test import SimpleTestCase

from .services import fuse_text_and_emotion


class WeightedFusionTests(SimpleTestCase):
	def setUp(self):
		self.clean_text = {
			'labels': {
				'toxic': 0.0,
				'severe_toxic': 0.0,
				'obscene': 0.0,
				'threat': 0.0,
				'insult': 0.0,
				'identity_hate': 0.0,
			}
		}

	def test_subthreshold_anger_warns_without_rewrite(self):
		result = fuse_text_and_emotion(
			self.clean_text, {'probabilities': {'angry': 0.8}}
		)

		self.assertEqual(result['action'], 'warn_and_monitor')
		self.assertTrue(result['action_flags']['latent_toxicity'])
		self.assertFalse(result['action_flags']['rewrite_content'])

	def test_toxic_text_remains_flagged(self):
		toxic_text = {
			'labels': {**self.clean_text['labels'], 'toxic': 0.9, 'insult': 0.8}
		}
		result = fuse_text_and_emotion(
			toxic_text, {'probabilities': {'angry': 0.8}}
		)

		self.assertEqual(result['action'], 'flag_toxic_content')
		self.assertTrue(result['action_flags']['rewrite_content'])
		self.assertFalse(result['action_flags']['latent_toxicity'])

	def test_fear_routes_to_victim_report(self):
		result = fuse_text_and_emotion(
			self.clean_text, {'probabilities': {'fear': 0.8}}
		)

		self.assertEqual(result['action'], 'possible_victim_report')
		self.assertTrue(result['action_flags']['possible_victim_report'])
		self.assertFalse(result['action_flags']['rewrite_content'])

	def test_neutral_audio_allows_clean_text(self):
		result = fuse_text_and_emotion(
			self.clean_text, {'probabilities': {'neutral': 0.8}}
		)

		self.assertEqual(result['action'], 'allow')
		self.assertFalse(result['action_flags']['latent_toxicity'])

	def test_calm_audio_never_dilutes_toxic_text(self):
		toxic_text = {
			'labels': {**self.clean_text['labels'], 'toxic': 1.0, 'insult': 1.0}
		}
		result = fuse_text_and_emotion(
			toxic_text, {'probabilities': {'calm': 0.9}}
		)

		self.assertEqual(result['fused_labels']['toxic'], 1.0)
		self.assertEqual(result['fused_labels']['insult'], 1.0)
		self.assertEqual(result['action'], 'flag_toxic_content')
		self.assertEqual(result['label_breakdown']['toxic']['audio_contribution'], 0.0)
