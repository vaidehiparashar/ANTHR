// src/middleware/validate.js
const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join('; ');
    return errorResponse(res, messages, 400, errors.array());
  }
  next();
};

module.exports = { validate };
