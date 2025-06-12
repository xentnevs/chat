from django.urls import path
from users.views import login_page, logout_page, signup_view, home

urlpatterns = [
    path('', login_page, name="login"),
    path('home/', home, name="home"),
    path('logout/', logout_page, name="logout"),
    path('signup/', signup_view, name="signup"),
]
