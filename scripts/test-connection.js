import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || 5432}`);
  console.log(`  Database: ${process.env.DB_NAME || 'messenger_db'}`);
  console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : 'NOT SET'}`);
  console.log('');

  // Сначала пробуем подключиться к базе postgres (системная база)
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Подключаемся к системной базе
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL server');

    // Проверяем, существует ли база данных messenger_db
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'messenger_db']
    );

    if (dbCheck.rows.length === 0) {
      console.log(`⚠️  Database '${process.env.DB_NAME || 'messenger_db'}' does not exist`);
      console.log('Creating database...');
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'messenger_db'}`);
      console.log('✅ Database created successfully');
    } else {
      console.log(`✅ Database '${process.env.DB_NAME || 'messenger_db'}' exists`);
    }

    await client.end();
    console.log('\n✅ Connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    
    if (error.code === '28P01') {
      console.error('\n💡 Tip: Check your password in .env file');
      console.error('   Make sure DB_PASSWORD matches your PostgreSQL password');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: PostgreSQL server might not be running');
      console.error('   Check if PostgreSQL service is started');
    }
    
    process.exit(1);
  }
}

testConnection();

