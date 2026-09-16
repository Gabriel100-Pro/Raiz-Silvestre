# Raiz Silvestre - Portal do Cliente Backend

API REST para o Portal do Cliente da Raiz Silvestre. Sistema de gestão de clientes, serviços de jardinagem e histórico de manutenção.

## 📋 Tabela de Conteúdos

- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Inicialização](#inicialização)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Autenticação](#autenticação)
- [API Endpoints](#api-endpoints)
- [Upload de Imagens](#upload-de-imagens)
- [Tratamento de Erros](#tratamento-de-erros)
- [Segurança](#segurança)

## 🔧 Requisitos

- **Node.js**: v18.0.0 ou superior
- **PostgreSQL**: v12 ou superior
- **npm**: v9.0.0 ou superior

## 📦 Instalação

### 1. Clonar o repositório

```bash
cd backend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e preencha com seus valores:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as configurações adequadas:

```env
# Porta em que a API Express será servida
PORT=3001

# String de conexão do PostgreSQL
DATABASE_URL=postgresql://usuario:senha@localhost:5432/raiz_silvestre

# Segredo JWT (gere um valor forte em produção)
JWT_SECRET=seu_segredo_super_secreto_aqui

# Origem permitida pelo CORS
CORS_ORIGIN=http://localhost:5500

# Ambiente de execução
NODE_ENV=development
```

### 4. Criar banco de dados

```bash
# Acesse o PostgreSQL
psql -U postgres

# Crie o banco de dados
CREATE DATABASE raiz_silvestre;

# Saia do psql
\q
```

### 5. Executar migrations (schema.sql)

```bash
psql -U usuario -d raiz_silvestre -f src/db/schema.sql
```

Ou você pode executar o arquivo SQL através de um cliente PostgreSQL (pgAdmin, DBeaver, etc).

### 6. Seed de dados (opcional)

Se desejar adicionar dados de teste, execute:

```bash
psql -U usuario -d raiz_silvestre -f src/db/seed.sql
```

## 🚀 Inicialização

### Modo Desenvolvimento (com auto-reload)

```bash
npm run dev
```

A API estará disponível em: `http://localhost:3001`

### Modo Produção

```bash
npm start
```

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/          # Lógica de controle dos endpoints
│   │   ├── clienteController.js
│   │   ├── servicoController.js
│   │   ├── fotoController.js
│   │   ├── cuidadoController.js
│   │   └── registroController.js
│   ├── services/             # Lógica de negócio
│   │   └── registroService.js
│   ├── routes/               # Definição das rotas da API
│   │   ├── auth.js
│   │   ├── clientes.js
│   │   ├── servicos.js
│   │   ├── fotos.js
│   │   ├── cuidados.js
│   │   ├── documentos.js
│   │   ├── dashboard.js
│   │   └── health.js
│   ├── middleware/           # Middlewares Express
│   │   ├── auth.js           # Autenticação JWT
│   │   ├── errorHandler.js   # Tratamento de erros
│   │   ├── sanitize.js       # Sanitização de entrada
│   │   ├── rateLimiter.js    # Rate limiting
│   │   └── validators.js     # Validação de dados
│   ├── db/                   # Banco de dados
│   │   ├── schema.sql        # Schema do banco
│   │   ├── seed.sql          # Dados de teste
│   │   └── db.js             # Configuração PostgreSQL
│   ├── utils/                # Utilitários
│   │   ├── cpf.js            # Validação de CPF
│   │   ├── format.js         # Formatação de dados
│   │   └── dashboardData.js  # Agregação de dados dashboard
│   ├── server.js             # Configuração da aplicação
│   └── config/               # Configurações gerais
├── uploads/                  # Diretório para armazenamento de imagens
├── .env.example              # Exemplo de variáveis de ambiente
├── package.json
└── README.md
```

## 🔐 Autenticação

O sistema utiliza **JWT (JSON Web Tokens)** para autenticação.

### Fluxo de Login

1. Cliente acessa `/registro`
2. Digita seu CPF
3. Frontend envia POST para `/api/auth/login` com o CPF
4. Backend valida o CPF e retorna um token JWT
5. Frontend armazena o token em `localStorage`
6. Todas as requisições subsequentes incluem o token no header `Authorization: Bearer <token>`

### Exemplo de Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901"
  }'
```

**Resposta:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "cliente": {
    "id": 1,
    "nome": "João Silva"
  }
}
```

## 📡 API Endpoints

### Autenticação

#### POST `/api/auth/login`
Realiza login via CPF.

**Request:**
```json
{
  "cpf": "123.456.789-10"
}
```

**Response (200):**
```json
{
  "token": "string",
  "cliente": {
    "id": 1,
    "nome": "string"
  }
}
```

**Erros:**
- `400`: CPF inválido
- `404`: Cliente não encontrado
- `429`: Muitas tentativas (rate limited)

---

### Clientes

#### GET `/api/clientes/me`
Retorna dados do cliente autenticado (dashboard simplificado).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "nome": "string",
  "cpfMascarado": "123.***.***-45",
  "telefone": "string",
  "endereco": "string",
  "resumoJardim": {
    "inicioAtendimento": "2023-01-15",
    "visitasRealizadas": 5,
    "ultimaManutencao": "2024-01-20",
    "proximaVisita": "2024-02-10"
  },
  "historicoRecente": [...]
}
```

#### GET `/api/clientes/:id`
Retorna dados de um cliente específico.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "nome": "string",
  "cpf": "123.***.***-45",
  "email": "cliente@example.com",
  "telefone": "string",
  "endereco": "string",
  "criadoEm": "2023-01-15T10:30:00Z"
}
```

#### GET `/api/clientes/:clienteId/registro`
Retorna registro COMPLETO do cliente com todos os dados.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "cliente": {
    "id": 1,
    "nome": "string",
    "cpf": "123.***.***-45",
    "email": "string",
    "telefone": "string",
    "endereco": "string",
    "criadoEm": "2023-01-15T10:30:00Z"
  },
  "jardins": [
    {
      "id": 1,
      "areaMeter2": 50.00,
      "tipo": "Jardim Residencial",
      "dataInicio": "2023-01-15",
      "observacoes": "text",
      "criadoEm": "2023-01-15T10:30:00Z"
    }
  ],
  "servicos": [
    {
      "id": 1,
      "tipo": "Manutenção",
      "descricao": "string",
      "dataServico": "2024-01-20",
      "responsavel": "João",
      "valor": 150.00,
      "status": "concluido",
      "fotos": [
        {
          "id": 1,
          "tipo": "antes",
          "url": "/uploads/...",
          "descricao": "string"
        }
      ],
      "observacoes": [
        {
          "id": 1,
          "titulo": "string",
          "descricao": "string",
          "criadoEm": "2024-01-20T10:30:00Z"
        }
      ]
    }
  ],
  "proximosCuidados": [
    {
      "id": 1,
      "titulo": "string",
      "descricao": "string",
      "dataPrevista": "2024-02-15",
      "status": "pendente",
      "criadoEm": "2024-01-20T10:30:00Z"
    }
  ],
  "estatisticas": {
    "totalServicos": 5,
    "ultimaVisita": "2024-01-20",
    "proximaManutencao": "2024-02-10",
    "valorTotalServicos": 750.00
  }
}
```

---

### Serviços

#### GET `/api/servicos`
Retorna todos os serviços do cliente autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "servicos": [
    {
      "id": 1,
      "tipo": "Manutenção",
      "descricao": "string",
      "dataServico": "2024-01-20",
      "responsavel": "João",
      "valor": 150.00,
      "status": "concluido",
      "fotos": [...]
    }
  ]
}
```

#### GET `/api/servicos/:id`
Retorna um serviço específico com fotos e observações.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "tipo": "Manutenção",
  "descricao": "string",
  "dataServico": "2024-01-20",
  "responsavel": "João",
  "valor": 150.00,
  "status": "concluido",
  "fotos": [...],
  "observacoes": [...]
}
```

---

### Fotos

#### POST `/api/fotos/servicos/:servicoId`
Upload de uma foto para um serviço.

**Headers:** `Authorization: Bearer <token>` e `Content-Type: multipart/form-data`

**Form Data:**
- `foto` (file, required): Arquivo de imagem (JPEG, PNG, WebP)
- `tipo` (string, required): `antes`, `depois` ou `geral`
- `descricao` (string, optional): Descrição da foto

**Response (201):**
```json
{
  "message": "Foto enviada com sucesso.",
  "foto": {
    "id": 1,
    "tipo": "antes",
    "url": "/uploads/...",
    "descricao": "string"
  }
}
```

#### GET `/api/fotos/servicos/:servicoId`
Obter fotos de um serviço agrupadas por tipo.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "antes": [
    {
      "id": 1,
      "tipo": "antes",
      "url": "/uploads/...",
      "descricao": "string"
    }
  ],
  "depois": [...],
  "geral": [...]
}
```

#### DELETE `/api/fotos/:fotoId`
Deletar uma foto.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Foto removida com sucesso."
}
```

---

### Próximos Cuidados

#### GET `/api/proximos-cuidados/clientes/:clienteId`
Obter próximos cuidados de um cliente.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "proximosCuidados": [
    {
      "id": 1,
      "titulo": "Poda de inverno",
      "descricao": "string",
      "dataPrevista": "2024-02-15",
      "status": "pendente",
      "criadoEm": "2024-01-20T10:30:00Z"
    }
  ]
}
```

#### GET `/api/proximos-cuidados/:id`
Obter um próximo cuidado específico.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "titulo": "string",
  "descricao": "string",
  "dataPrevista": "2024-02-15",
  "status": "pendente",
  "criadoEm": "2024-01-20T10:30:00Z"
}
```

