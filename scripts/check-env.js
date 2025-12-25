import dotenv from 'dotenv';

dotenv.config();

console.log('📋 Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? `${process.env.DB_PASSWORD.substring(0, 3)}***` : 'NOT SET');
console.log('');

if (!process.env.DB_PASSWORD) {
  console.log('❌ DB_PASSWORD is not set in .env file!');
  console.log('💡 Make sure .env file exists in the project root');
  console.log('💡 Format should be: DB_PASSWORD=your_password');
} else {
  console.log('✅ DB_PASSWORD is set');
}

