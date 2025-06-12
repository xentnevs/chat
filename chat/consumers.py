# chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Message
from asgiref.sync import sync_to_async


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        user1 = self.scope['user'].username 
        user2 = self.room_name
        self.room_group_name = f"chat_{''.join(sorted([user1, user2]))}"
        
        # Create personal group for the user
        self.user_group_name = f"user_{self.scope['user'].username}"

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        
        # Join personal group for user notifications
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        
        # Leave user's personal group
        await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive(self, text_data):
        import traceback
        try:
            data = json.loads(text_data)
            t = data.get('type')

            # Determine action based on message type
            if t == 'chat_message':
                await self.handle_new_message(data)
            elif t == 'edit_message':
                await self.handle_edit_message(data)
            elif t == 'delete_message':
                await self.handle_delete_message(data)
            elif t == 'gif_message':
                await self.handle_gif_message(data)
            elif t == 'file_message':
                await self.handle_file_message(data)
            elif t == 'emoji_message':
                await self.handle_emoji_message(data)
            else:
                # assume plain text message if content present
                message = data.get('message')
                if message is not None:
                    await self.handle_new_message(data)
        except Exception as e:
            traceback.print_exc()
            # Prevent connection from closing on unhandled errors
            return

    async def handle_new_message(self, data):
        message = data['message']
        sender = self.scope['user']  
        receiver = await self.get_receiver_user() 

        message_obj = await self.save_message(sender, receiver, message)

        # Broadcast new text message with timestamp
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'sender': sender.username,
                'receiver': receiver.username,
                'message': message,
                'message_id': message_obj.id,
                'timestamp': message_obj.timestamp.strftime('%H:%M')
            }
        )

    async def handle_edit_message(self, data):
        message_id = data['message_id']
        new_content = data['content']
        sender = self.scope['user']

        message_obj = await self.edit_message(message_id, sender, new_content)
        if message_obj:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'edit_message',
                    'message_id': message_id,
                    'content': new_content,
                    'sender': sender.username
                }
            )

    async def handle_delete_message(self, data):
        message_id = data['message_id']
        sender = self.scope['user']

        success = await self.delete_message(message_id, sender)
        if success:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'delete_message',
                    'message_id': message_id
                }
            )

    async def handle_gif_message(self, data):
        gif_url = data['gif_url']
        gif_description = data.get('gif_description', 'GIF')
        sender = self.scope['user']
        receiver = await self.get_receiver_user()

        message_obj = await self.save_gif_message(sender, receiver, gif_url, gif_description)
        
        # Compute current timestamp
        import datetime
        current_time = datetime.datetime.now().strftime('%H:%M')

        # Broadcast to room group (single event for everyone, including sender)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'gif_message',
                'sender': sender.username,
                'receiver': receiver.username,
                'gif_url': gif_url,
                'message': gif_description,
                'message_id': message_obj.id,
                'timestamp': current_time
            }
        )

    async def handle_file_message(self, data):
        sender = self.scope['user']
        receiver = await self.get_receiver_user()
        # save DB record
        msg = await self.save_file_message(
            sender, receiver,
            data['file_path'],
            data.get('filename','file')
        )
        # broadcast
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'file_message',
                'sender': sender.username,
                'receiver': receiver.username,
                'message_id': msg.id,
                'file_url': data['file_url'],
                'filename': data['filename'],
                'timestamp': msg.timestamp.strftime('%H:%M')
            }
        )

    async def handle_emoji_message(self, data):
        emoji_code = data['emoji_code']
        emoji_name = data.get('emoji_name', 'Emoji')
        sender = self.scope['user']
        receiver = await self.get_receiver_user()

        message_obj = await self.save_emoji_message(sender, receiver, emoji_code, emoji_name)
        
        # Compute current timestamp
        import datetime
        current_time = datetime.datetime.now().strftime('%H:%M')

        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'emoji_message',
                'sender': sender.username,
                'receiver': receiver.username,
                'emoji_code': emoji_code,
                'message': emoji_name,
                'message_id': message_obj.id,
                'timestamp': current_time
            }
        )

    async def chat_message(self, event):
        # Send text message to WebSocket with timestamp
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'sender': event['sender'],
            'receiver': event['receiver'],
            'message': event['message'],
            'message_id': event['message_id'],
            'timestamp': event.get('timestamp', '')
        }))
        
    async def edit_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'edit_message',
            'message_id': event['message_id'],
            'content': event['content'],
            'sender': event['sender']
        }))

    async def delete_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'delete_message',
            'message_id': event['message_id']
        }))

    async def gif_message(self, event):
        print(f"Sending GIF message event: {event}")
        await self.send(text_data=json.dumps({
            'type': 'gif_message',
            'message_id': event['message_id'],
            'sender': event['sender'],
            'receiver': event['receiver'],
            'message': event.get('message', ''),
            'gif_url': event['gif_url'],
            'timestamp': event.get('timestamp', '')
        }))

    async def file_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'file_message',
            'message_id': event['message_id'],
            'sender': event['sender'],
            'receiver': event['receiver'],
            'file_url': event['file_url'],
            'filename': event['filename'],
            'timestamp': event['timestamp']
        }))

    async def emoji_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'emoji_message',
            'message_id': event['message_id'],
            'sender': event['sender'],
            'receiver': event['receiver'],
            'emoji_code': event['emoji_code'],
            'message': event.get('message', ''),
            'timestamp': event.get('timestamp', '')
        }))

    @sync_to_async
    def save_message(self, sender, receiver, message):
        return Message.objects.create(sender=sender, receiver=receiver, content=message)
        
    @sync_to_async
    def save_gif_message(self, sender, receiver, gif_url, content):
        return Message.objects.create(
            sender=sender, 
            receiver=receiver, 
            content=content,
            is_gif=True,
            gif_url=gif_url
        )

    @sync_to_async
    def save_file_message(self, sender, receiver, file_path, filename):
        return Message.objects.create(
            sender=sender,
            receiver=receiver,
            content=filename,
            is_file=True,
            attachment=file_path
        )

    @sync_to_async
    def save_emoji_message(self, sender, receiver, emoji_code, content):
        # Make sure emoji_code is properly stored as Unicode
        return Message.objects.create(
            sender=sender, 
            receiver=receiver, 
            content=content,
            is_emoji=True,
            emoji_code=emoji_code
        )

    @sync_to_async
    def edit_message(self, message_id, sender, new_content):
        try:
            message = Message.objects.get(id=message_id, sender=sender)
            message.content = new_content
            message.save()
            return message
        except Message.DoesNotExist:
            return None

    @sync_to_async
    def delete_message(self, message_id, sender):
        try:
            message = Message.objects.get(id=message_id, sender=sender)
            message.is_deleted = True
            message.save()
            return True
        except Message.DoesNotExist:
            return False

    @sync_to_async
    def get_receiver_user(self):
        return User.objects.get(username=self.room_name)

    @sync_to_async
    def get_message(self, message_id):
        try:
            return Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return None




