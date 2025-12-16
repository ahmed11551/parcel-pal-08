# Развертывание фронтенда на Timeweb Cloud

## Проблема
Сайт работает только с VPN, потому что Vercel может быть заблокирован в некоторых регионах.

## Решение
Развернуть фронтенд на том же сервере Timeweb Cloud, где уже работает бэкенд (89.169.1.238).

## Шаги развертывания

### 1. Подготовка на сервере

```bash
# Подключитесь к серверу
ssh root@89.169.1.238

# Создайте директорию для фронтенда
mkdir -p /var/www/sendbuddy-frontend
cd /var/www/sendbuddy-frontend

# Клонируйте репозиторий (или скопируйте файлы)
git clone https://github.com/ahmed11551/parcel-pal-08.git .
# Или используйте scp для копирования файлов
```

### 2. Установка зависимостей и сборка

```bash
cd /var/www/sendbuddy-frontend

# Установите Node.js 20 (если еще не установлен)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Установите зависимости
npm install

# Соберите проект
npm run build
```

### 3. Настройка Nginx

Создайте файл `/etc/nginx/sites-available/sendbuddy-frontend`:

```nginx
server {
    listen 80;
    server_name sendbuddy.ru www.sendbuddy.ru;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sendbuddy.ru www.sendbuddy.ru;

    # SSL сертификаты (используйте Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/sendbuddy.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sendbuddy.ru/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Корневая директория
    root /var/www/sendbuddy-frontend/dist;
    index index.html;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Проксирование API запросов к бэкенду
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Кэширование статических ресурсов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. Активация конфигурации Nginx

```bash
# Создайте символическую ссылку
ln -s /etc/nginx/sites-available/sendbuddy-frontend /etc/nginx/sites-enabled/

# Проверьте конфигурацию
nginx -t

# Перезагрузите Nginx
systemctl reload nginx
```

### 5. Установка SSL сертификата (Let's Encrypt)

```bash
# Установите certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Получите сертификат
certbot --nginx -d sendbuddy.ru -d www.sendbuddy.ru

# Автоматическое обновление
certbot renew --dry-run
```

### 6. Настройка автообновления

Создайте скрипт `/usr/local/bin/update-frontend.sh`:

```bash
#!/bin/bash
cd /var/www/sendbuddy-frontend
git pull origin main
npm install
npm run build
systemctl reload nginx
```

Сделайте его исполняемым:

```bash
chmod +x /usr/local/bin/update-frontend.sh
```

### 7. Настройка cron для автообновления (опционально)

```bash
# Добавьте в crontab
crontab -e

# Обновление каждый день в 3:00
0 3 * * * /usr/local/bin/update-frontend.sh >> /var/log/frontend-update.log 2>&1
```

## Альтернативный вариант: Docker

Если хотите использовать Docker:

```bash
# Соберите образ
docker build -t sendbuddy-frontend .

# Запустите контейнер
docker run -d \
  --name sendbuddy-frontend \
  --restart unless-stopped \
  -v /var/www/sendbuddy-frontend/dist:/usr/share/nginx/html \
  -p 80:80 \
  -p 443:443 \
  nginx:alpine
```

## Проверка

После развертывания проверьте:

1. Откройте `https://sendbuddy.ru` в браузере
2. Проверьте, что API запросы работают: `https://sendbuddy.ru/api/docs`
3. Проверьте мобильную версию

## Преимущества

- ✅ Нет зависимости от Vercel
- ✅ Все на одном сервере (меньше задержек)
- ✅ Полный контроль над конфигурацией
- ✅ Работает без VPN

