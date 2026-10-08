"""Apply only the additive video-scan column on the legacy shared database."""

from importlib import import_module

from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder


class Command(BaseCommand):
    help = 'Prepare video audio scan storage without running other apps migrations.'

    def handle(self, *args, **options):
        # This checkout is missing the historical videos/0001_initial.py even
        # though its tables and migration record exist. Django's global executor
        # cannot render that incomplete state. Apply only this self-contained,
        # additive operation; do not fake or reconstruct other members' models.
        if 'videos_videotextscan' not in connection.introspection.table_names():
            raise CommandError('Existing video text scan tables are required first.')
        recorder = MigrationRecorder(connection)
        if ('videos', '0001_video_text_scan') not in recorder.applied_migrations():
            raise CommandError('The existing video text scan migration must already be applied.')
        migration = import_module('videos.migrations.0002_video_scan_modalities')
        with connection.schema_editor() as editor:
            migration.add_modality_results(None, editor)
            if ('videos', '0002_video_scan_modalities') not in recorder.applied_migrations():
                recorder.record_applied('videos', '0002_video_scan_modalities')
        self.stdout.write(self.style.SUCCESS('Video text/audio scan storage is ready.'))
