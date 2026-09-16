const crypto = require("crypto");
const { HttpError } = require("./errorHandler");

// Protege rotas administrativas (criar/editar/apagar cuidados, enviar/apagar fotos).
// Exige o header X-Admin-Token igual a ADMIN_TOKEN do .env. Sem ADMIN_TOKEN configurado,
// as rotas ficam bloqueadas. Deve ser usado após authMiddleware: o JWT continua
// identificando o cliente dono dos registros e o isolamento por cliente_id é mantido.
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN || "";
  const provided = String(req.headers["x-admin-token"] || "");

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  const isValid =
    expected.length > 0 &&
    expectedBuf.length === providedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!isValid) {
    return next(new HttpError(403, "Acesso restrito à administração."));
  }

  next();
}

module.exports = { requireAdmin };
