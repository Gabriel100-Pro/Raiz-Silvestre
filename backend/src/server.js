require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const clientesRoutes = require("./routes/clientes");
const servicosRoutes = require("./routes/servicos");
const fotosRoutes = require("./routes/fotos");
const cuidadosRoutes = require("./routes/cuidados");
const documentosRoutes = require("./routes/documentos");
const dashboardRoutes = require("./routes/dashboard");
const avaliacoesRoutes = require("./routes/avaliacoes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { sanitizeInput } = require("./middleware/sanitize");
const { loginLimiter } = require("./middleware/rateLimiter");

const app = express();
const PORT = process.env.PORT || 3001;

// Atrás de um proxy (ex.: Render), TRUST_PROXY=1 faz req.ip ser o IP real do visitante,
// necessário para o limite de envios por IP funcionar.
if (process.env.TRUST_PROXY) {
  const trustProxy = Number(process.env.TRUST_PROXY);
  app.set("trust proxy", Number.isNaN(trustProxy) ? process.env.TRUST_PROXY : trustProxy);
}

// CORS_ORIGIN aceita várias origens separadas por vírgula (ex.: site publicado + localhost).
const corsOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORP "cross-origin" permite que o Portal (outra origem) carregue as imagens de /uploads.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({ origin: corsOrigins.includes("*") ? "*" : corsOrigins }));
app.use(express.json({ limit: "20kb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(sanitizeInput);

app.use("/api", healthRoutes);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/servicos", servicosRoutes);
app.use("/api/fotos", fotosRoutes);
app.use("/api/proximos-cuidados", cuidadosRoutes);
app.use("/api/documentos", documentosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/avaliacoes", avaliacoesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
