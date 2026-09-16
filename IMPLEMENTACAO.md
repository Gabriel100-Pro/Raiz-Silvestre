# Raiz Silvestre - Implementação Completa do Backend

## 📊 Resumo Executivo

Foi implementado um backend completo em Node.js/Express com PostgreSQL para o sistema de Portal do Cliente "Seu Registro" da Raiz Silvestre. O sistema permite que clientes acessem seu histórico de serviços, fotos, próximos cuidados recomendados e dados pessoais, através de autenticação via CPF.

---

## ✅ O Que Foi Criado

### 1. **Banco de Dados Aprimorado**

#### Tabelas Criadas/Modificadas:

- **`clientes`** - Informações dos clientes (id, nome, cpf, email, telefone, endereco, criado_em)
- **`jardins`** - Dados dos jardins dos clientes (id, cliente_id, area_m2, tipo, data_inicio, observacoes)
- **`servicos`** - Serviços realizados (id, cliente_id, tipo, descricao, data_servico, responsavel, status, valor)
- **`fotos_servico`** ⭐ ATUALIZADA - Agora suporta 3 tipos de foto: `antes`, `depois`, `geral` (adicionado: descricao)
- **`observacoes`** ⭐ NOVA - Observações sobre serviços (id, servico_id, titulo, descricao)
- **`proximos_cuidados`** ⭐ NOVA - Próximos cuidados recomendados (id, cliente_id, titulo, descricao, data_prevista, status)

#### Schema:
`backend/src/db/schema.sql` - Completo com índices otimizados

#### Dados de Teste:
`backend/src/db/seed.sql` - Clientes e serviços de exemplo para testes

### 2. **Arquitetura de Backend MVC**

#### Controllers (Lógica de Negócio):
```
backend/src/controllers/
├── clienteController.js      - Gerenciar dados de clientes
├── servicoController.js      - Gerenciar serviços
├── fotoController.js         - Upload e gerencimento de imagens
├── cuidadoController.js      - Próximos cuidados
└── registroController.js     - Registro completo agregado
```

#### Serviços (Lógica Compartilhada):
```
backend/src/services/
└── registroService.js        - Agregação de dados para dashboard completo
```

#### Rotas da API:
```
backend/src/routes/
├── auth.js                   - Autenticação via CPF
├── clientes.js               - Endpoints de clientes
├── servicos.js               - Endpoints de serviços
├── fotos.js    ⭐ NOVO       - Upload e gerencimento de fotos
├── cuidados.js ⭐ NOVO       - Próximos cuidados
├── documentos.js             - Geração de PDFs
├── dashboard.js              - Dashboard
└── health.js                 - Health check
```

#### Middlewares:
```
backend/src/middleware/
├── auth.js                   - Autenticação JWT
├── errorHandler.js           - Tratamento de erros
├── sanitize.js               - Sanitização de entrada
├── rateLimiter.js            - Proteção contra força bruta
└── validators.js ⭐ NOVO     - Validação de dados (CPF, email, datas, etc)
```

#### Utilitários:
```
backend/src/utils/
├── cpf.js                    - Validação e formatação de CPF
├── format.js                 - Formatação de dados (datas, moeda, CPF mascarado)
└── dashboardData.js          - Agregação de dados para dashboard
```

### 3. **API REST Completa**

#### Autenticação:
- `POST /api/auth/login` - Login via CPF, retorna JWT

#### Clientes:
- `GET /api/clientes/me` - Dados do cliente autenticado (simplified)
- `GET /api/clientes/:id` - Dados de um cliente específico
- `GET /api/clientes/:clienteId/registro` ⭐ NOVO - **Registro completo com TODOS os dados**

#### Serviços:
- `GET /api/servicos` - Todos os serviços do cliente
- `GET /api/servicos/:id` - Um serviço específico com fotos e observações

#### Fotos:
- `POST /api/fotos/servicos/:servicoId` ⭐ NOVO - Upload de foto
- `GET /api/fotos/servicos/:servicoId` ⭐ NOVO - Obter fotos de um serviço
- `DELETE /api/fotos/:fotoId` ⭐ NOVO - Deletar uma foto

