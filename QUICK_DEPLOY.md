# 🚀 Быстрое развертывание фронтенда на Timeweb Cloud

## Шаг 1: Подключитесь к серверу

```bash
ssh root@89.169.1.238
```

## Шаг 2: Запустите скрипт развертывания

```bash
cd /tmp
wget https://raw.githubusercontent.com/ahmed11551/parcel-pal-08/main/deploy-frontend-timeweb.sh
chmod +x deploy-frontend-timeweb.sh
./deploy-frontend-timeweb.sh
```

Или скопируйте скрипт вручную:

```bash
# На вашем локальном компьютере
scp deploy-frontend-timeweb.sh root@89.169.1.238:/tmp/

# На сервере
ssh root@89.169.1.238
chmod +x /tmp/deploy-frontend-timeweb.sh
/tmp/deploy-frontend-timeweb.sh
```

## Что делает скрипт:

1. ✅ Устанавливает Node.js 20 (если нужно)
2. ✅ Клонирует репозиторий в `/var/www/sendbuddy-frontend`
3. ✅ Устанавливает зависимости
4. ✅ Собирает проект (npm run build)
5. ✅ Настраивает Nginx
6. ✅ Устанавливает SSL сертификат (Let's Encrypt)
7. ✅ Перезагружает Nginx

## После развертывания:

1. Проверьте сайт: https://sendbuddy.ru
2. Проверьте API: https://sendbuddy.ru/api/docs
3. Проверьте без VPN - должно работать!

## Обновление фронтенда:

```bash
cd /var/www/sendbuddy-frontend
git pull origin main
npm install
npm run build
systemctl reload nginx
```

## Автоматическое обновление (cron):

```bash
crontab -e

# Добавьте строку (обновление каждый день в 3:00):
0 3 * * * cd /var/www/sendbuddy-frontend && git pull && npm install && npm run build && systemctl reload nginx >> /var/log/frontend-update.log 2>&1
```

## Проблемы?

Если что-то пошло не так:

1. Проверьте логи: `tail -f /var/log/nginx/error.log`
2. Проверьте статус Nginx: `systemctl status nginx`
3. Проверьте сборку: `cd /var/www/sendbuddy-frontend && npm run build`

