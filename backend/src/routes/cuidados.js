const express = require("express");

const { authMiddleware } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminAuth");
const {
  getProximosCuidados,
  getProximoCuidadoById,
  createProximoCuidado,
  updateProximoCuidado,
  deleteProximoCuidado,
} = require("../controllers/cuidadoController");

const router = express.Router();

// GET /api/proximos-cuidados/me — Obter os próximos cuidados do cliente autenticado
router.get("/me", authMiddleware, getProximosCuidados);

// GET /api/proximos-cuidados/clientes/:clienteId — Obter próximos cuidados de um cliente
router.get("/clientes/:clienteId", authMiddleware, getProximosCuidados);

// GET /api/proximos-cuidados/:id — Obter um próximo cuidado específico
router.get("/:id", authMiddleware, getProximoCuidadoById);

// POST /api/proximos-cuidados/clientes/:clienteId — Criar próximo cuidado (Admin: JWT do cliente + X-Admin-Token)
router.post("/clientes/:clienteId", authMiddleware, requireAdmin, createProximoCuidado);

// PUT /api/proximos-cuidados/:id — Atualizar próximo cuidado (Admin: JWT do cliente + X-Admin-Token)
router.put("/:id", authMiddleware, requireAdmin, updateProximoCuidado);

// DELETE /api/proximos-cuidados/:id — Deletar próximo cuidado (Admin: JWT do cliente + X-Admin-Token)
router.delete("/:id", authMiddleware, requireAdmin, deleteProximoCuidado);

module.exports = router;
