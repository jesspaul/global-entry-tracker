const cors = require('cors');

const verifyAccess = async (req, res, next) => {
  try {
    return next();
  } catch (e) {
    console.log(e);
    return next(e);
  }
};

const corsHandler = cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5000',
  ],
});

module.exports = {
  verifyAccess,
  corsHandler,
};
