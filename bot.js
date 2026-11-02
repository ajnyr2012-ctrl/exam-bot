const { Telegraf, session } = require('telegraf');

// ==== ВСТАВЬ СВОЙ ТОКЕН СЮДА ====
const BOT_TOKEN = '8816271262:AAGVQzEj7W2ojBbUIT8nLWzhL7QnjCkYocE'; 

const MINUTES_PER_QUESTION = 6.5; // минут на один вопрос

const bot = new Telegraf(BOT_TOKEN);

// Простая сессия в памяти (сбрасывается при перезапуске — для теста ок)
bot.use(session());

// Шаг 1: /start
bot.start((ctx) => {
  ctx.session = { step: 'questions' };
  return ctx.reply(
    'Привет! Я помогу составить график подготовки к экзамену.\n\n' +
    'Сколько всего вопросов нужно подготовить? Напиши число, например: 120'
  );
});

// Шаг 2 и 3: ловим текстовые сообщения
bot.on('text', async (ctx) => {
  const step = ctx.session?.step;
  const text = ctx.message.text.trim();

  // Если пользователь не начинал — подсказываем
  if (!step) {
    return ctx.reply('Я пока простой. Отправь /start, чтобы начать.');
  }

  // Ожидаем число вопросов
  if (step === 'questions') {
    if (!/^\d+$/.test(text) || parseInt(text, 10) <= 0) {
      return ctx.reply('Нужно целое число больше нуля. Попробуй ещё раз:');
    }
    ctx.session.questions = parseInt(text, 10);
    ctx.session.step = 'days';
    return ctx.reply(
      `Записал: ${ctx.session.questions} вопросов.\n\n` +
      'Сколько дней осталось до экзамена? Напиши число, например: 14'
    );
  }

  // Ожидаем число дней
  if (step === 'days') {
    if (!/^\d+$/.test(text) || parseInt(text, 10) <= 0) {
      return ctx.reply('Нужно целое число больше нуля. Попробуй ещё раз:');
    }

    const days = parseInt(text, 10);
    const questions = ctx.session.questions;

    const perDay = Math.ceil(questions / days);
    const totalMinutes = Math.round(perDay * MINUTES_PER_QUESTION);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = hours ? `${hours} ч ${mins} мин` : `${mins} мин`;

    ctx.session = {}; // сбрасываем

    return ctx.reply(
      '📅 График подготовки\n\n' +
      `Всего вопросов: ${questions}\n` +
      `Дней до экзамена: ${days}\n\n` +
      `В день: ${perDay} вопросов (~${timeStr})\n\n` +
      'Совет: лучше заниматься каждый день понемногу, чем всё в последнюю ночь.\n\n' +
      'Чтобы составить новый график, отправь /start'
    );
  }

  return ctx.reply('Что-то пошло не так. Отправь /start, чтобы начать заново.');
});

// Запуск
bot.launch().then(() => {
  console.log('Бот запущен. Нажми Ctrl+C, чтобы остановить.');
});

// Аккуратная остановка
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));