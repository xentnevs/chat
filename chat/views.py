from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import Message, Friendship, FriendRequest
from django.db.models import Q
from django.utils import timezone
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json
from django.core.files.storage import default_storage
import os


@login_required
def chat_room(request, room_name):
    # Get the user or return 404 if not found
    chat_user = get_object_or_404(User, username=room_name)
    
    # Only show friends in the chat sidebar
    friends = get_friends_list(request.user)
    friend_ids = [friend['id'] for friend in friends]
    users = User.objects.filter(id__in=friend_ids)
    
    chats = Message.objects.filter(
        (Q(sender=request.user) & Q(receiver=chat_user)) |
        (Q(receiver=request.user) & Q(sender=chat_user))
    ).order_by('timestamp')

    user_last_messages = []
    for user in users:
        last_message = Message.objects.filter(
            (Q(sender=request.user) & Q(receiver=user)) |
            (Q(receiver=request.user) & Q(sender=user))
        ).order_by('-timestamp').first()

        user_last_messages.append({
            'user': user,
            'last_message': last_message
        })

    # Get today's and yesterday's dates for date separators
    today = timezone.now().strftime('%Y-%m-%d')
    yesterday = (timezone.now() - timezone.timedelta(days=1)).strftime('%Y-%m-%d')

    return render(request, 'chat.html', {
        'room_name': room_name,
        'chats': chats,
        'users': users,
        'user_last_messages': user_last_messages,
        'today': today,
        'yesterday': yesterday
    })

# Helper function to get a user's friends list
def get_friends_list(user):
    friendships = Friendship.objects.filter(
        (Q(user1=user) | Q(user2=user)),
        status='accepted'
    ).select_related('user1', 'user2')
    
    friends = []
    for friendship in friendships:
        friend = friendship.user2 if friendship.user1 == user else friendship.user1
        friends.append({
            'id': friend.id,
            'username': friend.username,
            'first_name': friend.first_name,
            'last_name': friend.last_name,
            'date_joined': friend.date_joined.isoformat()
        })
    
    return friends

@login_required
def chat(request):
    # Only show friends in the chat sidebar
    friends = get_friends_list(request.user)
    friend_ids = [friend['id'] for friend in friends]
    users = User.objects.filter(id__in=friend_ids)
    
    user_last_messages = []

    for user in users:
        last_message = Message.objects.filter(
            (Q(sender=request.user) & Q(receiver=user)) |
            (Q(receiver=request.user) & Q(sender=user))
        ).order_by('-timestamp').first()

        user_last_messages.append({
            'user': user,
            'last_message': last_message
        })
    
    # Get today's and yesterday's dates for date separators
    today = timezone.now().strftime('%Y-%m-%d')
    yesterday = (timezone.now() - timezone.timedelta(days=1)).strftime('%Y-%m-%d')

    return render(request, 'chat.html', {
        'users': users,
        'user_last_messages': user_last_messages,
        'today': today,
        'yesterday': yesterday
    })

# New views for the friends page

@login_required
def friends_page(request):
    """View function for the friends management page"""
    return render(request, 'friends.html')

@login_required
def search_users(request):
    """API endpoint for searching users"""
    query = request.GET.get('q', '')
    if not query or len(query) < 2:
        return JsonResponse({'users': []})
    
    # Search users excluding the current user
    users = User.objects.filter(
        Q(username__icontains=query) |
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query)
    ).exclude(id=request.user.id)[:20]
    
    # Get all friendships for the current user
    friendships = Friendship.objects.filter(
        (Q(user1=request.user) | Q(user2=request.user)),
        status='accepted'
    )
    
    # Get friend IDs
    friend_ids = set()
    for friendship in friendships:
        friend = friendship.user2 if friendship.user1 == request.user else friendship.user1
        friend_ids.add(friend.id)
    
    # Get all pending friend requests sent by the current user
    outgoing_requests = FriendRequest.objects.filter(
        sender=request.user, status='pending'
    ).select_related('receiver')
    
    # Map of usernames to request IDs for outgoing requests
    outgoing_map = {req.receiver.username: {'id': req.id} for req in outgoing_requests}
    
    # Get all pending friend requests received by the current user
    incoming_requests = FriendRequest.objects.filter(
        receiver=request.user, status='pending'
    ).select_related('sender')
    
    # Map of usernames to request IDs for incoming requests
    incoming_map = {req.sender.username: {'id': req.id} for req in incoming_requests}
    
    # Format user data
    result = []
    for user in users:
        user_data = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_friend': user.id in friend_ids,
            'outgoing_request': outgoing_map.get(user.username),
            'incoming_request': incoming_map.get(user.username)
        }
        result.append(user_data)
    
    return JsonResponse({'users': result})

