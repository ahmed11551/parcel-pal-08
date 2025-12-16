#!/bin/bash

echo "🚀 Настройка SendBuddy проекта..."

# Создание backend/.env
if [ ! -f "backend/.env" ]; then
    echo "📝 Создание backend/.env..."
    cat > backend/.env << 'EOF'
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=sendbuddy

# JWT
JWT_SECRET=sendbuddy-secret-key-change-in-production-min-32-characters-long
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# SMS Service (Twilio) - опционально для разработки
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Payment Systems - опционально для разработки
# YOOKASSA_SHOP_ID=your-yookassa-shop-id
# YOOKASSA_SECRET_KEY=your-yookassa-secret-key
# PAYMENT_RETURN_URL=http://localhost:5173/payment/success

# File Storage (S3 / Yandex Object Storage) - опционально для разработки
# S3_ACCESS_KEY_ID=your-s3-access-key
# S3_SECRET_ACCESS_KEY=your-s3-secret-key
# S3_REGION=ru-central1
# S3_ENDPOINT=https://storage.yandexcloud.net
# S3_BUCKET_NAME=sendbuddy-files
# S3_PUBLIC_URL=https://storage.yandexcloud.net/sendbuddy-files
EOF
    echo "✅ backend/.env создан"
else
    echo "ℹ️  backend/.env уже существует"
fi

# Создание .env для frontend
if [ ! -f ".env" ]; then
    echo "📝 Создание .env для frontend..."
    cat > .env << 'EOF'
VITE_API_URL=http://localhost:3001/api
EOF
    echo "✅ .env создан"
else
    echo "ℹ️  .env уже существует"
fi

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Установите зависимости:"
echo "   npm install"
echo "   cd backend && npm install && cd .."
echo ""
echo "2. Создайте базу данных PostgreSQL:"
echo "   createdb -U postgres sendbuddy"
echo "   или"
echo "   psql -U postgres -c 'CREATE DATABASE sendbuddy;'"
echo ""
echo "3. Запустите backend:"
echo "   cd backend && npm run start:dev"
echo ""
echo "4. В другом терминале запустите frontend:"
echo "   npm run dev"
echo ""
echo "📚 Документация:"
echo "   - QUICK_START.md - Быстрый старт"
echo "   - SETUP_GUIDE.md - Подробное руководство"

