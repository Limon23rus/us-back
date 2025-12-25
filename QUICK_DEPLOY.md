# ⚡ Быстрый деплой на VPS

## Минимальные шаги для запуска

### 1. На сервере установите необходимое ПО

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql

# PM2
npm install -g pm2

# Nginx (опционально)
apt install -y nginx
```

### 2. Создайте базу данных

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE messenger_db;
CREATE USER messenger_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE messenger_db TO messenger_user;
\q
```

### 3. Загрузите проект на сервер

```bash
# Через Git
cd /var/www
git clone your-repo-url messenger-backend
cd messenger-backend

# Или через SCP (с локального компьютера)
scp -r . root@your-server:/var/www/messenger-backend
```

### 4. Настройте .env

```bash
nano .env
```

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=messenger_db
DB_USER=messenger_user
DB_PASSWORD=your_password
JWT_SECRET=your-very-long-random-secret-key
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

### 5. Установите зависимости и запустите

```bash
npm install --production
npm run migrate
mkdir -p logs uploads
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 6. Настройте Nginx (если нужен домен)

```bash
# Скопируйте конфигурацию
cp nginx.conf.example /etc/nginx/sites-available/messenger-backend
nano /etc/nginx/sites-available/messenger-backend  # Измените домен

# Активируйте
ln -s /etc/nginx/sites-available/messenger-backend /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL (Let's Encrypt)
certbot --nginx -d your-domain.com
```

### 7. Проверьте работу

```bash
# Локально на сервере
curl http://localhost:3000/api/health

# Или через домен
curl https://your-domain.com/api/health
```

## Полезные команды

```bash
# PM2
pm2 status
pm2 logs messenger-backend
pm2 restart messenger-backend

# Обновление
cd /var/www/messenger-backend
git pull
npm install --production
npm run migrate
pm2 restart messenger-backend
```

## 🔒 Безопасность

```bash
# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# PostgreSQL - только локальные подключения
# Отредактируйте /etc/postgresql/*/main/pg_hba.conf
```

---

**Подробная инструкция:** [DEPLOY.md](./DEPLOY.md)