@login_required
@require_POST
def send_friend_request(request):
    """API endpoint for sending a friend request"""
    try:
        print("Received friend request")
        data = json.loads(request.body)
        username = data.get('username')
        print(f"Friend request from {request.user.username} to {username}")
        
        if not username:
            return JsonResponse({'error': 'Username is required'}, status=400)
        
        # Get the receiver user
        try:
            receiver = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        
        # Check if users are already friends
        friendship_exists = Friendship.objects.filter(
            (Q(user1=request.user, user2=receiver) | Q(user1=receiver, user2=request.user)),
            status='accepted'
        ).exists()
        
        if friendship_exists:
            return JsonResponse({'error': 'Already friends'}, status=400)
        
        # Check if there's already a pending request
        request_exists = FriendRequest.objects.filter(
            sender=request.user, receiver=receiver, status='pending'
        ).exists()
        
        if request_exists:
            return JsonResponse({'error': 'Friend request already sent'}, status=400)
        
        # Check for any existing request (including rejected ones) and update it
        existing_request = FriendRequest.objects.filter(
            sender=request.user, receiver=receiver
        ).first()
        
        if existing_request:
            # Update the existing request to pending status
            print(f"Found existing request (status: {existing_request.status}), updating to pending")
            existing_request.status = 'pending'
            existing_request.save()
            friend_request = existing_request
        else:
            # Create a new friend request if one doesn't exist
            friend_request = FriendRequest.objects.create(
                sender=request.user,
                receiver=receiver,
                status='pending'
            )
        
        return JsonResponse({
            'success': True,
            'request_id': friend_request.id
        })
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_POST
def accept_friend_request(request):
    """API endpoint for accepting a friend request"""
    try:
        data = json.loads(request.body)
        request_id = data.get('request_id')
        
        if not request_id:
            return JsonResponse({'error': 'Request ID is required'}, status=400)
        
        # Get the friend request
        friend_request = get_object_or_404(FriendRequest, id=request_id, receiver=request.user, status='pending')
        
        # Update the request status
        friend_request.status = 'accepted'
        friend_request.save()
        
        # Create a friendship
        Friendship.objects.create(
            user1=friend_request.sender,
            user2=friend_request.receiver,
            status='accepted'
        )
        
        return JsonResponse({'success': True})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_POST
def reject_friend_request(request):
    """API endpoint for rejecting a friend request"""
    try:
        data = json.loads(request.body)
        request_id = data.get('request_id')
        
        if not request_id:
            return JsonResponse({'error': 'Request ID is required'}, status=400)
        
        # Get the friend request
        friend_request = get_object_or_404(FriendRequest, id=request_id, receiver=request.user, status='pending')
        
        # Update the request status
        friend_request.status = 'rejected'
        friend_request.save()
        
        return JsonResponse({'success': True})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_POST
def cancel_friend_request(request):
    """API endpoint for canceling a sent friend request"""
    try:
        data = json.loads(request.body)
        request_id = data.get('request_id')
        
        if not request_id:
            return JsonResponse({'error': 'Request ID is required'}, status=400)
        
        # Get the friend request
        friend_request = get_object_or_404(FriendRequest, id=request_id, sender=request.user, status='pending')
        
        # Delete the request
        friend_request.delete()
        
        return JsonResponse({'success': True})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def get_friends(request):
    """API endpoint to get the user's friends list"""
    friends = get_friends_list(request.user)
    return JsonResponse({'friends': friends})

