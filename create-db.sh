#!/bin/bash

# Скрипт для создания базы данных
# Запустите на сервере

echo "🗄️  Создание базы данных..."

# Запрашиваем данные
read -p "Имя базы данных [messenger_db]: " DB_NAME
DB_NAME=${DB_NAME:-messenger_db}

read -p "Имя пользователя БД [messenger_user]: " DB_USER
DB_USER=${DB_USER:-messenger_user}

read -sp "Пароль пользователя БД: " DB_PASSWORD
echo ""

# Создаем базу данных и пользователя
sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

echo ""
echo "✅ База данных создана!"
echo ""
echo "📝 Данные для .env файла:"
echo "DB_NAME=$DB_NAME"
echo "DB_USER=$DB_USER"
echo "DB_PASSWORD=$DB_PASSWORD"

