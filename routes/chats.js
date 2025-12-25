import express from 'express';
import { body, validationResult } from 'express-validator';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';

const router = express.Router();

// Создать чат
router.post('/', [
  body('type').isIn(['private', 'group']).withMessage('Type must be private or group'),
  body('name').optional().trim().isLength({ max: 100 }),
  body('participantIds').isArray().withMessage('participantIds must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, name, participantIds } = req.body;
    const userId = req.user.userId;

    // Создаем чат
    const chat = await Chat.create({
      name: name || null,
      type,
      createdBy: userId,
    });

    // Добавляем участников
    const allParticipants = [...new Set([userId, ...participantIds])];
    for (const participantId of allParticipants) {
      if (participantId !== userId) {
        await Chat.addParticipant(chat.id, participantId);
      }
    }

    const participants = await Chat.getParticipants(chat.id);

    res.status(201).json({
      ...chat,
      participants,
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить все чаты пользователя
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.getUserChats(req.user.userId);
    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить чат по ID
router.get('/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id, req.user.userId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (!chat.is_participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const participants = await Chat.getParticipants(chat.id);
    res.json({
      ...chat,
      participants,
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Добавить участника в чат
router.post('/:id/participants', [
  body('userId').isInt().withMessage('userId must be an integer'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const chat = await Chat.findById(req.params.id, req.user.userId);
    if (!chat || !chat.is_participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const participant = await Chat.addParticipant(req.params.id, req.body.userId);
    if (!participant) {
      return res.status(400).json({ error: 'User is already a participant' });
    }

    res.status(201).json(participant);
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить участника из чата
router.delete('/:id/participants/:userId', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id, req.user.userId);
    if (!chat || !chat.is_participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const participant = await Chat.removeParticipant(req.params.id, req.params.userId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({ message: 'Participant removed' });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить чат
router.patch('/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id, req.user.userId);
    if (!chat || !chat.is_participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedChat = await Chat.update(req.params.id, req.body);
    if (!updatedChat) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    res.json(updatedChat);
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

