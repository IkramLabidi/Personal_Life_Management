export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `That value is already taken (${Object.keys(err.keyValue || {}).join(', ')})`;
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Authentication token expired';
  }

  if (status >= 500) console.error('[LifeOS error]', err);
  res.status(status).json({ message });
};