---

### Health Check

#### GET `/api/health`
Verifica se a API está funcionando.

**Response (200):**
```json
{
  "status": "ok"
}
```

---

## 📤 Upload de Imagens

### Fluxo de Upload

1. Cliente seleciona imagem no frontend
2. Frontend envia POST para `/api/fotos/servicos/:servicoId` com:
   - Arquivo de imagem
   - Tipo (antes, depois, geral)
   - Descrição (opcional)
3. Backend valida o arquivo
4. Backend salva localmente em `/uploads`
5. Backend retorna URL da imagem
6. Frontend pode exibir imagem usando a URL

### Validações

- **Tipos Aceitos**: JPEG, PNG, WebP
- **Tamanho Máximo**: 5MB
- **Dimensões**: Qualquer (recomendado: até 4000x3000px)

### Exemplo de Upload com cURL

```bash
curl -X POST http://localhost:3001/api/fotos/servicos/1 \
  -H "Authorization: Bearer <token>" \
  -F "foto=@/caminho/para/imagem.jpg" \
  -F "tipo=antes" \
  -F "descricao=Jardim antes da manutenção"
```

### Armazenamento em Produção

Atualmente, as imagens são armazenadas localmente em `/uploads`. Para produção, considere integrar com:

- **Cloudinary**: Cloud storage com otimização de imagens
- **Supabase Storage**: Integrado com PostgreSQL
- **AWS S3**: Armazenamento escalável
- **Azure Blob Storage**: Integração com Azure

