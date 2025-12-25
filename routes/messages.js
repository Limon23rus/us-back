import express from 'express';
import { body, validationResult } from 'express-validator';
import { Message } from '../models/Message.js';
import { Chat } from '../models/Chat.js';

const router = express.Router();

// Храним ссылку на Socket.io для отправки событий
let ioInstance = null;

export const setSocketIO = (io) => {
  ioInstance = io;
};

// Получить сообщения чата
router.get('/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 1000, offset = 0 } = req.query;

    // Проверяем доступ к чату
    const chat = await Chat.findById(chatId, req.user.userId);
    if (!chat || !chat.is_participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.getChatMessages(
      chatId,
      req.user.userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создать сообщение
router.post('/', [
  body('chatId').isInt().withMessage('chatId must be an integer'),
  body('content').optional().trim(),
  body('messageType').optional().isIn(['text', 'image', 'file']),
  body('fileUrl').optional().isURL(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId, content, messageType = 'text', fileUrl } = req.body;

    // Проверяем доступ к чату
    const chat = await Chat.findById(chatId, req.user.userId);
    if (!chat || !chat.is_participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!content && !fileUrl) {
      return res.status(400).json({ error: 'Content or fileUrl is required' });
    }

    const message = await Message.create({
      chatId,
      senderId: req.user.userId,
      content: content || null,
      messageType,
      fileUrl: fileUrl || null,
    });

    // Получаем полную информацию о сообщении
    const fullMessage = await Message.findById(message.id);

    // Отправляем сообщение через Socket.io для real-time уведомлений
    if (ioInstance) {
      // Отправляем всем участникам чата
      ioInstance.to(`chat:${chatId}`).emit('message:new', fullMessage);
      
      // Обновляем список чатов для всех участников
      const participants = await Chat.getParticipants(chatId);
      const room = ioInstance.sockets.adapter.rooms.get(`chat:${chatId}`);
      if (room) {
        room.forEach((socketId) => {
          ioInstance.to(socketId).emit('chat:updated', {
            chatId,
            lastMessage: fullMessage,
          });
        });
      }
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Пометить сообщения как прочитанные
router.post('/chat/:chatId/read', async (req, res) => {
  try {
    const { chatId } = req.params;

    // Проверяем доступ к чату
    const chat = await Chat.findById(chatId, req.user.userId);
    if (!chat || !chat.is_participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Message.markChatAsRead(chatId, req.user.userId);
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить сообщение по ID
router.get('/:id', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Проверяем доступ к чату
    const chat = await Chat.findById(message.chat_id, req.user.userId);
    if (!chat || !chat.is_participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(message);
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

