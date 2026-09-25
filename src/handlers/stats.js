const { getUserStats } = require('../database');

async function handleStats(ctx) {
  const userId = ctx.from.id;
  const stats = await getUserStats(userId);

  if (!stats || stats.gamesPlayed === 0) {
    return ctx.reply('📊 У тебя пока нет сыгранных игр. Нажми «🎮 Начать игру»!');
  }

  const diffMap = {
    easy: '🟢 Легко',
    medium: '🟡 Средне',
    hard: '🔴 Сложно'
  };

  let diffText = '';
  if (stats.byDifficulty && stats.byDifficulty.length > 0) {
    diffText = '\n\n**По уровням сложности:**\n' +
      stats.byDifficulty
        .map(d => `${diffMap[d.difficulty] || d.difficulty}: ${d.games} игр (верно: ${d.correct}/${d.total})`)
        .join('\n');
  }

  const message = 
    `📊 **ТВОЯ СТАТИСТИКА**\n\n` +
    `🎮 Игр сыграно: ${stats.gamesPlayed}\n` +
    `✅ Правильных ответов: ${stats.totalCorrect}\n` +
    `❌ Неправильных ответов: ${stats.totalWrong}\n` +
    `⭐ Лучший результат: ${stats.maxScore}/100\n` +
    `📈 Средний результат: ${stats.avgScore}%` +
    diffText;

  await ctx.replyWithMarkdown(message);
}

module.exports = {
  handleStats
};