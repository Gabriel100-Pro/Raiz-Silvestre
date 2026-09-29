// App Express apenas com as rotas de avaliações, usado pelas Vercel Functions em /api.
// Reaproveita o mesmo controller, validação e proteção de admin do servidor completo
// (src/server.js), sem expor o Portal do Cliente nem gravar arquivos em disco.
const express = require("express");

const { requireAdmin } = require("./middleware/adminAuth");
const { sanitizeInput } = require("./middleware/sanitize");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const {
  verificarSaude,
  listarAvaliacoes,
  criarAvaliacao,
  listarAvaliacoesAdmin,
  removerAvaliacao,
} = require("./controllers/avaliacaoController");

const app = express();

// Na Vercel, o IP real do visitante chega em X-Forwarded-For, definido pela própria plataforma.
app.set("trust proxy", true);
app.disable("x-powered-by");

// O site e a API ficam no mesmo domínio, então não é preciso liberar CORS.
app.use(express.json({ limit: "20kb" }));
app.use(sanitizeInput);

app.get("/api/health", verificarSaude);
app.get("/api/avaliacoes", listarAvaliacoes);
app.post("/api/avaliacoes", criarAvaliacao);
app.get("/api/avaliacoes/admin", requireAdmin, listarAvaliacoesAdmin);
app.delete("/api/avaliacoes/:id", requireAdmin, removerAvaliacao);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
