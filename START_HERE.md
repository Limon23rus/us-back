# 🚀 Быстрый старт - Деплой на ваш сервер

## Ваши данные сервера:
- **IP:** 141.105.67.237
- **Пользователь:** root
- **Пароль:** t6_G6UQNG9

---

## Шаг 1: Подключение к серверу

### Windows (PowerShell):
```powershell
ssh root@141.105.67.237
```
Введите пароль: `BZ9%Epyq03`

### Windows (PuTTY):
1. Скачайте: https://www.putty.org/
2. IP: `141.105.67.237`, Порт: `22`
3. Логин: `root`, Пароль: `t6_G6UQNG9`

---

## Шаг 2: Настройка сервера

После подключения выполните на сервере:

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 20.x (LTS - рекомендуется)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Установка PM2
npm install -g pm2

# Установка Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Настройка Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

---

## Шаг 3: Создание базы данных

```bash
sudo -u postgres psql
```

В PostgreSQL консоли выполните:

```sql
CREATE DATABASE messenger_db;
CREATE USER messenger_user WITH ENCRYPTED PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE messenger_db TO messenger_user;
ALTER USER messenger_user CREATEDB;
\q
```

**Запомните пароль!** Он понадобится для .env файла.

---

## Шаг 4: Загрузка проекта на сервер

### Вариант A: Через SCP (с вашего компьютера)

В PowerShell на вашем компьютере:

```powershell
# Перейдите в папку проекта
cd C:\Users\Limon\IdeaProjects\us

# Загрузите файлы на сервер
scp -r * root@141.105.67.237:/var/www/messenger-backend
```

### Вариант B: Через Git (если есть репозиторий)

На сервере:

```bash
mkdir -p /var/www
cd /var/www
git clone your-repo-url messenger-backend
cd messenger-backend
```

---

## Шаг 5: Настройка проекта на сервере

```bash
cd /var/www/messenger-backend

# Создайте .env файл
nano .env
```

Вставьте (замените пароль БД на тот, что создали):

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=messenger_db
DB_USER=messenger_user
DB_PASSWORD=secure_password_123

JWT_SECRET=change-this-to-very-long-random-string-min-32-chars
JWT_EXPIRES_IN=7d

UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

**Сохраните:** Ctrl+O, Enter, Ctrl+X

---

## Шаг 6: Установка и запуск

```bash
# Установка зависимостей
npm install --production

# Запуск миграций
npm run migrate

# Создание папок
mkdir -p logs uploads
chmod 755 uploads

# Запуск через PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## Шаг 7: Проверка работы

```bash
# Проверка статуса
pm2 status

# Проверка API
curl http://localhost:3000/api/health

# Просмотр логов
pm2 logs messenger-backend
```

---

## Шаг 8: Настройка Nginx (для доступа через IP или домен)

```bash
nano /etc/nginx/sites-available/messenger-backend
```

Вставьте:

```nginx
server {
    listen 80;
    server_name 141.105.67.237;

    client_max_body_size 10M;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    location /uploads {
        proxy_pass http://localhost:3000;
    }
}
```

Активируйте:

```bash
ln -s /etc/nginx/sites-available/messenger-backend /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## ✅ Готово!

Теперь ваш API доступен по адресу:
- **Локально на сервере:** http://localhost:3000
- **Извне:** http://141.105.67.237/api

### Проверка из браузера:
Откройте: `http://141.105.67.237/api/health`

Должен вернуться: `{"status":"ok","message":"Server is running"}`

---

## 📝 Полезные команды

```bash
# Перезапуск приложения
pm2 restart messenger-backend

# Просмотр логов
pm2 logs messenger-backend

# Статус
pm2 status

# Обновление проекта
cd /var/www/messenger-backend
git pull  # или загрузите новые файлы через SCP
npm install --production
npm run migrate  # если есть новые миграции
pm2 restart messenger-backend
```

---

## 🔒 Безопасность (рекомендуется)

1. **Измените пароль root:**
   ```bash
   passwd
   ```

2. **Создайте нового пользователя:**
   ```bash
   adduser deploy
   usermod -aG sudo deploy
   ```

3. **Настройте SSH ключи** вместо пароля

---

**Подробная инструкция:** [DEPLOY.md](./DEPLOY.md)