#### Próximos Cuidados:
- `GET /api/proximos-cuidados/clientes/:clienteId` ⭐ NOVO - Listar cuidados
- `GET /api/proximos-cuidados/:id` ⭐ NOVO - Um cuidado específico
- `POST /api/proximos-cuidados/clientes/:clienteId` ⭐ NOVO - Criar cuidado (admin)
- `PUT /api/proximos-cuidados/:id` ⭐ NOVO - Atualizar cuidado (admin)
- `DELETE /api/proximos-cuidados/:id` ⭐ NOVO - Deletar cuidado (admin)

#### Health:
- `GET /api/health` - Verifica se API está rodando

### 4. **Frontend Integrado**

#### Scripts Adicionados:
- `portal/assets/registro-api.js` ⭐ NOVO - Integração com API completa

#### HTML Atualizado:
- `portal/dashboard/index.html` ⭐ MODIFICADO - Adicionado container para próximos cuidados e email

#### CSS Adicionado:
- `portal/assets/portal.css` ⭐ MODIFICADO - Estilos para:
  - `.portal-cuidados-grid` - Grid de próximos cuidados
  - `.portal-cuidado-card` - Card de cuidado individual
  - `.portal-servico-card` - Card de serviço
  - `.portal-servico-fotos` - Grid de fotos
  - `.portal-servico-observacoes` - Seção de observações

### 5. **Configuração e Segurança**

#### Dependências Adicionadas:
- `multer@^1.4.5` - Upload de arquivos

#### Variáveis de Ambiente:
Todas em `.env.example`:
- `PORT` - Porta da API (default: 3001)
- `DATABASE_URL` - String de conexão PostgreSQL
- `JWT_SECRET` - Segredo para assinar tokens
- `CORS_ORIGIN` - Origem permitida pelo CORS
- `NODE_ENV` - Ambiente (development/production)

#### Segurança Implementada:
- ✅ JWT com expiração de 7 dias
- ✅ Rate limiting: 10 tentativas de login por 15 minutos
- ✅ Sanitização de entrada (caracteres de controle removidos)
- ✅ CORS configurável
- ✅ Helmet para headers de segurança HTTP
- ✅ Validação de dados em todos os endpoints
- ✅ Prepared statements (pg) contra SQL Injection

---

## 📁 Arquivos Criados

### Backend:

```
backend/
├── src/
│   ├── controllers/
│   │   ├── clienteController.js           ⭐ NOVO
│   │   ├── servicoController.js           ⭐ NOVO
│   │   ├── fotoController.js              ⭐ NOVO
│   │   ├── cuidadoController.js           ⭐ NOVO
│   │   └── registroController.js          ⭐ NOVO
│   ├── services/
│   │   └── registroService.js             ⭐ NOVO
│   ├── middleware/
│   │   └── validators.js                  ⭐ NOVO
│   ├── routes/
│   │   ├── fotos.js                       ⭐ NOVO
│   │   └── cuidados.js                    ⭐ NOVO
│   └── server.js                          ✏️ MODIFICADO
├── package.json                           ✏️ MODIFICADO (adicionado multer)
├── README.md                              ✏️ MODIFICADO (documentação completa)
└── .env.example                           ✓ OK (sem alterações necessárias)
```

### Frontend:

```
portal/
├── assets/
│   ├── registro-api.js                    ⭐ NOVO
│   └── portal.css                         ✏️ MODIFICADO (estilos novos)
└── dashboard/
    └── index.html                         ✏️ MODIFICADO (container novo)
```

### Banco de Dados:

```
backend/src/db/
├── schema.sql                             ✏️ MODIFICADO (novo tables)
└── seed.sql                               ✏️ MODIFICADO (dados de teste)
```

---

## 🚀 Como Iniciar

### 1. **Instalar Dependências**

```bash
cd backend
npm install
```

### 2. **Configurar Banco de Dados**

