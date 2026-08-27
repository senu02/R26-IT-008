import os
import pickle
import numpy as np
import logging
import tempfile
import speech_recognition as sr

logger = logging.getLogger(__name__)

# Label names matching your training CSV columns (Kaggle Toxic Comment dataset)
TOXICITY_LABELS = [
    'toxic',
    'severe_toxic',
    'obscene',
    'threat',
    'insult',
    'identity_hate'
]

TOXICITY_THRESHOLD = 0.5  # confidence threshold


class ToxicityDetector:
    """
    Singleton service for toxicity detection using the trained LSTM model.
    Loads model and vectorizer once on startup.
    """

    _instance = None
    _model = None
    _vectorizer = None
    _is_loaded = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self):
        """Load the model and vectorizer from disk (called once at startup)."""
        if self._is_loaded:
            return

        try:
            import tensorflow as tf
            from tensorflow.keras.layers import TextVectorization

            base_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                'model', 'toxicity_detection'
            )

            model_path = os.path.join(base_dir, 'toxicity_model.h5')
            vectorizer_path = os.path.join(base_dir, 'vectorizer.pkl')

            if not os.path.exists(model_path):
                logger.warning(f"Toxicity model not found at: {model_path}")
                return

            if not os.path.exists(vectorizer_path):
                logger.warning(f"Vectorizer not found at: {vectorizer_path}")
                return

            # Load vectorizer — strip dtype from config (Keras version mismatch fix)
            with open(vectorizer_path, 'rb') as f:
                vectorizer_data = pickle.load(f)

            vec_config = vectorizer_data['config'].copy()
            # Remove dtype key that causes "float32" error on newer/older Keras
            vec_config.pop('dtype', None)
            vec_config.pop('batch_input_shape', None)

            vectorizer = TextVectorization(
                max_tokens=vec_config.get('max_tokens', None),
                output_mode=vec_config.get('output_mode', 'int'),
                output_sequence_length=vec_config.get('output_sequence_length', None),
                standardize='lower_and_strip_punctuation',
                split='whitespace',
            )
            # Use adapt() to initialize the lookup table before setting vocabulary
            vectorizer.adapt(['dummy text'])
            vectorizer.set_vocabulary(vectorizer_data['vocab'])
            self._vectorizer = vectorizer

            # Load model
            self._model = tf.keras.models.load_model(model_path)
            self._is_loaded = True

            logger.info("✅ Toxicity model loaded successfully.")

        except Exception as e:
            logger.error(f"❌ Failed to load toxicity model: {e}")
            self._is_loaded = False

    def predict(self, text: str) -> dict:
        """
        Analyse a text string for toxicity.

        Returns:
            {
                'is_toxic': bool,
                'labels': {'toxic': float, 'severe_toxic': float, ...},
                'flagged_labels': ['toxic', ...],
                'max_score': float,
                'error': str | None
            }
        """
        if not self._is_loaded:
            self.load_model()

        if not self._is_loaded:
            return {
                'is_toxic': False,
                'labels': {},
                'flagged_labels': [],
                'max_score': 0.0,
                'error': 'Model not available'
            }

        if not text or not text.strip():
            return {
                'is_toxic': False,
                'labels': {},
                'flagged_labels': [],
                'max_score': 0.0,
                'error': None
            }

        try:
            import tensorflow as tf

            vectorized = self._vectorizer([text])
            predictions = self._model.predict(vectorized, verbose=0)[0]

            label_scores = {
                label: float(score)
                for label, score in zip(TOXICITY_LABELS, predictions)
            }

            flagged = [
                label for label, score in label_scores.items()
                if score >= TOXICITY_THRESHOLD
            ]

            max_score = float(max(predictions))

            return {
                'is_toxic': len(flagged) > 0,
                'labels': label_scores,
                'flagged_labels': flagged,
                'max_score': max_score,
                'error': None
            }

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                'is_toxic': False,
                'labels': {},
                'flagged_labels': [],
                'max_score': 0.0,
                'error': str(e)
            }


# Module-level singleton
detector = ToxicityDetector()


def analyse_toxicity(text: str) -> dict:
    """Public helper used by posts/comments views."""
    return detector.predict(text)


def is_toxic(text: str) -> bool:
    """Quick boolean check."""
    result = analyse_toxicity(text)
    return result.get('is_toxic', False)


def transcribe_and_analyse_audio(audio_file, language: str = 'en-US') -> dict:
    """
    Transcribes an uploaded audio file using SpeechRecognition and checks toxicity of the text.
    """
    recognizer = sr.Recognizer()
    temp_path = None
    transcribed_text = ""

    try:
        # Determine extension
        extension = '.wav'
        if hasattr(audio_file, 'name') and audio_file.name:
            _, ext = os.path.splitext(audio_file.name)
            if ext:
                extension = ext.lower()

        # Write uploaded file to temporary file for speech_recognition
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
            if hasattr(audio_file, 'chunks'):
                for chunk in audio_file.chunks():
                    tmp.write(chunk)
            elif hasattr(audio_file, 'read'):
                tmp.write(audio_file.read())
            elif isinstance(audio_file, (bytes, bytearray)):
                tmp.write(audio_file)
            elif isinstance(audio_file, str) and os.path.exists(audio_file):
                temp_path = audio_file

            if temp_path is None:
                temp_path = tmp.name

        # Perform Speech-to-Text
        try:
            with sr.AudioFile(temp_path) as source:
                audio_data = recognizer.record(source)
                transcribed_text = recognizer.recognize_google(audio_data, language=language)
        except sr.UnknownValueError:
            return {
                'transcribed_text': '',
                'is_toxic': False,
                'labels': {},
                'flagged_labels': [],
                'max_score': 0.0,
                'error': 'Speech could not be understood from the audio file.'
            }
        except sr.RequestError as e:
            return {
                'transcribed_text': '',
                'is_toxic': False,
                'labels': {},
                'flagged_labels': [],
                'max_score': 0.0,
                'error': f'Speech recognition service error: {e}'
            }
        except Exception as e:
            logger.warning(f"Standard AudioFile failed ({e}). Attempting Whisper fallback...")
            try:
                import whisper
                model = whisper.load_model("tiny")
                res_w = model.transcribe(temp_path)
                transcribed_text = res_w.get('text', '').strip()
                if not transcribed_text:
                    return {
                        'transcribed_text': '',
                        'is_toxic': False,
                        'labels': {},
                        'flagged_labels': [],
                        'max_score': 0.0,
                        'error': 'Speech could not be understood from the audio file.'
                    }
            except Exception as w_err:
                logger.error(f"Whisper fallback error: {w_err}")
                return {
                    'transcribed_text': '',
                    'is_toxic': False,
                    'labels': {},
                    'flagged_labels': [],
                    'max_score': 0.0,
                    'error': f'Unsupported audio format or corrupt file. Please upload standard WAV audio. ({e})'
                }

        # Run toxicity detection on transcribed text
        analysis = analyse_toxicity(transcribed_text)
        analysis['transcribed_text'] = transcribed_text
        return analysis

    except Exception as e:
        logger.error(f"Audio toxicity pipeline exception: {e}")
        return {
            'transcribed_text': '',
            'is_toxic': False,
            'labels': {},
            'flagged_labels': [],
            'max_score': 0.0,
            'error': str(e)
        }
    finally:
        if temp_path and os.path.exists(temp_path) and temp_path != getattr(audio_file, 'name', None):
            try:
                os.remove(temp_path)
            except Exception:
                pass