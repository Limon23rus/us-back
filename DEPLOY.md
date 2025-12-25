# 🚀 Инструкция по деплою на VPS сервер

Это руководство поможет вам развернуть backend мессенджера на VPS сервере.

## 📋 Требования

- VPS сервер с Ubuntu 20.04+ или Debian 11+
- Доступ по SSH
- Домен (опционально, но рекомендуется)
- Минимум 1GB RAM, 10GB диска

## 🔧 Шаг 1: Подключение к серверу

### 1.1 Подключитесь к серверу

**Ваши данные для подключения:**
- IP: `141.105.67.237`
- Пользователь: `root`
- Пароль: `t6_G6UQNG9`

**Windows (PowerShell/CMD):**
```bash
ssh root@141.105.67.237
```

**Windows (PuTTY):**
1. Скачайте PuTTY: https://www.putty.org/
2. Введите IP: `141.105.67.237`
3. Порт: `22`
4. Тип: SSH
5. Логин: `root`, Пароль: `t6_G6UQNG9`

**Linux/Mac:**
```bash
ssh root@141.105.67.237
```

После подключения введите пароль: `t6_G6UQNG9`

### 1.2 Быстрая настройка сервера

После подключения выполните на сервере:

```bash
# Загрузите скрипт настройки (или скопируйте содержимое setup-server.sh)
chmod +x setup-server.sh
./setup-server.sh
```

Или выполните команды вручную (см. ниже).

### 1.3 Обновите систему

```bash
apt update && apt upgrade -y
```

### 1.4 Установите Node.js

```bash
# Установка Node.js 20.x (LTS - рекомендуется)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка версии
node --version
npm --version
```

### 1.5 Установите PostgreSQL

```bash
apt install -y postgresql postgresql-contrib

# Запустите PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Создайте базу данных и пользователя
# Вариант 1: Используйте скрипт
chmod +x create-db.sh
./create-db.sh

# Вариант 2: Вручную
sudo -u postgres psql
```

В PostgreSQL консоли (если делаете вручную):

```sql
CREATE DATABASE messenger_db;
CREATE USER messenger_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE messenger_db TO messenger_user;
ALTER USER messenger_user CREATEDB;
\q
```

### 1.6 Установите PM2

```bash
npm install -g pm2
```

### 1.7 Установите Nginx (опционально, но рекомендуется)

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

## 📦 Шаг 2: Загрузка проекта на сервер

### Вариант 1: Через Git (рекомендуется)

```bash
# Создайте директорию для проекта
mkdir -p /var/www/messenger-backend
cd /var/www/messenger-backend

# Клонируйте репозиторий
git clone https://your-repo-url.git .

# Или если репозиторий приватный, используйте SSH ключ
```

### Вариант 2: Через SCP

На вашем локальном компьютере:

```bash
scp -r . root@your-server-ip:/var/www/messenger-backend
```

## ⚙️ Шаг 3: Настройка проекта

### 3.1 Создайте файл .env

```bash
cd /var/www/messenger-backend
nano .env
```

Добавьте следующие переменные:

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=messenger_db
DB_USER=messenger_user
DB_PASSWORD=your_secure_password

JWT_SECRET=your-very-long-and-random-secret-key-change-this
JWT_EXPIRES_IN=7d

UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

**⚠️ ВАЖНО:** Измените `JWT_SECRET` на длинный случайный ключ!

### 3.2 Установите зависимости

```bash
npm install --production
```

### 3.3 Запустите миграции

```bash
npm run migrate
```

### 3.4 Создайте необходимые директории

```bash
mkdir -p logs uploads
chmod 755 uploads
```

## 🚀 Шаг 4: Запуск приложения

### 4.1 Запуск через PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4.2 Полезные команды PM2

```bash
# Статус приложения
pm2 status

# Логи
pm2 logs messenger-backend

# Перезапуск
pm2 restart messenger-backend

# Остановка
pm2 stop messenger-backend

# Мониторинг
pm2 monit
```

## 🌐 Шаг 5: Настройка Nginx (Reverse Proxy)

### 5.1 Создайте конфигурацию Nginx

```bash
nano /etc/nginx/sites-available/messenger-backend
```

Скопируйте содержимое из `nginx.conf.example` и измените:
- `your-domain.com` на ваш домен
- Настройки SSL (если есть)

### 5.2 Активируйте конфигурацию

```bash
ln -s /etc/nginx/sites-available/messenger-backend /etc/nginx/sites-enabled/
nginx -t  # Проверка конфигурации
systemctl reload nginx
```

### 5.3 Настройка SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot автоматически настроит SSL и обновит конфигурацию Nginx.

## 🔒 Шаг 6: Настройка безопасности

### 6.1 Настройка Firewall (UFW)

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 6.2 Настройка PostgreSQL

Отредактируйте `/etc/postgresql/*/main/pg_hba.conf`:

```
# Разрешить только локальные подключения
host    all             all             127.0.0.1/32            md5
```

Перезапустите PostgreSQL:

```bash
systemctl restart postgresql
```

## 📝 Шаг 7: Обновление приложения

Используйте скрипт деплоя:

```bash
cd /var/www/messenger-backend
chmod +x deploy.sh
./deploy.sh
```

Или вручную:

```bash
# Остановка
pm2 stop messenger-backend

# Обновление кода (если через git)
git pull origin main

# Установка зависимостей
npm install --production

# Миграции (если есть новые)
npm run migrate

# Запуск
pm2 start ecosystem.config.js --env production
```

## 🧪 Шаг 8: Проверка работы

### Проверка API

```bash
curl http://localhost:3000/api/health
```

Или через домен:

```bash
curl https://your-domain.com/api/health
```

### Проверка логов

```bash
pm2 logs messenger-backend
tail -f /var/log/nginx/messenger-backend-error.log
```

## 🔧 Дополнительные настройки

### Автоматический бэкап базы данных

Создайте скрипт `/root/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U messenger_user messenger_db > $BACKUP_DIR/messenger_db_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete  # Удалить старые бэкапы
```

Добавьте в crontab:

```bash
crontab -e
# Добавьте строку:
0 2 * * * /root/backup-db.sh
```

### Мониторинг

Установите PM2 Plus для мониторинга:

```bash
pm2 link <secret_key> <public_key>
```

## ❗ Решение проблем

### Приложение не запускается

```bash
# Проверьте логи
pm2 logs messenger-backend

# Проверьте переменные окружения
cat .env

# Проверьте подключение к БД
psql -U messenger_user -d messenger_db -h localhost
```

### Ошибки подключения к БД

```bash
# Проверьте статус PostgreSQL
systemctl status postgresql

# Проверьте права пользователя
sudo -u postgres psql -c "\du"
```

### Nginx не работает

```bash
# Проверьте конфигурацию
nginx -t

# Проверьте логи
tail -f /var/log/nginx/error.log
```

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи PM2: `pm2 logs`
2. Проверьте логи Nginx: `/var/log/nginx/error.log`
3. Проверьте статус сервисов: `systemctl status nginx postgresql`

---

**Готово!** Ваш backend теперь работает на VPS сервере! 🎉

