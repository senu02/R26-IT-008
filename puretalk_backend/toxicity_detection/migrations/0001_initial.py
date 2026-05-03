from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('posts', '0001_initial'),   # adjust to your latest posts migration
    ]

    operations = [
        migrations.CreateModel(
            name='ToxicityLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_type', models.CharField(choices=[('post', 'Post'), ('comment', 'Comment')], max_length=10)),
                ('analysed_text', models.TextField()),
                ('is_toxic', models.BooleanField(default=False)),
                ('max_score', models.FloatField(default=0.0)),
                ('label_scores', models.JSONField(default=dict)),
                ('flagged_labels', models.JSONField(default=list)),
                ('is_reviewed', models.BooleanField(default=False)),
                ('review_notes', models.TextField(blank=True, null=True)),
                ('overridden', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('author', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='toxicity_logs', to=settings.AUTH_USER_MODEL)),
                ('comment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='toxicity_logs', to='posts.comment')),
                ('post', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='toxicity_logs', to='posts.post')),
                ('reviewer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_toxicity_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='toxicitylog',
            index=models.Index(fields=['is_toxic', '-created_at'], name='toxlog_toxic_date_idx'),
        ),
        migrations.AddIndex(
            model_name='toxicitylog',
            index=models.Index(fields=['author', '-created_at'], name='toxlog_author_date_idx'),
        ),
        migrations.AddIndex(
            model_name='toxicitylog',
            index=models.Index(fields=['content_type', '-created_at'], name='toxlog_ctype_date_idx'),
        ),
        migrations.CreateModel(
            name='UserToxicityProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_posts_checked', models.PositiveIntegerField(default=0)),
                ('toxic_post_count', models.PositiveIntegerField(default=0)),
                ('total_comments_checked', models.PositiveIntegerField(default=0)),
                ('toxic_comment_count', models.PositiveIntegerField(default=0)),
                ('highest_toxicity_score', models.FloatField(default=0.0)),
                ('is_flagged', models.BooleanField(default=False)),
                ('is_suspended', models.BooleanField(default=False)),
                ('last_toxic_at', models.DateTimeField(null=True, blank=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='toxicity_profile', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-toxic_post_count']},
        ),
    ]