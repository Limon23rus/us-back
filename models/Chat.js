import pool from '../config/database.js';

export class Chat {
  static async create({ name, type = 'private', createdBy }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const chatResult = await client.query(
        `INSERT INTO chats (name, type, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, type, createdBy]
      );

      const chat = chatResult.rows[0];

      // Добавляем создателя как участника
      await client.query(
        `INSERT INTO chat_participants (chat_id, user_id)
         VALUES ($1, $2)`,
        [chat.id, createdBy]
      );

      await client.query('COMMIT');
      return chat;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(chatId, userId) {
    const result = await pool.query(
      `SELECT c.*, 
              EXISTS(SELECT 1 FROM chat_participants WHERE chat_id = c.id AND user_id = $2) as is_participant
       FROM chats c
       WHERE c.id = $1`,
      [chatId, userId]
    );
    return result.rows[0];
  }

  static async getUserChats(userId) {
    const result = await pool.query(
      `SELECT c.*, 
              (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
              (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND is_read = FALSE AND sender_id != $1) as unread_count
       FROM chats c
       INNER JOIN chat_participants cp ON c.id = cp.chat_id
       WHERE cp.user_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );

    // Для каждого чата получаем участников
    const chatsWithParticipants = await Promise.all(
      result.rows.map(async (chat) => {
        const participants = await Chat.getParticipants(chat.id);
        return {
          ...chat,
          participants: participants
        };
      })
    );

    return chatsWithParticipants;
  }

  static async addParticipant(chatId, userId) {
    const result = await pool.query(
      `INSERT INTO chat_participants (chat_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (chat_id, user_id) DO NOTHING
       RETURNING *`,
      [chatId, userId]
    );
    return result.rows[0];
  }

  static async removeParticipant(chatId, userId) {
    const result = await pool.query(
      'DELETE FROM chat_participants WHERE chat_id = $1 AND user_id = $2 RETURNING *',
      [chatId, userId]
    );
    return result.rows[0];
  }

  static async getParticipants(chatId) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.avatar_url, u.status, cp.joined_at
       FROM chat_participants cp
       INNER JOIN users u ON cp.user_id = u.id
       WHERE cp.chat_id = $1`,
      [chatId]
    );
    return result.rows;
  }

  static async update(chatId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(chatId);
    const result = await pool.query(
      `UPDATE chats SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }
}

