from django.db import migrations

def fix_emoji_display(apps, schema_editor):
    Message = apps.get_model('chat', 'Message')
    # Get all emoji messages
    emoji_messages = Message.objects.filter(is_emoji=True)
    
    # Make sure the emoji_code is properly stored for each emoji message
    for message in emoji_messages:
        if message.emoji_code:
            # Re-save to ensure proper Unicode storage
            message.save()

class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0008_message_emoji_code_message_is_emoji'),
    ]

    operations = [
        migrations.RunPython(fix_emoji_display, migrations.RunPython.noop),
    ]
