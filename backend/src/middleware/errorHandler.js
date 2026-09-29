class HttpError extends Error {
  // "errors" é opcional: mensagens por campo, devolvidas ao cliente em validações.
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function notFoundHandler(req, res, next) {
  next(new HttpError(404, "Rota não encontrada."));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? "Erro interno do servidor." : err.message;

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json(err.errors && statusCode < 500 ? { message, errors: err.errors } : { message });
}

module.exports = { HttpError, notFoundHandler, errorHandler };
