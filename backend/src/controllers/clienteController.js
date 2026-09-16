const { pool } = require("../db");
const jwt = require("jsonwebtoken");
const { HttpError } = require("../middleware/errorHandler");
const { maskCpf } = require("../utils/format");
const { isValidCpf, onlyDigits } = require("../utils/cpf");

// POST /api/clientes — Cria um cliente e inicia sua sessão no portal.
async function createCliente(req, res, next) {
  try {
    const { nome, email, telefone, endereco } = req.body;
    const cpf = onlyDigits(req.body.cpf);

    if (!nome || typeof nome !== "string" || nome.length > 150) {
      throw new HttpError(400, "Nome é obrigatório e deve ter no máximo 150 caracteres.");
    }

    if (!isValidCpf(cpf)) {
      throw new HttpError(400, "CPF inválido.");
    }

    if (email && (typeof email !== "string" || email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      throw new HttpError(400, "Email inválido.");
    }

    if (telefone && (typeof telefone !== "string" || !/^\d{10,15}$/.test(telefone.replace(/\D/g, "")))) {
      throw new HttpError(400, "Telefone inválido.");
    }

    if (endereco && (typeof endereco !== "string" || endereco.length > 255)) {
      throw new HttpError(400, "Endereço deve ter no máximo 255 caracteres.");
    }

    const existente = await pool.query("SELECT id FROM clientes WHERE cpf = $1 LIMIT 1", [cpf]);
    if (existente.rows[0]) {
      throw new HttpError(409, "Este CPF já está cadastrado.");
    }

    const result = await pool.query(
      `INSERT INTO clientes (nome, cpf, email, telefone, endereco)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome`,
      [nome, cpf, email || null, telefone || null, endereco || null]
    );
    const cliente = result.rows[0];
    const token = jwt.sign({ sub: cliente.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return next(new HttpError(409, "Este CPF já está cadastrado."));
    }
    next(error);
  }
}

// GET /api/clientes/:id — Retorna dados de um cliente específico
async function getClienteById(req, res, next) {
  try {
    const clienteId = Number(req.params.id);

    if (clienteId !== Number(req.clienteId)) {
      throw new HttpError(403, "Acesso não autorizado.");
    }

    const result = await pool.query(
      "SELECT id, nome, cpf, email, telefone, endereco, criado_em FROM clientes WHERE id = $1",
      [clienteId]
    );

    if (!result.rows[0]) {
      throw new HttpError(404, "Cliente não encontrado.");
    }

    const cliente = result.rows[0];
    res.json({
      id: cliente.id,
      nome: cliente.nome,
      cpf: maskCpf(cliente.cpf),
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      criadoEm: cliente.criado_em,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCliente,
  getClienteById,
};
