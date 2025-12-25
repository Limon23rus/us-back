import pool from '../config/database.js';

export class Message {
  static async create({ chatId, senderId, content, messageType = 'text', fileUrl = null }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO messages (chat_id, sender_id, content, message_type, file_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [chatId, senderId, content, messageType, fileUrl]
      );

      // Обновляем время последнего обновления чата
      await client.query(
        'UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [chatId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getChatMessages(chatId, userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT m.*, 
              u.username as sender_username,
              u.avatar_url as sender_avatar
       FROM messages m
       INNER JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [chatId, limit, offset]
    );

    // Помечаем сообщения как прочитанные
    await pool.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE chat_id = $1 AND sender_id != $2 AND is_read = FALSE`,
      [chatId, userId]
    );

    return result.rows.reverse(); // Возвращаем в хронологическом порядке
  }

  static async markAsRead(messageId, userId) {
    const result = await pool.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE id = $1 AND sender_id != $2
       RETURNING *`,
      [messageId, userId]
    );
    return result.rows[0];
  }

  static async markChatAsRead(chatId, userId) {
    const result = await pool.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE chat_id = $1 AND sender_id != $2 AND is_read = FALSE
       RETURNING COUNT(*)`,
      [chatId, userId]
    );
    return result.rows[0];
  }

  static async findById(messageId) {
    const result = await pool.query(
      `SELECT m.*, 
              u.username as sender_username,
              u.avatar_url as sender_avatar
       FROM messages m
       INNER JOIN users u ON m.sender_id = u.id
       WHERE m.id = $1`,
      [messageId]
    );
    return result.rows[0];
  }
}

