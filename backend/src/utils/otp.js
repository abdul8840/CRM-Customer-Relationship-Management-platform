const crypto = require('crypto');
const generateOtp = (len = 6) => {
  const max = 10 ** len;
  return String(crypto.randomInt(0, max)).padStart(len, '0');
};
module.exports = { generateOtp };