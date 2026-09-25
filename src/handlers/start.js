const { getMainMenuKeyboard, getInGameStartKeyboard } = require('../keyboards');
const { saveUser } = require('../database');

async function handleStart(ctx, userSessions) {
  const userId = ctx.from.id;
  await saveUser(ctx.from);

  const session = userSessions.get(userId);

  if (session && session.inGame) {
    return ctx.reply(
      '⚠️ У тебя сейчас идет активная игра!\nХочешь начать заново или вернуться в меню?',
      getInGameStartKeyboard()
    );
  }

  const welcomeMessage = 
    `🌙 **TWILIGHT QUIZ**\n\n` +
    `Привет, ${ctx.from.first_name || 'фанат Twilight'}!\n` +
    `Проверь, насколько хорошо ты знаешь книгу «Сумерки»!\n\n` +
    `Выбери действие в меню ниже 👇`;

  await ctx.replyWithMarkdown(welcomeMessage, getMainMenuKeyboard());
}

async function handleRules(ctx) {
  const rulesMessage = 
    `🌙 **Правила Twilight Quiz**\n\n` +
    `• В одной игре 10 вопросов.\n` +
    `• У тебя есть ❤️❤️❤️ (3 жизни) на игру.\n` +
    `• При неправильном ответе теряется 1 жизнь.\n` +
    `• Если жизни закончатся, игра завершится досрочно!\n` +
    `• За каждый правильный ответ ты получаешь 10 ⭐.\n` +
    `• Вопросы выбираются случайно и не повторяются.\n` +
    `• Изменить ответ нельзя. Можно играть сколько угодно раз!`;

  await ctx.replyWithMarkdown(rulesMessage);
}

module.exports = {
  handleStart,
  handleRules
};