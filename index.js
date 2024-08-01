import TelegramApi from 'node-telegram-bot-api';
import config from './src/config.js';
import btns from './src/keyboard-buttons.js';
import coopParseAnswers from './src/coop/parse-answers.js';
import respParseAnswers from './src/resp/parse-answers.js';
import getChatId from './src/getChatId.js';
import keyboard from './src/keyboard.js';
import respQuestions from './src/resp/questions.js';
import coopQuestions from './src/coop/questions.js';
import urlValidate from './src/url-validate.js';
import _ from 'lodash';

const bot = new TelegramApi(config.TOKEN, { polling: true });

bot.setMyCommands([
  { command: '/start', description: 'Запустить бота' },
  { command: '/home', description: 'Вернуться на главную' },
]);
const db = {};

bot.on('message', (msg) => {
  if (msg.text === '/start' || msg.text === '/home') {
    delete db[getChatId];
    return;
  }

  if (Object.hasOwn(db, getChatId(msg)) && !Object.values(btns.resp).includes(msg.text)) {
    const replyText = msg?.reply_to_message?.text;

    if (respQuestions.includes(replyText) && db[getChatId(msg)].type === 'resp') {
      const question = replyText;
      db[getChatId(msg)][question] = msg.text;
      const index = respQuestions.indexOf(question);

      if (respQuestions.indexOf(question) === respQuestions.length - 1) {
        let text = `Ваши ответы: \n\n${respParseAnswers(
          db[getChatId(msg)],
        )}\n\nЕсли все верно нажмите кнопку "${btns.resp.confirm}"`;

        bot.sendMessage(getChatId(msg), text, {
          reply_markup: {
            keyboard: keyboard.resp,
            resize_keyboard: true,
          },
        });
        return;
      }

      let nextQuestion = respQuestions[index + 1];
      bot.sendMessage(getChatId(msg), nextQuestion, {
        reply_markup: {
          force_reply: true,
        },
      });
    } else if (coopQuestions.includes(replyText) && db[getChatId(msg)].type === 'coop') {
      const question = replyText;
      if (coopQuestions.indexOf(question) === 2) {
        if (urlValidate(msg.text)) {
          db[getChatId(msg)][question] = msg.text;

          const user = msg.from;
          bot
            .sendMessage(
              config.agent,
              `Новое предложение. Пользователь ${user.first_name}${
                user.last_name ? ` ${user.last_name}` : ''
              }${user.username ? ` (@${user.username})` : ''}: \n\n${coopParseAnswers(
                db[getChatId(msg)],
              )}`,
            )
            .then(() => {
              bot.sendMessage(
                getChatId(msg),
                'Ваши предложение было успешно отправлено. Cкоро с вами свяжемся. А пока можете выбрать следующие действие',
                {
                  reply_markup: {
                    keyboard: keyboard.home,
                    resize_keyboard: true,
                  },
                },
              );

              delete db[getChatId(msg)];
            });
        } else {
          bot
            .sendMessage(
              getChatId(msg),
              `Cсылка является не действительной. Проверьте её на наличие ошибок.
(Пример: http://www.example.com)`,
            )
            .then(() => {
              bot.sendMessage(getChatId(msg), coopQuestions[2], {
                reply_markup: {
                  force_reply: true,
                },
              });
            });
        }
      } else {
        db[getChatId(msg)][question] = msg.text;
        const qIndex = coopQuestions.indexOf(question);
        bot.sendMessage(getChatId(msg), coopQuestions[qIndex + 1], {
          reply_markup: {
            force_reply: true,
          },
        });
      }
    } else if (
      replyText === 'Пожалуйста опишите ваш вопрос или предложение😁' &&
      db[getChatId(msg)].type === 'other'
    ) {
      const user = msg.from;
      bot
        .sendMessage(
          config.agent,
          `Новое вопрос/предложение. Пользователь ${user.first_name}${
            user.last_name ? ` ${user.last_name}` : ''
          }${user.username ? ` (@${user.username})` : ''}: \n\n${msg.text}`,
        )
        .then(() => {
          bot.sendMessage(
            getChatId(msg),
            'Ваш вопрос/предложение был успешно отправлены. Скоро с вами свяжемся. А пока можете выбрать следующие действие',
            {
              reply_markup: {
                keyboard: keyboard.home,
                resize_keyboard: true,
              },
            },
          );
          delete db[getChatId(msg)];
        });
    } else {
      if (msg.text !== btns.resp.noChange) {
        bot
          .sendMessage(
            getChatId(msg),
            '❗️ Что бы ответить выделите вопрос и нажмите "Ответить" ❗️',
          )
          .then((data) => setTimeout(() => bot.deleteMessage(data.chat.id, data.message_id), 5000));
      }
    }
  }

  switch (msg.text) {
    case btns.home.resp:
      bot
        .sendMessage(
          getChatId(msg),
          `Пожалуйста, ответьте на следующие ${respQuestions.length} вопросов.
Что бы отменить и вернуться назад воспользуйтесь командой /home.
Что бы ответить выделите вопрос и нажмите "Ответить"`,
        )
        .then(() => {
          db[getChatId(msg)] = { type: 'resp' };
          bot.sendMessage(getChatId(msg), `${respQuestions[0]}`, {
            reply_markup: {
              force_reply: true,
            },
          });
        });
      break;
    case btns.home.coop:
      bot
        .sendMessage(
          getChatId(msg),
          `Пожалуйста, ответьте на следующие ${coopQuestions.length} вопроса.
  Что бы отменить и вернуться назад воспользуйтесь командой /home.
  Что бы ответить выделите вопрос и нажмите "Ответить"`,
        )
        .then(() => {
          db[getChatId(msg)] = { type: 'coop' };
          bot.sendMessage(getChatId(msg), `${coopQuestions[0]}`, {
            reply_markup: {
              force_reply: true,
            },
          });
        });
      break;
    case btns.home.other:
      bot
        .sendMessage(getChatId(msg), 'Пожалуйста опишите ваш вопрос или предложение😁', {
          reply_markup: {
            force_reply: true,
          },
        })
        .then(() => {
          db[getChatId(msg)] = { type: 'other' };
        });
      break;
    case btns.resp.confirm:
      bot.sendMessage(
        getChatId(msg),
        'Ваши ответы были успешно отправлены. Cкоро с вами свяжемся. А пока можете выбрать следующие действие',
        {
          reply_markup: {
            keyboard: keyboard.home,
            resize_keyboard: true,
          },
        },
      );

      const user = msg.from;
      bot
        .sendMessage(
          config.agent,
          `Новая анкета. Пользователь ${user.first_name}${
            user.last_name ? ` ${user.last_name}` : ''
          }${user.username ? ` (@${user.username})` : ''}: \n\n${respParseAnswers(
            db[getChatId(msg)],
          )}`,
        )
        .then(() => {
          delete db[getChatId(msg)];
        });
      break;
    case btns.resp.cancel:
      bot.sendMessage(
        getChatId(msg),
        'Ваши ответы были успешно удалены. Теперь вы на главной, выбирите следующие действие',
        {
          reply_markup: {
            keyboard: keyboard.home,
            resize_keyboard: true,
          },
        },
      );
      delete db[getChatId(msg)];
      break;
  }
});

bot.onText(/\/start/, (msg) => {
  const text = `Здравствуйте, ${msg.from.first_name} ;)
Добро пожаловать на наш бот половой психологии!
Выбирите следующие действие`;
  bot.sendMessage(getChatId(msg), text, {
    reply_markup: {
      keyboard: keyboard.home,
      resize_keyboard: true,
    },
  });
});

bot.onText(/\/home/, (msg) => {
  bot.sendMessage(getChatId(msg), '🏠 Вы на главной, выбирите следующие действие', {
    reply_markup: {
      keyboard: keyboard.home,
      resize_keyboard: true,
    },
  });
});
