const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Таблица пользователей
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        username VARCHAR(255) NULL,
        first_name VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Таблица результатов игр
    await connection.query(`
      CREATE TABLE IF NOT EXISTS game_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        total_questions INT NOT NULL,
        correct_answers INT NOT NULL,
        score INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    connection.release();
    console.log('✅ База данных MySQL успешно инициализирована');
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error.message);
  }
}

async function saveUser(user) {
  try {
    const query = `
      INSERT INTO users (id, username, first_name)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        first_name = VALUES(first_name);
    `;
    await pool.execute(query, [user.id, user.username || null, user.first_name || null]);
  } catch (error) {
    console.error('Ошибка сохранения пользователя:', error.message);
  }
}

async function saveGameResult(userId, difficulty, totalQuestions, correctAnswers, score) {
  try {
    const query = `
      INSERT INTO game_results (user_id, difficulty, total_questions, correct_answers, score)
      VALUES (?, ?, ?, ?, ?);
    `;
    await pool.execute(query, [userId, difficulty, totalQuestions, correctAnswers, score]);
  } catch (error) {
    console.error('Ошибка сохранения результата игры:', error.message);
  }
}

async function getUserStats(userId) {
  try {
    const [totalGamesRows] = await pool.execute(
      'SELECT COUNT(*) as gamesPlayed FROM game_results WHERE user_id = ?',
      [userId]
    );

    const [sumStatsRows] = await pool.execute(
      `SELECT 
        COALESCE(SUM(correct_answers), 0) as totalCorrect,
        COALESCE(SUM(total_questions - correct_answers), 0) as totalWrong,
        COALESCE(MAX(score), 0) as maxScore,
        COALESCE(AVG(score), 0) as avgScore
       FROM game_results WHERE user_id = ?`,
      [userId]
    );

    const [byDifficultyRows] = await pool.execute(
      `SELECT 
        difficulty,
        COUNT(*) as games,
        COALESCE(SUM(correct_answers), 0) as correct,
        COALESCE(SUM(total_questions), 0) as total
       FROM game_results 
       WHERE user_id = ? 
       GROUP BY difficulty`,
      [userId]
    );

    return {
      gamesPlayed: totalGamesRows[0].gamesPlayed,
      totalCorrect: Number(sumStatsRows[0].totalCorrect),
      totalWrong: Number(sumStatsRows[0].totalWrong),
      maxScore: Number(sumStatsRows[0].maxScore),
      avgScore: Math.round(Number(sumStatsRows[0].avgScore)),
      byDifficulty: byDifficultyRows
    };
  } catch (error) {
    console.error('Ошибка получения статистики:', error.message);
    return null;
  }
}

module.exports = {
  pool,
  initDatabase,
  saveUser,
  saveGameResult,
  getUserStats
};