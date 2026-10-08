from django.db import migrations, models
import django.db.models.deletion


def create_video_text_tables(apps, schema_editor):
    connection = schema_editor.connection
    q = schema_editor.quote_name
    scan_table = q('videos_videotextscan')
    observation_table = q('videos_videotextobservation')
    video_table = q('videos_video')

    schema_editor.execute(f'''
        CREATE TABLE IF NOT EXISTS {scan_table} (
            "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
            "status" varchar(20) NOT NULL DEFAULT 'processing',
            "is_toxic" bool NOT NULL DEFAULT 0,
            "max_score" real NOT NULL DEFAULT 0.0,
            "flagged_labels" text NOT NULL DEFAULT '[]',
            "action" varchar(40) NOT NULL DEFAULT 'allow',
            "analysis_version" varchar(40) NOT NULL DEFAULT 'video_text_v1',
            "sampling_interval" real NOT NULL DEFAULT 2.0,
            "observation_count" integer unsigned NOT NULL DEFAULT 0,
            "error" text NULL,
            "created_at" datetime NOT NULL,
            "completed_at" datetime NULL,
            "video_id" bigint NOT NULL REFERENCES {video_table} ("id") DEFERRABLE INITIALLY DEFERRED
        )
    ''')
    schema_editor.execute(f'''
        CREATE TABLE IF NOT EXISTS {observation_table} (
            "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
            "timestamp_seconds" real NOT NULL,
            "frame_number" integer unsigned NOT NULL,
            "extracted_text" text NOT NULL,
            "ocr_confidence" real NOT NULL DEFAULT 0.0,
            "text_labels" text NOT NULL DEFAULT '{{}}',
            "flagged_labels" text NOT NULL DEFAULT '[]',
            "toxicity_score" real NOT NULL DEFAULT 0.0,
            "is_toxic" bool NOT NULL DEFAULT 0,
            "created_at" datetime NOT NULL,
            "scan_id" bigint NOT NULL REFERENCES {scan_table} ("id") DEFERRABLE INITIALLY DEFERRED
        )
    ''')
    schema_editor.execute(
        f'CREATE INDEX IF NOT EXISTS "videos_videotextscan_video_id" '
        f'ON {scan_table} ("video_id")'
    )
    schema_editor.execute(
        f'CREATE INDEX IF NOT EXISTS "videos_videotextobservation_scan_timestamp" '
        f'ON {observation_table} ("scan_id", "timestamp_seconds")'
    )
    schema_editor.execute(
        f'CREATE INDEX IF NOT EXISTS "videos_videotextobservation_toxic_created" '
        f'ON {observation_table} ("is_toxic", "created_at")'
    )


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='VideoTextScan',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('status', models.CharField(choices=[('processing', 'Processing'), ('complete', 'Complete'), ('failed', 'Failed')], default='processing', max_length=20)),
                        ('is_toxic', models.BooleanField(default=False)),
                        ('max_score', models.FloatField(default=0.0)),
                        ('flagged_labels', models.JSONField(default=list)),
                        ('action', models.CharField(default='allow', max_length=40)),
                        ('analysis_version', models.CharField(default='video_text_v1', max_length=40)),
                        ('sampling_interval', models.FloatField(default=2.0)),
                        ('observation_count', models.PositiveIntegerField(default=0)),
                        ('error', models.TextField(blank=True, null=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('completed_at', models.DateTimeField(blank=True, null=True)),
                        ('video', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='text_scans', to='videos.video')),
                    ],
                    options={'ordering': ['-created_at']},
                ),
                migrations.CreateModel(
                    name='VideoTextObservation',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('timestamp_seconds', models.FloatField()),
                        ('frame_number', models.PositiveIntegerField()),
                        ('extracted_text', models.TextField()),
                        ('ocr_confidence', models.FloatField(default=0.0)),
                        ('text_labels', models.JSONField(default=dict)),
                        ('flagged_labels', models.JSONField(default=list)),
                        ('toxicity_score', models.FloatField(default=0.0)),
                        ('is_toxic', models.BooleanField(default=False)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('scan', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='observations', to='videos.videotextscan')),
                    ],
                    options={'ordering': ['timestamp_seconds']},
                ),
            ],
            database_operations=[migrations.RunPython(create_video_text_tables, migrations.RunPython.noop)],
        ),
    ]
