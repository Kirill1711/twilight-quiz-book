const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.BOT_TOKEN) {
  console.error('ОШИБКА: Токен бота BOT_TOKEN не задан в файле .env');
  process.exit(1);
}

module.exports = {
  botToken: process.env.BOT_TOKEN,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'twilight_quiz'
  },
  game: {
    questionsPerGame: 10,
    pointsPerCorrect: 10,
    maxLives: 3
  }
};