# 🐳 Полное руководство по Docker Compose деплою на Reg.ru Cloud

## 📋 Содержание

1. [Требования](#требования)
2. [Подготовка сервера](#подготовка-сервера)
3. [Настройка проекта](#настройка-проекта)
4. [Деплой](#деплой)
5. [Настройка Nginx и SSL](#настройка-nginx-и-ssl)
6. [Мониторинг и обслуживание](#мониторинг-и-обслуживание)
7. [Решение проблем](#решение-проблем)

## Требования

### Минимальные требования к серверу:
- **CPU**: 2 ядра
- **RAM**: 2GB (рекомендуется 4GB)
- **Диск**: 20GB SSD
- **ОС**: Ubuntu 20.04+ или Debian 11+

### Программное обеспечение:
- Docker 20.10+
- Docker Compose 2.0+
- Git

## Подготовка сервера

### 1. Подключение к серверу

```bash
ssh root@ваш-ip-адрес
# или
ssh ваш-пользователь@ваш-ip-адрес
```

### 2. Обновление системы

```bash
apt update && apt upgrade -y
```

### 3. Установка Docker

```bash
# Удаление старых версий (если есть)
apt remove docker docker-engine docker.io containerd runc -y

# Установка зависимостей
apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Добавление официального GPG ключа Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Настройка репозитория
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Проверка установки
docker --version
docker compose version
```

### 4. Установка Docker Compose (если не установлен через плагин)

```bash
# Скачивание последней версии
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Установка прав
chmod +x /usr/local/bin/docker-compose

# Проверка
docker-compose --version
```

### 5. Настройка firewall

```bash
# Установка UFW (если не установлен)
apt install ufw -y

# Разрешение портов
ufw allow 22/tcp    # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw allow 3000/tcp   # Frontend (временно, потом через Nginx)
ufw allow 3001/tcp   # Backend (временно, потом через Nginx)

# Включение firewall
ufw enable
ufw status
```

## Настройка проекта

### 1. Клонирование репозитория

```bash
# Установка Git (если нет)
apt install git -y

# Клонирование
git clone https://github.com/ваш-username/SendBuddynew.git
cd SendBuddynew

# Или если репозиторий приватный
git clone git@github.com:ваш-username/SendBuddynew.git
cd SendBuddynew
```

### 2. Создание файла переменных окружения

```bash
cp .env.production.example .env.production
nano .env.production
```

### 3. Заполнение переменных окружения

```env
# Database
DB_PASSWORD=сгенерируйте_надежный_пароль_минимум_16_символов

# JWT Secret (обязательно измените!)
JWT_SECRET=сгенерируйте_случайную_строку_минимум_32_символа
JWT_EXPIRES_IN=7d

# URLs
FRONTEND_URL=https://ваш-домен.ru
VITE_API_URL=https://ваш-домен.ru/api

# Upload settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

**Генерация безопасных паролей:**

```bash
# Генерация DB_PASSWORD
openssl rand -base64 24

# Генерация JWT_SECRET
openssl rand -hex 32
```

**Пример заполненного .env.production:**

```env
DB_PASSWORD=K8mN2pQ9rT5vW7xY3zA6bC1dE4fG8h
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://sendbuddy.ru
VITE_API_URL=https://sendbuddy.ru/api
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### 4. Проверка конфигурации

```bash
# Проверка синтаксиса docker-compose.yml
docker compose config

# Проверка что все файлы на месте
ls -la docker-compose.yml Dockerfile.frontend backend/Dockerfile
```

## Деплой

### Вариант 1: Автоматический деплой (рекомендуется)

```bash
# Сделать скрипт исполняемым
chmod +x deploy.sh

# Запустить деплой
./deploy.sh
```

Скрипт автоматически:
- Остановит существующие контейнеры
- Соберет новые образы
- Запустит все сервисы
- Проверит здоровье сервисов

### Вариант 2: Ручной деплой

```bash
# Остановка существующих контейнеров (если есть)
docker compose down

# Сборка образов
docker compose build --no-cache

# Запуск в фоновом режиме
docker compose up -d

# Просмотр логов
docker compose logs -f
```

### 5. Проверка работы

```bash
# Статус всех контейнеров
docker compose ps

# Проверка здоровья
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# Проверка backend
curl http://localhost:3001/api/health

# Проверка frontend
curl http://localhost:3000/health

# Просмотр логов
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

## Настройка Nginx и SSL

### 1. Установка Nginx

```bash
apt install nginx certbot python3-certbot-nginx -y
```

### 2. Создание конфигурации Nginx

```bash
nano /etc/nginx/sites-available/sendbuddy
```

Вставьте следующую конфигурацию:

```nginx
# HTTP -> HTTPS редирект
server {
    listen 80;
    listen [::]:80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    # Для Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Редирект на HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS сервер
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ваш-домен.ru www.ваш-домен.ru;

    # SSL сертификаты (будут установлены certbot)
    ssl_certificate /etc/letsencrypt/live/ваш-домен.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ваш-домен.ru/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Таймауты для загрузки файлов
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 10M;
    }

    # Загрузка файлов
    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Кэширование статических файлов
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Важно:** Замените `ваш-домен.ru` на ваш реальный домен!

### 3. Активация конфигурации

```bash
# Создание символической ссылки
ln -s /etc/nginx/sites-available/sendbuddy /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (опционально)
rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t

# Перезагрузка Nginx
systemctl reload nginx
```

### 4. Установка SSL сертификата

```bash
# Получение сертификата
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru

# Следуйте инструкциям:
# - Введите email
# - Согласитесь с условиями
# - Выберите редирект на HTTPS (2)

# Автоматическое обновление сертификата
certbot renew --dry-run
```

### 5. Обновление переменных окружения

После настройки домена обновите `.env.production`:

```bash
nano .env.production
```

Убедитесь что:
```env
FRONTEND_URL=https://ваш-домен.ru
VITE_API_URL=https://ваш-домен.ru/api
```

Перезапустите контейнеры:

```bash
docker compose down
docker compose up -d
```

## Мониторинг и обслуживание

### Просмотр логов

```bash
# Все логи
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Последние 100 строк
docker compose logs --tail=100 backend
```

### Статус контейнеров

```bash
# Список контейнеров
docker compose ps

# Детальная информация
docker compose ps -a

# Использование ресурсов
docker stats
```

### Резервное копирование базы данных

Создайте скрипт `/root/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Создание бэкапа
docker compose exec -T postgres pg_dump -U sendbuddy_user sendbuddy > $BACKUP_DIR/backup_$DATE.sql

# Сжатие
gzip $BACKUP_DIR/backup_$DATE.sql

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup created: backup_$DATE.sql.gz"
```

Сделайте исполняемым и добавьте в cron:

```bash
chmod +x /root/backup-db.sh

# Редактирование crontab
crontab -e

# Добавьте строку (бэкап каждый день в 2:00)
0 2 * * * /root/backup-db.sh >> /var/log/backup-db.log 2>&1
```

### Восстановление из бэкапа

```bash
# Распаковка
gunzip backup_20240101_020000.sql.gz

# Восстановление
docker compose exec -T postgres psql -U sendbuddy_user -d sendbuddy < backup_20240101_020000.sql
```

### Обновление приложения

```bash
cd /root/SendBuddynew

# Получение обновлений
git pull

# Пересборка и перезапуск
docker compose down
docker compose build --no-cache
docker compose up -d

# Проверка
docker compose ps
docker compose logs -f
```

### Очистка неиспользуемых ресурсов

```bash
# Удаление неиспользуемых образов
docker image prune -a

# Удаление неиспользуемых томов
docker volume prune

# Полная очистка (осторожно!)
docker system prune -a --volumes
```

## Решение проблем

### Backend не запускается

```bash
# Проверка логов
docker compose logs backend

# Проверка подключения к БД
docker compose exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(r => {
  console.log('DB connected:', r.rows[0]);
  process.exit(0);
}).catch(e => {
  console.error('DB error:', e.message);
  process.exit(1);
});
"

# Перезапуск
docker compose restart backend
```

### База данных не подключается

```bash
# Проверка статуса PostgreSQL
docker compose exec postgres pg_isready -U sendbuddy_user

# Проверка логов
docker compose logs postgres

# Подключение к БД
docker compose exec postgres psql -U sendbuddy_user -d sendbuddy

# В psql проверьте:
# \dt  - список таблиц
# \q   - выход
```

### Frontend не отображается

```bash
# Проверка логов
docker compose logs frontend

# Проверка что файлы собраны
docker compose exec frontend ls -la /usr/share/nginx/html

# Проверка Nginx конфигурации
docker compose exec frontend nginx -t

# Перезапуск
docker compose restart frontend
```

### Проблемы с загрузкой файлов

```bash
# Проверка прав на папку uploads
docker compose exec backend ls -la /app/uploads

# Создание папки если нет
docker compose exec backend mkdir -p /app/uploads
docker compose exec backend chmod 755 /app/uploads

# Проверка размера файлов
docker compose exec backend du -sh /app/uploads
```

### Проблемы с памятью

```bash
# Проверка использования памяти
free -h
docker stats

# Ограничение памяти для контейнеров (в docker-compose.yml)
# Добавьте в каждый service:
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

### Проблемы с сетью

```bash
# Проверка сети
docker network ls
docker network inspect sendbuddynew_sendbuddy-network

# Пересоздание сети
docker compose down
docker network prune
docker compose up -d
```

## Полезные команды

```bash
# Перезапуск всех сервисов
docker compose restart

# Остановка всех сервисов
docker compose down

# Остановка с удалением томов (ОСТОРОЖНО! Удалит данные БД)
docker compose down -v

# Просмотр использования ресурсов
docker stats

# Вход в контейнер
docker compose exec backend sh
docker compose exec postgres psql -U sendbuddy_user -d sendbuddy

# Просмотр переменных окружения
docker compose exec backend env
```

## Безопасность

### Рекомендации:

1. **Измените все пароли по умолчанию**
2. **Используйте сильные пароли** (минимум 16 символов)
3. **Регулярно обновляйте систему**: `apt update && apt upgrade`
4. **Настройте fail2ban** для защиты от брутфорса
5. **Используйте SSH ключи** вместо паролей
6. **Регулярно делайте бэкапы**
7. **Мониторьте логи** на подозрительную активность

## Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker compose logs -f`
2. Проверьте статус: `docker compose ps`
3. Проверьте документацию Docker: https://docs.docker.com/
4. Проверьте документацию Reg.ru: https://www.reg.ru/support/

