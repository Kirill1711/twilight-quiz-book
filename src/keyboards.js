const { Markup } = require('telegraf');

function getMainMenuKeyboard() {
  return Markup.keyboard([
    ['🎮 Начать игру'],
    ['📊 Моя статистика', '📖 Правила']
  ]).resize();
}

function getDifficultyKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🟢 Легко', 'diff_easy')],
    [Markup.button.callback('🟡 Средне', 'diff_medium')],
    [Markup.button.callback('🔴 Сложно', 'diff_hard')]
  ]);
}

function getQuestionKeyboard(options) {
  const buttons = options.map((optionText, index) => {
    return [Markup.button.callback(optionText, `answer_${index}`)];
  });
  return Markup.inlineKeyboard(buttons);
}

function getNextQuestionKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➡️ Следующий вопрос', 'next_question')]
  ]);
}

function getGameOverKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Играть ещё раз', 'play_again')],
    [Markup.button.callback('📊 Моя статистика', 'show_stats')],
    [Markup.button.callback('🏠 Главное меню', 'main_menu')]
  ]);
}

function getInGameStartKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Начать новую игру', 'restart_game')],
    [Markup.button.callback('🏠 Вернуться в меню', 'main_menu')]
  ]);
}

module.exports = {
  getMainMenuKeyboard,
  getDifficultyKeyboard,
  getQuestionKeyboard,
  getNextQuestionKeyboard,
  getGameOverKeyboard,
  getInGameStartKeyboard
};