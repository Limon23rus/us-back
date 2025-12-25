#!/bin/bash

# Скрипт для первоначальной настройки VPS сервера
# Запустите на сервере после подключения через SSH

echo "🚀 Начало настройки сервера..."

# Обновление системы
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Установка необходимых пакетов
echo "📥 Установка базовых пакетов..."
apt install -y curl wget git build-essential

# Установка Node.js 20.x (LTS)
echo "📦 Установка Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка версий
echo "✅ Проверка установленных версий:"
node --version
npm --version

# Установка PostgreSQL
echo "🗄️  Установка PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Запуск PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Установка PM2
echo "⚙️  Установка PM2..."
npm install -g pm2

# Установка Nginx
echo "🌐 Установка Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Настройка Firewall
echo "🔥 Настройка Firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw --force enable

echo ""
echo "✅ Базовая настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Создайте базу данных: sudo -u postgres psql"
echo "2. Загрузите проект на сервер"
echo "3. Настройте .env файл"
echo "4. Запустите миграции и приложение"
echo ""
echo "📖 Подробная инструкция: см. DEPLOY.md"

