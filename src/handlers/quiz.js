const { getRandomQuestions } = require('../questions');
const { 
  getDifficultyKeyboard, 
  getQuestionKeyboard, 
  getNextQuestionKeyboard, 
  getGameOverKeyboard 
} = require('../keyboards');
const { saveGameResult } = require('../database');
const config = require('../config');

// Вспомогательная функция для отображения жизней эмодзи
function getLivesText(lives) {
  const max = config.game.maxLives;
  let result = '';
  for (let i = 0; i < max; i++) {
    if (i < lives) {
      result += '❤️';
    } else {
      result += '🖤';
    }
  }
  return result;
}

function startNewGameSession(userId, userSessions) {
  userSessions.set(userId, {
    inGame: false,
    difficulty: null,
    questions: [],
    currentIndex: 0,
    correctCount: 0,
    score: 0,
    lives: config.game.maxLives,
    answeredCurrent: false
  });
}

async function showDifficultySelection(ctx, userSessions) {
  const userId = ctx.from.id;
  startNewGameSession(userId, userSessions);

  await ctx.reply('Выбери сложность:', getDifficultyKeyboard());
}

async function handleDifficultySelect(ctx, difficulty, userSessions) {
  const userId = ctx.from.id;
  const session = userSessions.get(userId) || {};

  const selectedQuestions = getRandomQuestions(difficulty, config.game.questionsPerGame);

  if (!selectedQuestions || selectedQuestions.length === 0) {
    await ctx.answerCbQuery('Для этой сложности пока нет вопросов.');
    return;
  }

  session.inGame = true;
  session.difficulty = difficulty;
  session.questions = selectedQuestions;
  session.currentIndex = 0;
  session.correctCount = 0;
  session.score = 0;
  session.lives = config.game.maxLives;
  session.answeredCurrent = false;

  userSessions.set(userId, session);

  await ctx.answerCbQuery();
  await sendQuestion(ctx, session);
}

async function sendQuestion(ctx, session) {
  const q = session.questions[session.currentIndex];
  const total = session.questions.length;
  const currentNum = session.currentIndex + 1;

  session.answeredCurrent = false;

  const livesStr = getLivesText(session.lives);
  const text = `🌙 **Вопрос ${currentNum}/${total}** | Жизни: ${livesStr}\n\n${q.question}`;
  await ctx.replyWithMarkdown(text, getQuestionKeyboard(q.options));
}

async function handleAnswer(ctx, selectedOption, userSessions) {
  const userId = ctx.from.id;
  const session = userSessions.get(userId);

  if (!session || !session.inGame) {
    await ctx.answerCbQuery('Игра не найдена или уже завершена.');
    return;
  }

  if (session.answeredCurrent) {
    await ctx.answerCbQuery('Вы уже ответили на этот вопрос!');
    return;
  }

  session.answeredCurrent = true;
  const currentQuestion = session.questions[session.currentIndex];
  const isCorrect = selectedOption === currentQuestion.correctAnswer;

  if (isCorrect) {
    session.correctCount += 1;
    session.score += config.game.pointsPerCorrect;
  } else {
    session.lives -= 1;
  }

  await ctx.answerCbQuery();

  const statusText = isCorrect ? '✅ **ПРАВИЛЬНО!**\n\n+10 ⭐' : '❌ **НЕПРАВИЛЬНО!**\n\n-1 ❤️';
  const correctAnswerText = currentQuestion.options[currentQuestion.correctAnswer];
  const livesStr = getLivesText(session.lives);

  const resultText = 
    `${statusText}\n\n` +
    `**Правильный ответ:**\n${correctAnswerText}\n\n` +
    `**Объяснение:**\n${currentQuestion.explanation}\n\n` +
    `**Счёт:** ${session.score}/${session.questions.length * config.game.pointsPerCorrect}\n` +
    `**Жизни:** ${livesStr}`;

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});

  // Проверяем, закончились ли жизни
  if (session.lives <= 0) {
    await ctx.replyWithMarkdown(resultText);
    await finishGame(ctx, session, true);
    return;
  }

  // Если это не последний вопрос
  if (session.currentIndex + 1 < session.questions.length) {
    await ctx.replyWithMarkdown(resultText, getNextQuestionKeyboard());
  } else {
    // Если ответили на все вопросы
    await ctx.replyWithMarkdown(resultText);
    await finishGame(ctx, session, false);
  }
}

async function handleNextQuestion(ctx, userSessions) {
  const userId = ctx.from.id;
  const session = userSessions.get(userId);

  if (!session || !session.inGame) {
    await ctx.answerCbQuery('Игра не активна.');
    return;
  }

  await ctx.answerCbQuery();
  session.currentIndex += 1;
  await sendQuestion(ctx, session);
}

async function finishGame(ctx, session, isGameOverByLives) {
  const userId = ctx.from.id;
  const questionsPassed = session.currentIndex + 1; // Кол-во пройденных вопросов
  const correct = session.correctCount;
  const score = session.score;

  // Сохраняем результат игры в БД
  await saveGameResult(userId, session.difficulty, questionsPassed, correct, score);

  session.inGame = false;

  let finalMessage = '';

  if (isGameOverByLives) {
    finalMessage = 
      `💔 **ТЫ ПРОИГРАЛ! Жизни закончились.**\n\n` +
      `Пройдено вопросов: ${questionsPassed}\n` +
      `Правильных ответов: ${correct}/${questionsPassed}\n` +
      `Очки: ${score}`;
  } else {
    const total = session.questions.length;
    const errors = total - correct;
    const maxScore = total * config.game.pointsPerCorrect;
    const percentage = Math.round((correct / total) * 100);

    finalMessage = 
      `🏆 **ИГРА ЗАВЕРШЕНА!**\n\n` +
      `Правильных ответов: ${correct}/${total}\n` +
      `Ошибок: ${errors}\n` +
      `Очки: ${score}/${maxScore}\n` +
      `Результат: ${percentage}%`;
  }

  await ctx.replyWithMarkdown(finalMessage, getGameOverKeyboard());
}

module.exports = {
  showDifficultySelection,
  handleDifficultySelect,
  handleAnswer,
  handleNextQuestion
};