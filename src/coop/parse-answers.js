const coopParseAnswers = (answersObj) => {
  return Object.entries(answersObj)
    .reduce((acc, [question, answer]) => {
      switch (question) {
        case 'Как вас зовут?':
          return [...acc, `👤 Имя: \n${answer}`];
        case 'Какое у вас предложение?':
          return [...acc, `🤝 Предложение: \n${answer}`];
        case 'Ссылка на ваш ресурс?':
          return [...acc, `🔗 Ссылка: \n${answer}`];
        default:
          return acc;
      }
    }, [])
    .join('\n\n');
};

module.exports = coopParseAnswers;
