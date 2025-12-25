import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function testSimpleConnection() {
  console.log('🔍 Testing simple PostgreSQL connection to "postgres" database...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Системная база данных
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Проверяем версию
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version.split(',')[0]);
    
    // Проверяем существование базы messenger_db
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'messenger_db']
    );

    if (dbCheck.rows.length === 0) {
      console.log(`\n⚠️  Database '${process.env.DB_NAME || 'messenger_db'}' does not exist`);
      console.log('Creating database...');
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'messenger_db'}`);
      console.log('✅ Database created successfully!');
    } else {
      console.log(`✅ Database '${process.env.DB_NAME || 'messenger_db'}' already exists`);
    }

    await client.end();
    console.log('\n✅ All checks passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    
    if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Possible issues:');
      console.error('   1. Password in .env file is incorrect');
      console.error('   2. Username in .env file is incorrect (should be "postgres" or your PostgreSQL username)');
      console.error('   3. Check your .env file format: DB_PASSWORD=your_password (no spaces around =)');
    }
    
    return false;
  }
}

testSimpleConnection().then(success => {
  process.exit(success ? 0 : 1);
});

