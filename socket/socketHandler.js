import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { Chat } from '../models/Chat.js';

const connectedUsers = new Map(); // userId -> socketId

export const setupSocketIO = (io) => {
  // Middleware для аутентификации через Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const username = socket.user.username;

    console.log(`✅ User connected: ${username} (${userId})`);
    
    // Сохраняем подключение
    connectedUsers.set(userId, socket.id);
    
    // Обновляем статус пользователя
    await User.updateStatus(userId, 'online');

    // Уведомляем других пользователей о подключении
    socket.broadcast.emit('user:status', {
      userId,
      status: 'online',
    });

    // Присоединяемся к комнатам всех чатов пользователя
    const chats = await Chat.getUserChats(userId);
    chats.forEach(chat => {
      socket.join(`chat:${chat.id}`);
    });

    // Обработчик отправки сообщения через Socket.io удален
    // Сообщения теперь отправляются только через HTTP API (POST /api/messages)
    // Socket.io используется только для real-time уведомлений

    // Обработчик пометки сообщений как прочитанных
    socket.on('messages:read', async (data) => {
      try {
        const { chatId } = data;

        // Проверяем доступ к чату
        const chat = await Chat.findById(chatId, userId);
        if (!chat || !chat.is_participant) {
          socket.emit('error', { message: 'Access denied to this chat' });
          return;
        }

        await Message.markChatAsRead(chatId, userId);

        // Уведомляем других участников
        socket.to(`chat:${chatId}`).emit('messages:read', {
          chatId,
          userId,
        });
      } catch (error) {
        console.error('Mark messages as read error:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Обработчик печати (typing indicator)
    socket.on('typing:start', (data) => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('typing:start', {
        chatId,
        userId,
        username,
      });
    });

    socket.on('typing:stop', (data) => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('typing:stop', {
        chatId,
        userId,
      });
    });

    // Обработчик присоединения к чату
    socket.on('chat:join', async (data) => {
      try {
        const { chatId } = data;
        const chat = await Chat.findById(chatId, userId);
        
        if (chat && chat.is_participant) {
          socket.join(`chat:${chatId}`);
          socket.emit('chat:joined', { chatId });
        } else {
          socket.emit('error', { message: 'Access denied to this chat' });
        }
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Обработчик отключения
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${username} (${userId})`);
      
      connectedUsers.delete(userId);
      
      // Обновляем статус пользователя
      await User.updateStatus(userId, 'offline');

      // Уведомляем других пользователей об отключении
      socket.broadcast.emit('user:status', {
        userId,
        status: 'offline',
      });
    });
  });
};