@login_required
def get_friend_requests(request):
    """API endpoint to get all pending friend requests"""
    # Get incoming requests
    incoming_requests = FriendRequest.objects.filter(
        receiver=request.user, status='pending'
    ).select_related('sender')
    
    incoming = [{
        'id': req.id,
        'sender': {
            'id': req.sender.id,
            'username': req.sender.username,
            'first_name': req.sender.first_name,
            'last_name': req.sender.last_name
        },
        'created_at': req.created_at.isoformat()
    } for req in incoming_requests]
    
    # Get outgoing requests
    outgoing_requests = FriendRequest.objects.filter(
        sender=request.user, status='pending'
    ).select_related('receiver')
    
    outgoing = [{
        'id': req.id,
        'receiver': {
            'id': req.receiver.id,
            'username': req.receiver.username,
            'first_name': req.receiver.first_name,
            'last_name': req.receiver.last_name
        },
        'created_at': req.created_at.isoformat()
    } for req in outgoing_requests]
    
    return JsonResponse({
        'incoming': incoming,
        'outgoing': outgoing
    })

@login_required
def get_profile(request, username):
    """API endpoint to get a user's profile information"""
    user = get_object_or_404(User, username=username)
    
    # Check if the requesting user is friends with the profile owner
    is_friend = Friendship.objects.filter(
        (Q(user1=request.user) & Q(user2=user)) |
        (Q(user1=user) & Q(user2=request.user)),
        status='accepted'
    ).exists()
    
    # Get the user's messages
    messages = Message.objects.filter(
        (Q(sender=user) & Q(receiver=request.user)) |
        (Q(sender=request.user) & Q(receiver=user))
    ).order_by('-timestamp')[:10]
    
    # Format messages for the response
    formatted_messages = []
    for message in messages:
        formatted_messages.append({
            'id': message.id,
            'sender': message.sender.username,
            'receiver': message.receiver.username,
            'content': message.content,
            'timestamp': message.timestamp.isoformat(),
            'is_voice_message': message.is_voice_message,
            'voice_message_url': message.voice_message.url if message.is_voice_message else None
        })
    
    return JsonResponse({
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_friend': is_friend,
        'messages': formatted_messages
    })

@login_required
@require_POST
def edit_message(request, message_id):
    """API endpoint to edit a message"""
    try:
        # Get the message
        message = get_object_or_404(Message, id=message_id, sender=request.user)
        
        # Parse the request body
        data = json.loads(request.body)
        new_content = data.get('content')
        
        if not new_content or not new_content.strip():
            return JsonResponse({'error': 'Content cannot be empty'}, status=400)
        
        # Update the message content
        message.content = new_content
        message.save()
        
        # Return updated message details
        return JsonResponse({
            'success': True,
            'message_id': message.id,
            'content': message.content,
            'timestamp': message.timestamp.strftime('%H:%M')
        })
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_POST
def delete_message(request, message_id):
    """API endpoint to delete (soft-delete) a message"""
    try:
        # Get the message
        message = get_object_or_404(Message, id=message_id, sender=request.user)
        
        # Mark as deleted
        message.is_deleted = True
        message.save()
        
        # Return success status
        return JsonResponse({
            'success': True,
            'message_id': message.id
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_POST
def remove_friend(request):
    """API endpoint for removing a user from friends"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        
        if not username:
            return JsonResponse({'error': 'Username is required'}, status=400)
        
        # Get the user to remove
        try:
            friend = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        
        # Find and delete the friendship
        friendship = Friendship.objects.filter(
            (Q(user1=request.user, user2=friend) | Q(user1=friend, user2=request.user)),
            status='accepted'
        ).first()
        
        if not friendship:
            return JsonResponse({'error': 'Friendship not found'}, status=404)
        
        friendship.delete()
        
        return JsonResponse({'success': True})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_POST
def upload_file(request):
    """Handle generic file/image uploads."""
    file = request.FILES.get('file')
    roomname = request.POST.get('roomname')
    if not file or not roomname:
        return JsonResponse({'error':'Missing parameters'}, status=400)
    # save under MEDIA_ROOT/attachments/
    path = default_storage.save(f'attachments/{file.name}', file)
    file_url = default_storage.url(path)
    return JsonResponse({
        'file_path': path,
        'file_url': file_url,
        'filename': file.name
    })
