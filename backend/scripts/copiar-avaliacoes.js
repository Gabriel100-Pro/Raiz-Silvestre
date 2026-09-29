// Copia as avaliações de um banco para outro (ex.: PostgreSQL local -> banco de produção),
// preservando id, data, status e demais colunas. Pode ser executado mais de uma vez:
// registros que já existem no destino (mesmo id ou mesma chave de envio) são ignorados.
// Nada é apagado nem alterado na origem.
//
// Uso (PowerShell):
//   $env:ORIGEM_DATABASE_URL = "postgresql://...local..."
//   $env:DESTINO_DATABASE_URL = "postgresql://...producao..."
//   node scripts/copiar-avaliacoes.js
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

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

async function main() {
  const origemUrl = process.env.ORIGEM_DATABASE_URL;
  const destinoUrl = process.env.DESTINO_DATABASE_URL;

  if (!origemUrl || !destinoUrl) {
    console.error("Defina ORIGEM_DATABASE_URL e DESTINO_DATABASE_URL antes de executar.");
    process.exitCode = 1;
    return;
  }

  if (origemUrl === destinoUrl) {
    console.error("Origem e destino são o mesmo banco; nada a copiar.");
    process.exitCode = 1;
    return;
  }

  const origem = new Pool({ connectionString: origemUrl, max: 1 });
  const destino = new Pool({ connectionString: destinoUrl, max: 1 });

  try {
    // Garante a tabela no destino (o SQL é idempotente).
    const migracao = fs.readFileSync(path.join(__dirname, "../src/db/avaliacoes.sql"), "utf8");
    await destino.query(migracao);

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
  } finally {
    await Promise.all([origem.end(), destino.end()]);
  }
}

main().catch((error) => {
  console.error("Falha ao copiar avaliações:", error.message);
  process.exitCode = 1;
});
