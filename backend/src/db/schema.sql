-- Schema completo do Portal do Cliente — Raiz Silvestre
-- Execute este arquivo uma única vez em um banco PostgreSQL vazio.

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  email VARCHAR(150),
  telefone VARCHAR(20),
  endereco VARCHAR(255),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes (cpf);

CREATE TABLE IF NOT EXISTS jardins (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  area_m2 NUMERIC(10,2),
  tipo VARCHAR(100),
  data_inicio DATE NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jardins_cliente ON jardins (cliente_id);

CREATE TABLE IF NOT EXISTS servicos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo VARCHAR(150) NOT NULL,
  descricao TEXT,
  data_servico DATE NOT NULL,
  responsavel VARCHAR(150),
  status VARCHAR(20) NOT NULL DEFAULT 'agendado', -- agendado | andamento | concluido
  valor NUMERIC(10,2),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicos_cliente ON servicos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_servicos_data ON servicos (data_servico);

CREATE TABLE IF NOT EXISTS fotos_servico (
  id SERIAL PRIMARY KEY,
  servico_id INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL, -- 'antes' | 'depois' | 'geral'
  url TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fotos_servico_servico ON fotos_servico (servico_id);

CREATE TABLE IF NOT EXISTS observacoes (
  id SERIAL PRIMARY KEY,
  servico_id INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  titulo VARCHAR(255),
  descricao TEXT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observacoes_servico ON observacoes (servico_id);

CREATE TABLE IF NOT EXISTS proximos_cuidados (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_prevista DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente | concluido | cancelado
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proximos_cuidados_cliente ON proximos_cuidados (cliente_id);
CREATE INDEX IF NOT EXISTS idx_proximos_cuidados_data ON proximos_cuidados (data_prevista);

-- Avaliações públicas do site (também disponível isoladamente em avaliacoes.sql)
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
