const express = require("express");

const { requireAdmin } = require("../middleware/adminAuth");
const { avaliacaoLimiter, avaliacaoDiariaLimiter } = require("../middleware/rateLimiter");
const {
  listarAvaliacoes,
  criarAvaliacao,
  listarAvaliacoesAdmin,
  removerAvaliacao,
} = require("../controllers/avaliacaoController");

const router = express.Router();

// GET /api/avaliacoes — Público: avaliações publicadas
router.get("/", listarAvaliacoes);

// POST /api/avaliacoes — Público: envia uma avaliação (limitado por IP)
router.post("/", avaliacaoLimiter, avaliacaoDiariaLimiter, criarAvaliacao);

// GET /api/avaliacoes/admin — Moderação (Admin: X-Admin-Token)
router.get("/admin", requireAdmin, listarAvaliacoesAdmin);

// DELETE /api/avaliacoes/:id — Moderação: remove spam/abuso (Admin: X-Admin-Token)
router.delete("/:id", requireAdmin, removerAvaliacao);

// Visitantes não podem editar avaliações: não existe rota PUT/PATCH.

module.exports = router;
