#!/bin/bash

# Скрипт оптимизации для серверов с 2GB RAM
# Использование: ./optimize-2gb-ram.sh

set -e

echo "🔧 Оптимизация сервера для 2GB RAM..."

# Создание swap файла (если еще нет)
if [ ! -f /swapfile ]; then
    echo "📦 Создание swap файла 2GB..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Добавление в fstab для постоянства
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    fi
    
    echo "✅ Swap файл создан"
else
    echo "ℹ️  Swap файл уже существует"
fi

# Настройка swappiness (приоритет использования swap)
echo "⚙️  Настройка swappiness..."
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo "vm.swappiness=10" | tee -a /etc/sysctl.conf
    sysctl vm.swappiness=10
    echo "✅ Swappiness настроен на 10"
else
    echo "ℹ️  Swappiness уже настроен"
fi

# Очистка неиспользуемых Docker ресурсов
echo "🧹 Очистка Docker..."
docker system prune -f

echo ""
echo "✅ Оптимизация завершена!"
echo ""
echo "📊 Текущее состояние:"
free -h
echo ""
echo "💡 Рекомендации:"
echo "   - Мониторьте использование: free -h"
echo "   - Проверяйте контейнеры: docker stats"
echo "   - При необходимости ограничьте ресурсы в docker-compose.yml"

