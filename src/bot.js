const { Telegraf } = require('telegraf');
const config = require('./config');
const { initDatabase, saveUser } = require('./database');
const { handleStart, handleRules } = require('./handlers/start');
const { handleStats } = require('./handlers/stats');
const { 
  showDifficultySelection, 
  handleDifficultySelect, 
  handleAnswer, 
  handleNextQuestion 
} = require('./handlers/quiz');
const { getMainMenuKeyboard } = require('./keyboards');

const bot = new Telegraf(config.botToken);

// Хранилище сессий в памяти
const userSessions = new Map();

// Инициализация БД
initDatabase();

// Мидлвар автосохранения
bot.use(async (ctx, next) => {
  if (ctx.from) {
    await saveUser(ctx.from);
  }
  return next();
});

// Команды и тексти
bot.start((ctx) => handleStart(ctx, userSessions));
bot.hears('🎮 Начать игру', (ctx) => showDifficultySelection(ctx, userSessions));
bot.hears('📊 Моя статистика', (ctx) => handleStats(ctx));
bot.hears('📖 Правила', (ctx) => handleRules(ctx));

// Callback handers
bot.action('diff_easy', (ctx) => handleDifficultySelect(ctx, 'easy', userSessions));
bot.action('diff_medium', (ctx) => handleDifficultySelect(ctx, 'medium', userSessions));
bot.action('diff_hard', (ctx) => handleDifficultySelect(ctx, 'hard', userSessions));

bot.action(/^answer_(\d+)$/, (ctx) => {
  const optionIndex = parseInt(ctx.match[1], 10);
  return handleAnswer(ctx, optionIndex, userSessions);
});

bot.action('next_question', (ctx) => handleNextQuestion(ctx, userSessions));
bot.action('play_again', (ctx) => showDifficultySelection(ctx, userSessions));
bot.action('show_stats', async (ctx) => {
  await ctx.answerCbQuery();
  return handleStats(ctx);
});

bot.action('main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  userSessions.delete(ctx.from.id);
  return ctx.reply('🏠 Главное меню:', getMainMenuKeyboard());
});

bot.action('restart_game', (ctx) => showDifficultySelection(ctx, userSessions));

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`Ошибка обработки для ${ctx.updateType}:`, err);
  ctx.reply('❌ Произошла ошибка. Попробуйте еще раз.').catch(() => {});
});

bot.launch().then(() => {
  console.log('🚀 Бот Twilight Quiz успешно запущен!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));