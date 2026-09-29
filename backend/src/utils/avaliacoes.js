const { HttpError } = require("../middleware/errorHandler");

// Serviços oferecidos no site (seção "Nossos Serviços"). A chave é o que fica gravado no banco.
const SERVICOS_AVALIACAO = {
  implantacao: "Implantação de Jardins",
  solo: "Solo e Nutrição",
  manutencao: "Manutenção e Acabamento",
  projetos: "Projetos Especiais",
};

const NOME_MIN = 2;
const NOME_MAX = 60;
const COMENTARIO_MIN = 10;
const COMENTARIO_MAX = 1000;
// Tempo mínimo entre abrir o formulário e enviar; robôs costumam enviar instantaneamente.
const TEMPO_MINIMO_MS = 3000;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LINK_REGEX = /(https?:\/\/|www\.)\S+/i;

// Conta caracteres como o PostgreSQL (code points), não unidades UTF-16.
const contarCaracteres = (texto) => Array.from(texto).length;

function normalizarNome(valor) {
  return typeof valor === "string" ? valor.replace(/\s+/g, " ").trim() : "";
}

function normalizarComentario(valor) {
  if (typeof valor !== "string") {
    return "";
  }

  return valor
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isUuid(valor) {
  return typeof valor === "string" && UUID_REGEX.test(valor);
}

// Valida e normaliza o corpo do POST. Lança HttpError 400 com os erros por campo.
function validarAvaliacao(body = {}) {
  const erros = {};

  const nome = normalizarNome(body.nome);
  const tamanhoNome = contarCaracteres(nome);
  if (tamanhoNome < NOME_MIN || tamanhoNome > NOME_MAX) {
    erros.nome = `Informe um nome entre ${NOME_MIN} e ${NOME_MAX} caracteres.`;
  } else if (!/\p{L}/u.test(nome)) {
    erros.nome = "O nome precisa conter letras.";
  } else if (LINK_REGEX.test(nome)) {
    erros.nome = "O nome não pode conter links.";
  }

  const servico = typeof body.servico === "string" ? body.servico : "";
  if (!Object.prototype.hasOwnProperty.call(SERVICOS_AVALIACAO, servico)) {
    erros.servico = "Selecione o serviço realizado.";
  }

  const nota = Number(body.nota);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    erros.nota = "Selecione uma nota de 1 a 5 estrelas.";
  }

  const comentario = normalizarComentario(body.comentario);
  const tamanhoComentario = contarCaracteres(comentario);
  if (tamanhoComentario < COMENTARIO_MIN || tamanhoComentario > COMENTARIO_MAX) {
    erros.comentario = `O comentário deve ter entre ${COMENTARIO_MIN} e ${COMENTARIO_MAX} caracteres.`;
  } else if (LINK_REGEX.test(comentario)) {
    erros.comentario = "Por segurança, comentários com links não são aceitos.";
  }

  if (body.consentimento !== true) {
    erros.consentimento = "É preciso autorizar a publicação do nome e do comentário.";
  }

  if (!isUuid(body.idempotencyKey)) {
    erros.idempotencyKey = "Envio inválido. Atualize a página e tente novamente.";
  }

  if (Object.keys(erros).length > 0) {
    throw new HttpError(400, "Revise os campos destacados.", erros);
  }

  return {
    nome,
    servico,
    nota,
    comentario,
    idempotencyKey: body.idempotencyKey.toLowerCase(),
  };
}

// Proteções contra robôs: campo-isca preenchido ou envio rápido demais.
function verificarAntiSpam(body = {}) {
  if (typeof body.website === "string" && body.website.length > 0) {
    throw new HttpError(400, "Não foi possível enviar a avaliação.");
  }

  const iniciadoEm = Number(body.iniciadoEm);
  const decorrido = Date.now() - iniciadoEm;
  if (!Number.isFinite(iniciadoEm) || decorrido < TEMPO_MINIMO_MS) {
    throw new HttpError(400, "Envio muito rápido. Aguarde alguns segundos e tente novamente.");
  }
}

// Formato público: nunca expõe ip_hash, chave de idempotência ou status.
function formatarAvaliacao(row) {
  return {
    id: row.id,
    nome: row.nome_publico,
    servico: row.servico,
    servicoNome: SERVICOS_AVALIACAO[row.servico] || row.servico,
    nota: row.nota,
    comentario: row.comentario,
    criadoEm: row.criado_em,
  };
}

module.exports = {
  SERVICOS_AVALIACAO,
  validarAvaliacao,
  verificarAntiSpam,
  formatarAvaliacao,
  isUuid,
};
