from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='attachment',
            field=models.FileField(upload_to='attachments/', null=True, blank=True),
        ),
        migrations.AddField(
            model_name='message',
            name='is_file',
            field=models.BooleanField(default=False),
        ),
    ]
