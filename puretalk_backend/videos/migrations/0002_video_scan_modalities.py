from django.db import migrations, models


def add_modality_results(apps, schema_editor):
    # The inherited 0001 migration deliberately has only scan models in its
    # state (Video itself is a legacy table). Avoid rebuilding that table and
    # resolving its legacy foreign key merely to add this JSON column.
    table = 'videos_videotextscan'
    with schema_editor.connection.cursor() as cursor:
        columns = schema_editor.connection.introspection.get_table_description(cursor, table)
    if 'modality_results' not in {column.name for column in columns}:
        quote = schema_editor.quote_name
        field_type = models.JSONField().db_type(schema_editor.connection)
        schema_editor.execute(
            f'ALTER TABLE {quote(table)} ADD COLUMN {quote("modality_results")} '
            f"{field_type} NOT NULL DEFAULT '{{}}'"
        )


class Migration(migrations.Migration):
    dependencies = [('videos', '0001_video_text_scan')]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[migrations.RunPython(add_modality_results)],
            state_operations=[migrations.AddField(
                model_name='videotextscan', name='modality_results',
                field=models.JSONField(blank=True, default=dict),
            )],
        ),
        migrations.SeparateDatabaseAndState(state_operations=[migrations.AlterField(
            model_name='videotextscan', name='status',
            field=models.CharField(max_length=20, default='processing', choices=[
                ('processing', 'Processing'), ('complete', 'Complete'),
                ('partial', 'Partial'), ('failed', 'Failed'),
            ]),
        )]),
    ]
