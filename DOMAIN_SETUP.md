# 🌐 Настройка домена send-buddy.ru

## ✅ Текущая конфигурация

- **Домен**: send-buddy.ru
- **Публичный IP сервера**: 194.67.124.90 (плавающий IP)
- **Приватный IP**: 192.168.0.228 (внутренняя сеть)
- **DNS записи**: 
  - `@` (send-buddy.ru) → 194.67.124.90 ✅ (нужно обновить!)
  - `www` (www.send-buddy.ru) → 194.67.124.90 ✅ (нужно обновить!)
- **DNS серверы**: ns1.reg.ru, ns2.reg.ru

⚠️ **Важно:** Обновите A-записи в DNS на новый IP: **194.67.124.90**

## 📋 Что нужно сделать

### 1. Обновите переменные окружения

На сервере в файле `.env.production`:

```env
FRONTEND_URL=https://send-buddy.ru
VITE_API_URL=https://send-buddy.ru/api
```

**Важно:** Используйте `https://` (не `http://`) - после установки SSL.

### 2. Перезапустите контейнеры

```bash
cd /root/SendBuddynew
docker compose down
docker compose up -d
```

### 3. Установите Nginx

```bash
apt install nginx -y
```

### 4. Создайте конфигурацию Nginx

```bash
nano /etc/nginx/sites-available/send-buddy
```

Вставьте следующую конфигурацию:

```nginx
# HTTP -> HTTPS редирект
server {
    listen 80;
    listen [::]:80;
    server_name send-buddy.ru www.send-buddy.ru;

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
    server_name send-buddy.ru www.send-buddy.ru;

    # SSL сертификаты (будут установлены certbot)
    ssl_certificate /etc/letsencrypt/live/send-buddy.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/send-buddy.ru/privkey.pem;
    
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

### 5. Активируйте конфигурацию

```bash
ln -s /etc/nginx/sites-available/send-buddy /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Удалите дефолтную конфигурацию
nginx -t  # Проверка конфигурации
systemctl reload nginx
```

### 6. Установите SSL сертификат

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d send-buddy.ru -d www.send-buddy.ru
```

Следуйте инструкциям:
- Введите email
- Согласитесь с условиями
- Выберите редирект на HTTPS (вариант 2)

### 7. Проверьте работу

```bash
# Проверка HTTP редиректа
curl -I http://send-buddy.ru

# Проверка HTTPS
curl -I https://send-buddy.ru

# Проверка API
curl https://send-buddy.ru/api/health
```

## ✅ Готово!

Ваш сайт должен быть доступен по адресам:
- https://send-buddy.ru
- https://www.send-buddy.ru

## 🔄 Обновление переменных окружения

После установки SSL обновите `.env.production`:

```bash
nano .env.production
```

Измените:
```env
FRONTEND_URL=https://send-buddy.ru
VITE_API_URL=https://send-buddy.ru/api
```

Перезапустите контейнеры:
```bash
docker compose down
docker compose up -d
```

## 🔍 Проверка DNS

Убедитесь, что DNS записи распространились:

```bash
# Проверка A-записи
dig send-buddy.ru +short
# Должен вернуть: 95.163.244.138

# Проверка www
dig www.send-buddy.ru +short
# Должен вернуть: 194.67.124.90
```

Если не работает, подождите 5-30 минут для распространения DNS.

## ⚠️ Важно

1. **DNS должен указывать на правильный IP**: 194.67.124.90 (обновите A-записи!)
2. **Порты 80 и 443 должны быть открыты** в firewall
3. **Nginx должен быть запущен** перед установкой SSL
4. **Контейнеры должны работать** на localhost:3000 и localhost:3001
5. **Порты 25 и 465 заблокированы** - это нормально, они не нужны для SendBuddy

## 🐛 Решение проблем

### DNS не работает

```bash
# Проверьте DNS записи
nslookup send-buddy.ru
nslookup www.send-buddy.ru

# Если не работает, подождите 30 минут
```

### SSL не устанавливается

```bash
# Проверьте, что порт 80 открыт
ufw status

# Проверьте логи
tail -f /var/log/nginx/error.log
```

### Сайт не открывается

```bash
# Проверьте статус Nginx
systemctl status nginx

# Проверьте конфигурацию
nginx -t

# Проверьте логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

