import os
import sys
import django

# Добавляем текущий каталог в путь поиска модулей Python
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_app.settings')
django.setup()

from django.contrib.auth.models import User
from chat.models import FriendRequest, Friendship
from django.db.models import Q

def create_test_users():
    # Создаем тестовых пользователей, если их нет
    usernames = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eva', 'Frank', 'Grace', 'Hank', 'Ivy', 'John']
    users = {}
    
    for username in usernames:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f'{username.lower()}@example.com',
                'first_name': username,
                'last_name': 'Test',
                'is_active': True
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"Создан пользователь: {username}")
        else:
            print(f"Пользователь {username} уже существует")
        
        users[username] = user
    
    return users

def create_test_friend_requests(users):
    # Создаем тестовые заявки в друзья
    # Alice отправила заявку Bob и Charlie
    FriendRequest.objects.get_or_create(
        sender=users['Alice'], 
        receiver=users['Bob'],
        defaults={'status': 'pending'}
    )
    
    FriendRequest.objects.get_or_create(
        sender=users['Alice'], 
        receiver=users['Charlie'],
        defaults={'status': 'pending'}
    )
    
    # Dave отправил заявку Alice
    FriendRequest.objects.get_or_create(
        sender=users['Dave'], 
        receiver=users['Alice'],
        defaults={'status': 'pending'}
    )
    
    # Frank отправил заявку Eve и Grace
    FriendRequest.objects.get_or_create(
        sender=users['Frank'], 
        receiver=users['Eva'],
        defaults={'status': 'pending'}
    )
    
    FriendRequest.objects.get_or_create(
        sender=users['Frank'], 
        receiver=users['Grace'],
        defaults={'status': 'pending'}
    )
    
    # Ivy отправила заявку Hank
    FriendRequest.objects.get_or_create(
        sender=users['Ivy'], 
        receiver=users['Hank'],
        defaults={'status': 'pending'}
    )
    
    # John отправил заявку Bob и Charlie
    FriendRequest.objects.get_or_create(
        sender=users['John'], 
        receiver=users['Bob'],
        defaults={'status': 'pending'}
    )
    
    FriendRequest.objects.get_or_create(
        sender=users['John'], 
        receiver=users['Charlie'],
        defaults={'status': 'pending'}
    )
    
    print("Тестовые заявки в друзья созданы")

def create_test_friendships(users):
    # Eva и Alice уже друзья
    if not Friendship.objects.filter(
        (Q(user1=users['Eva'], user2=users['Alice']) |
         Q(user1=users['Alice'], user2=users['Eva']))
    ).exists():
        Friendship.objects.create(
            user1=users['Eva'], 
            user2=users['Alice'],
            status='accepted'
        )
        print("Дружба между Eva и Alice создана")
    
    # Dave и Charlie уже друзья
    if not Friendship.objects.filter(
        (Q(user1=users['Dave'], user2=users['Charlie']) |
         Q(user1=users['Charlie'], user2=users['Dave']))
    ).exists():
        Friendship.objects.create(
            user1=users['Dave'], 
            user2=users['Charlie'],
            status='accepted'
        )
        print("Дружба между Dave и Charlie создана")
        
    # Frank и Hank уже друзья
    if not Friendship.objects.filter(
        (Q(user1=users['Frank'], user2=users['Hank']) |
         Q(user1=users['Hank'], user2=users['Frank']))
    ).exists():
        Friendship.objects.create(
            user1=users['Frank'], 
            user2=users['Hank'],
            status='accepted'
        )
        print("Дружба между Frank и Hank создана")
        
    # Grace и Ivy уже друзья
    if not Friendship.objects.filter(
        (Q(user1=users['Grace'], user2=users['Ivy']) |
         Q(user1=users['Ivy'], user2=users['Grace']))
    ).exists():
        Friendship.objects.create(
            user1=users['Grace'], 
            user2=users['Ivy'],
            status='accepted'
        )
        print("Дружба между Grace и Ivy создана")
        
    # John и Eva уже друзья
    if not Friendship.objects.filter(
        (Q(user1=users['John'], user2=users['Eva']) |
         Q(user1=users['Eva'], user2=users['John']))
    ).exists():
        Friendship.objects.create(
            user1=users['John'], 
            user2=users['Eva'],
            status='accepted'
        )
        print("Дружба между John и Eva создана")

if __name__ == "__main__":
    print("Начало инициализации тестовых данных...")
    users = create_test_users()
    create_test_friend_requests(users)
    create_test_friendships(users)
    print("Инициализация тестовых данных завершена")