```bash
# Criar banco de dados PostgreSQL
createdb raiz_silvestre

# Executar schema
psql -U seu_usuario -d raiz_silvestre -f src/db/schema.sql

# Executar seed (opcional)
psql -U seu_usuario -d raiz_silvestre -f src/db/seed.sql
```

### 3. **Configurar Variáveis de Ambiente**

```bash
# Copiar exemplo
cp .env.example .env

# Editar .env com suas credenciais
# DATABASE_URL=postgresql://user:password@localhost:5432/raiz_silvestre
# JWT_SECRET=seu_secreto_bem_forte
# CORS_ORIGIN=http://localhost:5500
```

### 4. **Iniciar Backend**

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

A API estará em: `http://localhost:3001`

### 5. **Testar Endpoints**

```bash
# Health check
curl http://localhost:3001/api/health

# Login (CPF de teste: 529.982.247-25)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cpf": "52998224725"}'

# Usar o token retornado para outros endpoints:
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/clientes/me
```

---

## 📊 Fluxo de Dados

### Autenticação:

```
Cliente digita CPF
    ↓
POST /api/auth/login
    ↓
Backend valida CPF
    ↓
Retorna JWT + dados cliente
    ↓
Frontend armazena token em localStorage
    ↓
Todas as requisições usam: Authorization: Bearer <token>
```

### Carregamento do Dashboard:

```
Página carrega
    ↓
Verifica token em localStorage
    ↓
Se válido, chama GET /api/clientes/:id/registro
    ↓
Backend retorna dados completos agregados
    ↓
Frontend renderiza:
  - Dados pessoais
  - Estatísticas
  - Histórico de serviços com fotos
  - Próximos cuidados
```

### Upload de Foto:

```
Cliente seleciona arquivo
    ↓
POST /api/fotos/servicos/:servicoId
    (multipart/form-data: foto, tipo, descricao)
    ↓
Backend valida arquivo (tipo, tamanho)
    ↓
Salva em /uploads
    ↓
Retorna URL e metadados
    ↓
Frontend exibe preview da foto
```

---

## 📝 Exemplos de Respostas da API

### Login

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "cpf": "52998224725"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "cliente": {
    "id": 1,
    "nome": "João da Silva"
  }
}
```

### Registro Completo

**Request:**
```bash
GET /api/clientes/1/registro
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "cliente": {
    "id": 1,
    "nome": "João da Silva",
    "cpf": "529.***.***-25",
    "email": "joao@email.com",
    "telefone": "(11) 91234-5678",
    "endereco": "Rua das Palmeiras, 120",
    "criadoEm": "2026-03-15T10:30:00Z"
  },
  "jardins": [
    {
      "id": 1,
      "areaMeter2": 85.5,
      "tipo": "Jardim residencial",
      "dataInicio": "2026-03-15",
      "observacoes": "Gramado, canteiros e cerca viva."
    }
  ],
  "servicos": [
    {
      "id": 1,
      "tipo": "Implantação de jardim",
      "descricao": "Plantio completo...",
      "dataServico": "2026-03-15",
      "responsavel": "Juliano Silvestre",
      "valor": 3200.00,
      "status": "concluido",
      "fotos": [
        {
          "id": 1,
          "tipo": "antes",
          "url": "/uploads/...",
          "descricao": "Antes do plantio"
        },
        {
          "id": 2,
          "tipo": "depois",
          "url": "/uploads/...",
          "descricao": "Após plantio"
        }
      ],
      "observacoes": [
        {
          "id": 1,
          "titulo": "Plantio realizado com sucesso",
          "descricao": "Todas as plantas se adaptando bem..."
        }
      ]
    }
  ],
  "proximosCuidados": [
    {
      "id": 1,
      "titulo": "Aplicação de pesticida natural",
      "descricao": "Tratamento preventivo contra pragas",
      "dataPrevista": "2026-09-20",
      "status": "pendente"
    }
  ],
  "estatisticas": {
    "totalServicos": 4,
    "ultimaVisita": "2026-08-10",
    "proximaManutencao": "2026-09-05",
    "valorTotalServicos": 4450.00
  }
}
```

---

## 🔒 Segurança e Boas Práticas

### Implementado:
- ✅ Validação rigorosa de CPF (algoritmo oficial)
- ✅ Validação de email
- ✅ Sanitização de entrada
- ✅ Rate limiting em login
- ✅ JWT com expiração
- ✅ HTTPS recomendado em produção
- ✅ Helmet para headers de segurança
- ✅ CORS configurável
- ✅ Prepared statements contra SQL Injection
- ✅ Proteção de senha (bcryptjs quando necessário)

### Recomendações:
1. Usar HTTPS em produção
2. Manter JWT_SECRET seguro (32+ caracteres aleatórios)
3. Implementar 2FA para admin em produção
4. Fazer backup regular do banco de dados
5. Monitorar logs de erro em produção
6. Implementar rate limiting global em produção
7. Usar CDN para imagens em produção

---

## 🎨 Integração Frontend

### Carregamento de Dados no Dashboard:

```javascript
// Dentro do dashboard, a seguinte sequência acontece:

// 1. portal.js valida token e página
// 2. registro-api.js é carregado
// 3. Script dentro dashboard/index.html executa:
RegistroAPI.populateDashboardWithRegistro(clienteId)

// Que faz:
// - GET /api/clientes/:id/registro
// - Renderiza todos os dados
// - Remove skeletons de carregamento
```

### Funções Disponíveis no Frontend:

```javascript
// Via window.RegistroAPI:

RegistroAPI.loadRegistroCompleto(clienteId)
  → Carrega dados completos do cliente

RegistroAPI.populateDashboardWithRegistro(clienteId)
  → Carrega e renderiza no dashboard

RegistroAPI.uploadFoto(servicoId, file, tipo, descricao)
  → Upload de foto

RegistroAPI.fetchAPI(endpoint, options)
  → Wrapper para fetch com autenticação

RegistroAPI.formatDate(value)
  → Formata datas em pt-BR

RegistroAPI.formatCurrency(value)
  → Formata valores em BRL

RegistroAPI.renderServicoCard(servico)
  → Renderiza HTML de serviço

RegistroAPI.renderProximoCuidadoCard(cuidado)
  → Renderiza HTML de cuidado
```

---

## 📈 Próximas Melhorias Sugeridas

1. **Admin Dashboard**: Criar área administrativa para:
   - Cadastrar clientes
   - Registrar serviços
   - Gerenciar fotos
   - Programar próximos cuidados

2. **Integração de Armazenamento**: Integrar com:
   - Cloudinary (imagens otimizadas)
   - Supabase Storage (integrado com PostgreSQL)
   - AWS S3 (escalável)

3. **Notificações**: Implementar:
   - Email quando próxima manutenção se aproxima
   - WhatsApp via Twilio
   - Notificações push

4. **Relatórios**: Gerar:
   - Análises de gastos
   - Calendário de manutenção
   - Recomendações sazonais

5. **Mobile App**: Considerar:
   - React Native ou Flutter
   - Acesso offline com sincronização

6. **Analytics**: Integrar:
   - Google Analytics
   - Logs estruturados
   - Monitoramento de performance

---

## 📚 Referências

- [Express.js Docs](https://expressjs.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [JWT.io](https://jwt.io)
- [Multer Docs](https://github.com/expressjs/multer)
- [Node.js pg](https://node-postgres.com)

---

## 💬 Suporte

Para dúvidas ou problemas:

1. Verificar logs no terminal
2. Consultar README.md do backend
3. Testar endpoints com curl
4. Verificar variáveis de ambiente
5. Confirmar conexão com banco de dados

---

## ✨ Conclusão

O sistema foi implementado seguindo boas práticas de:
- Arquitetura MVC escalável
- Segurança em múltiplas camadas
- Validação rigorosa de dados
- Documentação completa
- Código modular e reutilizável
- Performance otimizada com índices de banco de dados

O sistema está pronto para produção com as recomendações de segurança implementadas. 🚀

---

**Versão**: 1.0.0  
**Atualizado**: 31/08/2026  
**Status**: ✅ Completo e Testado
