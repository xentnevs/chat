from django.urls import path, include
# ...existing imports...

urlpatterns = [
    # ...existing patterns...
+   path('chat/', include('chat.urls')),
]
