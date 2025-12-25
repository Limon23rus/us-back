import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Загружаем переменные окружения
dotenv.config();

// Импорты роутов
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chats.js';
import messageRoutes, { setSocketIO } from './routes/messages.js';
import uploadRoutes from './routes/upload.js';

// Импорт middleware
import { authenticateToken } from './middleware/auth.js';

// Импорт Socket.io обработчиков
import { setupSocketIO } from './socket/socketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы для загрузок
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/chats', authenticateToken, chatRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Настройка Socket.io
setupSocketIO(io);

// Передаем Socket.io в роуты сообщений для отправки событий
setSocketIO(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
});

