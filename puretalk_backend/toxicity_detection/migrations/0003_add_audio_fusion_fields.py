from django.db import migrations, models


def add_audio_fusion_columns(apps, schema_editor):
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
    fields = (
        models.JSONField(name='audio_emotion', null=True, blank=True),
        models.JSONField(name='fusion_result', null=True, blank=True),
        models.CharField(name='action', max_length=40, default='allow'),
        models.BooleanField(name='latent_toxicity', default=False),
    )
    for field in fields:
        if field.name not in existing_columns:
            column_name = schema_editor.quote_name(field.name)
            column_type = field.db_type(connection)
            schema_editor.execute(
                f'ALTER TABLE {schema_editor.quote_name(table_name)} '
                f'ADD COLUMN {column_name} {column_type} NULL'
            )


class Migration(migrations.Migration):
    dependencies = [
        ('toxicity_detection', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            add_audio_fusion_columns,
            migrations.RunPython.noop,
        ),
    ]
