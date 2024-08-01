import respQuestions from './questions.js';

export default (answersObj) => {
  return respQuestions
    .map((question, i) => {
      return `${i + 1}) ${question.slice(0, -1)}: \n${answersObj[question]}`;
    })
    .join('\n\n');
};
