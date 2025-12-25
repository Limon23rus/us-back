import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаем .env файл вручную
const envPath = path.join(__dirname, '..', '.env');
let envVars = {};

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
  console.log('📄 Read .env file from:', envPath);
} else {
  console.log('⚠️  .env file not found at:', envPath);
}

const config = {
  host: envVars.DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(envVars.DB_PORT || process.env.DB_PORT || '5432'),
  database: 'postgres', // Подключаемся к системной базе
  user: envVars.DB_USER || process.env.DB_USER || 'postgres',
  password: envVars.DB_PASSWORD || process.env.DB_PASSWORD,
};

console.log('\n🔍 Connection configuration:');
console.log('  Host:', config.host);
console.log('  Port:', config.port);
console.log('  Database:', config.database);
console.log('  User:', config.user);
console.log('  Password:', config.password ? `${config.password.substring(0, 3)}*** (length: ${config.password.length})` : 'NOT SET');
console.log('');

if (!config.password) {
  console.error('❌ Password is not set!');
  process.exit(1);
}

const { Client } = pg;
const client = new Client(config);

async function test() {
  try {
    console.log('🔄 Attempting to connect...');
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL:', versionResult.rows[0].version.split(',')[0]);
    
    // Проверяем базу данных
    const dbName = envVars.DB_NAME || process.env.DB_NAME || 'messenger_db';
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`\n📦 Creating database '${dbName}'...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Database created!');
    } else {
      console.log(`✅ Database '${dbName}' exists`);
    }

    await client.end();
    console.log('\n✅ All tests passed! Ready to run migrations.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === '28P01') {
      console.error('\n💡 Authentication error. Please verify:');
      console.error('   1. Password in .env matches PostgreSQL password');
      console.error('   2. Username is correct (usually "postgres")');
      console.error('   3. .env file format: DB_PASSWORD=password (no quotes, no spaces)');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Please check:');
      console.error('   1. PostgreSQL service is running');
      console.error('   2. Port 5432 is correct');
    }
    
    process.exit(1);
  }
}

test();

