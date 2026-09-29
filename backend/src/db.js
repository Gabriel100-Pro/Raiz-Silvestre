const { Pool } = require("pg");
const { HttpError } = require("./middleware/errorHandler");

// Em funções serverless (Vercel) cada instância abre seu próprio pool: PG_POOL_MAX
// baixo evita esgotar conexões. Com Neon/Supabase use a URL "pooled" e sslmode=require.
// DATABASE_URL é o padrão do projeto; POSTGRES_URL cobre integrações da Vercel que usam esse nome.
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX) || 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
});

// Evita que uma conexão ociosa derrubada pelo provedor encerre o processo.
pool.on("error", (error) => {
  console.error("[db] conexão ociosa encerrada:", error.message);
});

const CONNECTION_ERRORS = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "EAI_AGAIN",
  "28P01", // senha inválida
  "28000", // autorização inválida
  "3D000", // banco inexistente
  "57P01", // conexão encerrada pelo servidor
  "53300", // limite de conexões
]);

// Converte falhas do banco em respostas 503 com mensagem pública genérica. O motivo
// técnico vai só para o log do servidor (logs da Vercel/Render), nunca para o navegador.
function traduzirErroBanco(error) {
  if (error instanceof HttpError) {
    return error;
  }

  if (!connectionString) {
    console.error("[db] DATABASE_URL não configurada neste ambiente.");
    return new HttpError(503, "O serviço de avaliações está temporariamente indisponível.");
  }

  if (error && error.code === "42P01") {
    console.error("[db] tabela inexistente — execute a migração avaliacoes.sql:", error.message);
    return new HttpError(503, "O serviço de avaliações está temporariamente indisponível.");
  }

  if (error && (CONNECTION_ERRORS.has(error.code) || /timeout|terminated/i.test(error.message || ""))) {
    console.error("[db] falha de conexão com o banco:", error.code || "", error.message);
    return new HttpError(503, "O serviço de avaliações está temporariamente indisponível.");
  }

  return error;
}

module.exports = { pool, traduzirErroBanco };
