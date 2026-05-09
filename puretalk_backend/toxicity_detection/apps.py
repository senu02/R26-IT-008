from django.apps import AppConfig


class ToxicityDetectionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'toxicity_detection'
    verbose_name = 'Toxicity Detection'

    def ready(self):
        """
        Model is loaded lazily on first use to avoid allocating several GiB
        of RAM at startup (the vectorizer vocabulary expands to ~3-4 GiB when
        deserialised as numpy unicode arrays).  No eager load here.
        """
        pass