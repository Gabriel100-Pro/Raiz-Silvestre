const crypto = require("crypto");

const { pool } = require("../db");
const { HttpError } = require("../middleware/errorHandler");
const {
  validarAvaliacao,
  verificarAntiSpam,
  formatarAvaliacao,
  isUuid,
} = require("../utils/avaliacoes");

const LIMITE_LISTAGEM = 60;
const COLUNAS_PUBLICAS = "id, nome_publico, servico, nota, comentario, criado_em";

// Guarda apenas um HMAC do IP, suficiente para detectar reenvios sem armazenar o IP.
function hashIp(ip) {
  const segredo = process.env.AVALIACOES_HASH_SECRET || process.env.JWT_SECRET || "";
  return crypto.createHmac("sha256", segredo).update(String(ip || "")).digest("hex");
}

// GET /api/avaliacoes — Avaliações publicadas, mais recentes primeiro
async function listarAvaliacoes(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT ${COLUNAS_PUBLICAS}
       FROM avaliacoes
       WHERE status = 'publicada'
       ORDER BY criado_em DESC
       LIMIT $1`,
      [LIMITE_LISTAGEM]
    );

    res.set("Cache-Control", "no-store");
    res.json({ avaliacoes: result.rows.map(formatarAvaliacao) });
  } catch (error) {
    next(error);
  }
}

// POST /api/avaliacoes — Cria e publica uma avaliação
async function criarAvaliacao(req, res, next) {
  try {
    verificarAntiSpam(req.body);
    const dados = validarAvaliacao(req.body);
    const ipHash = hashIp(req.ip);

    // Repetição da mesma requisição (clique duplo, nova tentativa após falha de rede):
    // devolve o registro já gravado em vez de criar outro.
    const existente = await pool.query(
      `SELECT ${COLUNAS_PUBLICAS}, status FROM avaliacoes WHERE idempotency_key = $1`,
      [dados.idempotencyKey]
    );

    if (existente.rows[0]) {
      if (existente.rows[0].status !== "publicada") {
        throw new HttpError(409, "Esta avaliação não está mais disponível.");
      }

      return res.status(200).json({ avaliacao: formatarAvaliacao(existente.rows[0]), repetida: true });
    }

    const duplicada = await pool.query(
      `SELECT 1 FROM avaliacoes
       WHERE ip_hash = $1 AND comentario = $2 AND criado_em > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [ipHash, dados.comentario]
    );

    if (duplicada.rows[0]) {
      throw new HttpError(409, "Esta avaliação já foi enviada.");
    }

    const inserida = await pool.query(
      `INSERT INTO avaliacoes (nome_publico, servico, nota, comentario, consentimento, idempotency_key, ip_hash)
       VALUES ($1, $2, $3, $4, TRUE, $5, $6)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING ${COLUNAS_PUBLICAS}`,
      [dados.nome, dados.servico, dados.nota, dados.comentario, dados.idempotencyKey, ipHash]
    );

    if (inserida.rows[0]) {
      return res.status(201).json({ avaliacao: formatarAvaliacao(inserida.rows[0]) });
    }

    // Duas requisições idênticas chegaram ao mesmo tempo: a outra gravou primeiro.
    const concorrente = await pool.query(
      `SELECT ${COLUNAS_PUBLICAS} FROM avaliacoes WHERE idempotency_key = $1`,
      [dados.idempotencyKey]
    );

    res.status(200).json({ avaliacao: formatarAvaliacao(concorrente.rows[0]), repetida: true });
  } catch (error) {
    next(error);
  }
}

// GET /api/avaliacoes/admin — Todas as avaliações, inclusive removidas (Admin: X-Admin-Token)
async function listarAvaliacoesAdmin(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT ${COLUNAS_PUBLICAS}, status, removido_em
       FROM avaliacoes
       ORDER BY criado_em DESC
       LIMIT 500`
    );

    res.set("Cache-Control", "no-store");
    res.json({
      avaliacoes: result.rows.map((row) => ({
        ...formatarAvaliacao(row),
        status: row.status,
        removidoEm: row.removido_em,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/avaliacoes/:id — Remove spam ou conteúdo abusivo (Admin: X-Admin-Token)
// A remoção é lógica: o registro sai do site, mas continua no banco para auditoria.
async function removerAvaliacao(req, res, next) {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new HttpError(400, "Identificador inválido.");
    }

    const result = await pool.query(
      `UPDATE avaliacoes
       SET status = 'removida', removido_em = NOW()
       WHERE id = $1 AND status = 'publicada'
       RETURNING id`,
      [id]
    );

    if (!result.rows[0]) {
      throw new HttpError(404, "Avaliação não encontrada ou já removida.");
    }

    res.json({ message: "Avaliação removida do site.", id: result.rows[0].id });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarAvaliacoes,
  criarAvaliacao,
  listarAvaliacoesAdmin,
  removerAvaliacao,
};
