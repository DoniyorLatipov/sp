const respQuestions = require('./questions.js');

const respParseAnswers = (answersObj) => {
  return respQuestions
    .map((question, i) => {
      return `${i + 1}) ${question.slice(0, -1)}: \n${answersObj[question]}`;
    })
    .join('\n\n');
};

module.exports = respParseAnswers;
