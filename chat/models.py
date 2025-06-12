from django.db import models
from django.contrib.auth.models import User

class Message(models.Model):
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_messages", on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    voice_message = models.FileField(upload_to='voice_messages/', null=True, blank=True)
    is_voice_message = models.BooleanField(default=False)
    is_gif = models.BooleanField(default=False)
    gif_url = models.URLField(null=True, blank=True)
    # new fields for generic attachments/images
    attachment = models.FileField(upload_to='attachments/', null=True, blank=True)
    is_file = models.BooleanField(default=False)
    # new fields for emojis
    is_emoji = models.BooleanField(default=False)
    emoji_code = models.CharField(max_length=100, null=True, blank=True)
    
    @property
    def get_emoji_character(self):
        """
        Returns the emoji character ensuring proper Unicode handling.
        """
        if self.is_emoji and self.emoji_code:
            return self.emoji_code
        return ""

    def __str__(self):
        return f"{self.sender} -> {self.receiver}: {self.content[:20]}"

class FriendRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    
    sender = models.ForeignKey(User, related_name='sent_friend_requests', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_friend_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('sender', 'receiver')

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username}: {self.status}"

class Friendship(models.Model):
    STATUS_CHOICES = (
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked'),
    )
    
    user1 = models.ForeignKey(User, related_name='friendships1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name='friendships2', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='accepted')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user1', 'user2')

    def __str__(self):
        return f"{self.user1.username} - {self.user2.username}: {self.status}"