Para integrar, modifique o `fotoController.js` para fazer upload para o serviço escolhido.

---

## ⚠️ Tratamento de Erros

A API retorna respostas padronizadas de erro:

```json
{
  "message": "Descrição do erro"
}
```

### Status HTTP

- `200`: OK
- `201`: Criado com sucesso
- `400`: Requisição inválida (validação)
- `401`: Não autenticado
- `403`: Não autorizado
- `404`: Recurso não encontrado
- `429`: Muitas requisições (rate limited)
- `500`: Erro interno do servidor

### Exemplos de Erros

**CPF inválido (400):**
```json
{
  "message": "CPF inválido."
}
```

**Token expirado (401):**
```json
{
  "message": "Token inválido ou expirado."
}
```

**Acesso não autorizado (403):**
```json
{
  "message": "Acesso não autorizado."
}
```

**Rate limit (429):**
```json
{
  "message": "Muitas tentativas de login. Tente novamente em alguns minutos."
}
```

---

## 🔒 Segurança

### Boas Práticas Implementadas

1. **JWT**: Tokens com expiração de 7 dias
2. **Rate Limiting**: Máximo 10 tentativas de login em 15 minutos
3. **CORS**: Configurado para aceitar apenas origens permitidas
4. **Helmet**: Headers de segurança HTTP
5. **Input Sanitization**: Remoção de caracteres de controle
6. **Password Hashing**: bcryptjs para senhas (quando aplicável)
7. **SQL Injection Prevention**: Prepared statements com pg
8. **HTTPS**: Recomendado em produção

### Variáveis de Ambiente

Nunca expose no repositório:
- `JWT_SECRET`
- `DATABASE_URL`
- Credenciais de acesso

Sempre use arquivo `.env` e adicione-o ao `.gitignore`.

### CORS Configuration

Edite `server.js` para configurar CORS adequadamente:

```javascript
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || "http://localhost:5500",
  credentials: true 
}));
```

---

## 📝 Scripts Úteis

### Verificar saúde da API

```bash
curl http://localhost:3001/api/health
```

### Testar login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cpf": "12345678901"}'
```

### Listar serviços (com autenticação)

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/servicos
```

---

## 🐛 Troubleshooting

### Erro: "Database connection refused"

Verifique se:
- PostgreSQL está rodando
- `DATABASE_URL` está correto
- Credenciais são válidas

### Erro: "Cannot find module 'multer'"

Execute:
```bash
npm install multer
```

### Erro: "Rate limited"

Aguarde 15 minutos ou altere o valor em `middleware/rateLimiter.js`.

### Erro: "CORS policy blocked"

Verifique se `CORS_ORIGIN` está configurado corretamente no `.env`.

---

## 📚 Referências

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Documentation](https://jwt.io/)
- [Multer Documentation](https://github.com/expressjs/multer)

---

## 📄 Licença

© 2024 Raiz Silvestre. Todos os direitos reservados.
