#!/bin/bash

# Скрипт для деплоя на VPS сервер
# Использование: ./deploy.sh

echo "🚀 Starting deployment..."

# Остановка приложения
echo "⏸️  Stopping application..."
pm2 stop messenger-backend || true
pm2 delete messenger-backend || true

# Обновление кода (если используете git)
# echo "📥 Pulling latest changes..."
# git pull origin main

# Установка зависимостей
echo "📦 Installing dependencies..."
npm install --production

# Запуск миграций
echo "🗄️  Running migrations..."
npm run migrate

# Создание папки для логов
echo "📁 Creating logs directory..."
mkdir -p logs
mkdir -p uploads

# Запуск приложения
echo "▶️  Starting application..."
pm2 start ecosystem.config.js --env production

# Сохранение конфигурации PM2
pm2 save

echo "✅ Deployment completed!"
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs messenger-backend"

