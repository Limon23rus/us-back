import pool from '../config/database.js';

export class User {
  static async create({ username, email, passwordHash, avatarUrl = null }) {
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, avatar_url, status, created_at`,
      [username, email, passwordHash, avatarUrl]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, username, email, avatar_url, status, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(userId, status) {
    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status',
      [status, userId]
    );
    return result.rows[0];
  }

  static async updateAvatar(userId, avatarUrl) {
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, avatar_url',
      [avatarUrl, userId]
    );
    return result.rows[0];
  }

  static async searchUsers(query, excludeUserId) {
    const result = await pool.query(
      `SELECT id, username, email, avatar_url, status
       FROM users
       WHERE (username ILIKE $1 OR email ILIKE $1)
       AND id != $2
       LIMIT 20`,
      [`%${query}%`, excludeUserId]
    );
    return result.rows;
  }
}

