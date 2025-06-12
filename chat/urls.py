from django.urls import path , include
from . import views 
urlpatterns = [
     path('chat/main/', views.chat, name='main_chat'),
     path('chat/message/<int:message_id>/edit/', views.edit_message, name='edit_message'),
     path('chat/message/<int:message_id>/delete/', views.delete_message, name='delete_message'),
     path('chat/profile/<str:username>/', views.get_profile, name='get_profile'),
     
     # Friend management endpoints
     path('chat/friends/', views.get_friends, name='get_friends'),
     path('chat/friend_requests/', views.get_friend_requests, name='get_friend_requests'),
     path('chat/send_friend_request/', views.send_friend_request, name='send_friend_request'),
     path('chat/accept_friend_request/', views.accept_friend_request, name='accept_friend_request'),
     path('chat/reject_friend_request/', views.reject_friend_request, name='reject_friend_request'),
     path('chat/cancel_friend_request/', views.cancel_friend_request, name='cancel_friend_request'),
     path('chat/remove_friend/', views.remove_friend, name='remove_friend'),
     path('chat/search_users/', views.search_users, name='search_users'),
     path('chat/friends_page/', views.friends_page, name='friends_page'),
     path('upload_file/', views.upload_file, name='upload_file'),

     # This should be last to avoid conflicts with other URL patterns
     path('chat/<str:room_name>/', views.chat_room, name='chat'),
]