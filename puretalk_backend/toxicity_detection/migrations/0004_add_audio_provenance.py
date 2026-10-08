from django.db import migrations, models


def add_audio_provenance_columns(apps, schema_editor):
    log_model = apps.get_model('toxicity_detection', 'ToxicityLog')
    connection = schema_editor.connection
    table_name = log_model._meta.db_table

    if table_name not in connection.introspection.table_names():
        return

    existing_columns = {
        column.name for column in connection.introspection.get_table_description(
            connection.cursor(), table_name
        )
    }
    columns = (
        ('original_is_toxic', 'bool'),
        ('original_max_score', 'real'),
        ('original_label_scores', 'TEXT'),
        ('analysis_version', 'varchar(40)'),
    )
    for column_name, column_type in columns:
        if column_name not in existing_columns:
            schema_editor.execute(
                f'ALTER TABLE {schema_editor.quote_name(table_name)} '
                f'ADD COLUMN {schema_editor.quote_name(column_name)} '
                f'{column_type} NULL'
            )


class Migration(migrations.Migration):
    dependencies = [
        ('toxicity_detection', '0003_add_audio_fusion_fields'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='toxicitylog',
                    name='original_is_toxic',
                    field=models.BooleanField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='toxicitylog',
                    name='original_max_score',
                    field=models.FloatField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='toxicitylog',
                    name='original_label_scores',
                    field=models.JSONField(default=dict, blank=True),
                ),
                migrations.AddField(
                    model_name='toxicitylog',
                    name='analysis_version',
                    field=models.CharField(default='text_v1', max_length=40),
                ),
            ],
            database_operations=[
                migrations.RunPython(
                    add_audio_provenance_columns,
                    migrations.RunPython.noop,
                ),
            ],
        ),
    ]
