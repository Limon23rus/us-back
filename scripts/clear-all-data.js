import pool from '../config/database.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем переменные окружения
dotenv.config();

// Дополнительно читаем .env файл вручную
const envPath = path.join(__dirname, '..', '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const clearAllData = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Начало очистки данных...');
    
    await client.query('BEGIN');

    // Удаляем сообщения
    const messagesResult = await client.query('DELETE FROM messages');
    console.log(`✅ Удалено сообщений: ${messagesResult.rowCount}`);

    // Удаляем участников чатов
    const participantsResult = await client.query('DELETE FROM chat_participants');
    console.log(`✅ Удалено участников: ${participantsResult.rowCount}`);

    // Удаляем чаты
    const chatsResult = await client.query('DELETE FROM chats');
    console.log(`✅ Удалено чатов: ${chatsResult.rowCount}`);

    // Сброс счетчиков (опционально)
    await client.query('ALTER SEQUENCE chats_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE messages_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE chat_participants_id_seq RESTART WITH 1');
    console.log('✅ Счетчики сброшены');

    await client.query('COMMIT');
    console.log('✅ Все данные успешно удалены!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка при удалении данных:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

clearAllData()
  .then(() => {
    console.log('✅ Очистка завершена');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Очистка не удалась:', error);
    process.exit(1);
  });

