const rateLimit = require("express-rate-limit");

// Limita tentativas de login por IP para mitigar força bruta sobre CPFs.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

// Envio de avaliações públicas: poucas por hora e por dia para cada IP.
const avaliacaoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas avaliações enviadas. Tente novamente mais tarde." },
});

const avaliacaoDiariaLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Limite diário de avaliações atingido. Tente novamente amanhã." },
});

module.exports = { loginLimiter, avaliacaoLimiter, avaliacaoDiariaLimiter };
