# chat

## Setup

```powershell
# Create virtual environment and activate
python -m venv env
.\env\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

## Database Migrations

```powershell
python manage.py makemigrations
python manage.py migrate
```

## Run Server

```powershell
python manage.py runserver
```
