const btns = require('./keyboard-buttons.js');

const keyboard = {
  home: [[btns.home.resp], [btns.home.coop], [btns.home.other]],
  resp: [[btns.resp.confirm, btns.resp.cancel]],
};

module.exports = keyboard;
