const ApiError = require('../utils/ApiError');

// HTML forms send "" for unset optional fields. Convert to null so Joi ENUM /
// number / date schemas don't reject them (they all allow null).
const nullifyEmpty = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v])
  );
};

module.exports = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(nullifyEmpty(req[source]), { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    return next(new ApiError(400, 'Validation failed', errors));
  }
  req[source] = value;
  next();
};