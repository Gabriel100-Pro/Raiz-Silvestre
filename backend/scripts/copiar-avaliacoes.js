// Copia as avaliações de um banco para outro (ex.: PostgreSQL local -> Neon de produção),
// preservando id, data, status e demais colunas. Pode ser executado mais de uma vez:
// registros que já existem no destino (mesmo id ou mesma chave de envio) são ignorados.
// Nada é apagado nem alterado na origem.
//
// De onde vêm as conexões (nenhuma URL é exibida no terminal):
//   origem  -> ORIGEM_DATABASE_URL ou, se ausente, DATABASE_URL de backend/.env (banco local)
//   destino -> DESTINO_DATABASE_URL ou, se ausente, a mesma chave em backend/.env.producao
//              (arquivo ignorado pelo Git)
//
// Uso: cd backend && npm run db:copiar-avaliacoes
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

const RAIZ_BACKEND = path.join(__dirname, "..");
const ARQUIVO_DESTINO = path.join(RAIZ_BACKEND, ".env.producao");

const COLUNAS = [
  "id",
  "nome_publico",
  "servico",
  "nota",
  "comentario",
  "consentimento",
  "idempotency_key",
  "ip_hash",
  "status",
  "criado_em",
  "removido_em",
];

// Índices usados pela listagem pública e pelo controle de envios por IP.
const INDICES_ESPERADOS = ["avaliacoes_pkey", "avaliacoes_idempotency_key_key", "idx_avaliacoes_publicadas", "idx_avaliacoes_ip_hash"];

function lerOrigem() {
  if (process.env.ORIGEM_DATABASE_URL) {
    return process.env.ORIGEM_DATABASE_URL;
  }

  // Lê backend/.env sem alterar process.env.
  const arquivo = path.join(RAIZ_BACKEND, ".env");
  return fs.existsSync(arquivo) ? dotenv.parse(fs.readFileSync(arquivo)).DATABASE_URL : undefined;
}

function lerDestino() {
  if (process.env.DESTINO_DATABASE_URL) {
    return process.env.DESTINO_DATABASE_URL;
  }

  return fs.existsSync(ARQUIVO_DESTINO)
    ? dotenv.parse(fs.readFileSync(ARQUIVO_DESTINO)).DESTINO_DATABASE_URL
    : undefined;
}

// Mostra só host e nome do banco, nunca usuário ou senha.
function descrever(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch (_error) {
    return "(URL inválida)";
  }
}

const isLocal = (url) => /^(localhost|127\.0\.0\.1|::1|\[::1\])$/i.test(new URL(url).hostname);

async function main() {
  const origemUrl = lerOrigem();
  const destinoUrl = lerDestino();

  if (!origemUrl) {
    throw new Error("Conexão de origem ausente: defina DATABASE_URL em backend/.env.");
  }

  if (!destinoUrl) {
    throw new Error("Conexão de destino ausente: preencha DESTINO_DATABASE_URL em backend/.env.producao.");
  }

  if (origemUrl === destinoUrl) {
    throw new Error("Origem e destino são o mesmo banco; nada a copiar.");
  }

  if (isLocal(destinoUrl)) {
    throw new Error("O destino aponta para um banco local; use a URL do banco de produção.");
  }

  console.log(`Origem : ${descrever(origemUrl)}`);
  console.log(`Destino: ${descrever(destinoUrl)}`);

  const origem = new Pool({ connectionString: origemUrl, max: 1 });
  const destino = new Pool({ connectionString: destinoUrl, max: 1, connectionTimeoutMillis: 15000 });

  try {
    // 1. Migração: cria tabela e índices se ainda não existirem (SQL idempotente).
    const migracao = fs.readFileSync(path.join(RAIZ_BACKEND, "src/db/avaliacoes.sql"), "utf8");
    await destino.query(migracao);
    console.log("Migração aplicada no destino (avaliacoes.sql).");

    // 2. Cópia sem duplicar: conflito de id ou idempotency_key é ignorado.
    const { rows } = await origem.query(`SELECT ${COLUNAS.join(", ")} FROM avaliacoes ORDER BY criado_em`);
    let copiadas = 0;

    for (const row of rows) {
      const valores = COLUNAS.map((coluna) => row[coluna]);
      const marcadores = COLUNAS.map((_, index) => `$${index + 1}`).join(", ");
      const result = await destino.query(
        `INSERT INTO avaliacoes (${COLUNAS.join(", ")}) VALUES (${marcadores}) ON CONFLICT DO NOTHING`,
        valores
      );
      copiadas += result.rowCount;
    }

    console.log(`Avaliações na origem: ${rows.length}. Copiadas agora: ${copiadas}. Já existentes no destino: ${rows.length - copiadas}.`);

    // 3. Verificação: tabela, índices e todos os ids da origem presentes no destino.
    const indices = await destino.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'avaliacoes'"
    );
    const nomes = indices.rows.map((row) => row.indexname);
    const faltando = INDICES_ESPERADOS.filter((nome) => !nomes.includes(nome));

    const ids = rows.map((row) => row.id);
    const presentes = ids.length
      ? (await destino.query("SELECT COUNT(*)::int AS n FROM avaliacoes WHERE id = ANY($1::uuid[])", [ids])).rows[0].n
      : 0;
    const total = (await destino.query("SELECT COUNT(*)::int AS n FROM avaliacoes")).rows[0].n;

    console.log(`Índices no destino: ${nomes.sort().join(", ")}`);
    console.log(`Registros da origem encontrados no destino: ${presentes}/${ids.length}. Total no destino: ${total}.`);

    if (faltando.length > 0 || presentes !== ids.length) {
      throw new Error(`Verificação falhou. Índices ausentes: ${faltando.join(", ") || "nenhum"}.`);
    }

    console.log("OK: migração e cópia confirmadas.");
  } finally {
    await Promise.all([origem.end(), destino.end()]);
  }
}

main().catch((error) => {
  console.error("Falha:", error.message);
  process.exitCode = 1;
});
