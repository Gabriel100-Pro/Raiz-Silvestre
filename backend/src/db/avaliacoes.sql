-- Avaliações públicas do site — Raiz Silvestre
-- Pode ser executado mais de uma vez (idempotente). gen_random_uuid() é nativo a partir do PostgreSQL 13.
--
-- As avaliações são enviadas por visitantes pelo formulário do site e publicadas
-- automaticamente. O formulário não comprova que o autor contratou o serviço.

CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_publico VARCHAR(60) NOT NULL
    CHECK (char_length(nome_publico) BETWEEN 2 AND 60),
  servico VARCHAR(30) NOT NULL
    CHECK (servico IN ('implantacao', 'solo', 'manutencao', 'projetos')),
  nota SMALLINT NOT NULL
    CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT NOT NULL
    CHECK (char_length(comentario) BETWEEN 10 AND 1000),
  -- Consentimento para publicar nome e comentário; só é aceito como verdadeiro.
  consentimento BOOLEAN NOT NULL
    CHECK (consentimento = TRUE),
  -- Chave enviada pelo navegador para que repetições do mesmo envio não criem duplicatas.
  idempotency_key UUID NOT NULL UNIQUE,
  -- HMAC do IP (nunca o IP puro), usado apenas para barrar envios repetidos.
  ip_hash CHAR(64),
  status VARCHAR(12) NOT NULL DEFAULT 'publicada'
    CHECK (status IN ('publicada', 'removida')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removido_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_publicadas
  ON avaliacoes (criado_em DESC)
  WHERE status = 'publicada';

CREATE INDEX IF NOT EXISTS idx_avaliacoes_ip_hash
  ON avaliacoes (ip_hash, criado_em DESC);
