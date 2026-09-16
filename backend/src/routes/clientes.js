const express = require("express");

const { authMiddleware } = require("../middleware/auth");
const { getClienteDashboardData } = require("../utils/dashboardData");
const { createCliente, getClienteById } = require("../controllers/clienteController");
const { getRegistro } = require("../controllers/registroController");

const router = express.Router();

// POST /api/clientes — Cadastrar cliente e criar sessão do portal
router.post("/", createCliente);

// GET /api/clientes/me — Dados do cliente autenticado (dashboard simplificado)
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const data = await getClienteDashboardData(req.clienteId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/clientes/:id — Dados de um cliente específico
router.get("/:id", authMiddleware, getClienteById);

// GET /api/clientes/:clienteId/registro — Registro completo com todos os dados
router.get("/:clienteId/registro", authMiddleware, getRegistro);

module.exports = router;
