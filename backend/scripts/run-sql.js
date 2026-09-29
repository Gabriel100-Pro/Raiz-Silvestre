// Executa um arquivo .sql no banco de DATABASE_URL, sem precisar do psql instalado.
// Uso: node scripts/run-sql.js src/db/avaliacoes.sql
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../src/db");

async function main() {
  const arquivo = process.argv[2];

  if (!arquivo) {
    console.error("Informe o arquivo SQL. Ex.: node scripts/run-sql.js src/db/avaliacoes.sql");
    process.exit(1);
  }

  const sql = fs.readFileSync(path.resolve(arquivo), "utf8");
  await pool.query(sql);
  console.log(`SQL executado com sucesso: ${arquivo}`);
}

main()
  .catch((error) => {
    console.error("Falha ao executar o SQL:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
