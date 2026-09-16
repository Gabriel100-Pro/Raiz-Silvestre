# ✅ Testing & Validation Checklist

Use este checklist para validar que tudo está funcionando corretamente.

## 🔧 Setup & Configuration

- [ ] PostgreSQL está instalado e rodando
- [ ] Banco de dados `raiz_silvestre` foi criado
- [ ] `schema.sql` foi executado sem erros
- [ ] `seed.sql` foi executado com dados de teste
- [ ] `.env` foi criado e configurado com:
  - [ ] `DATABASE_URL` correto
  - [ ] `JWT_SECRET` definido
  - [ ] `CORS_ORIGIN` configurado
  - [ ] `NODE_ENV=development`
- [ ] `npm install` foi executado no backend/
- [ ] Backend está rodando com `npm run dev`
- [ ] Frontend é servido em `http://localhost:5500`

## 🧪 API - Health & Login

### Health Check
```bash
curl http://localhost:3001/api/health
```
- [ ] Retorna `{"status":"ok"}` (200)

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cpf":"52998224725"}'
```
- [ ] Retorna token JWT
- [ ] Retorna dados do cliente
- [ ] Token começa com 3 partes separadas por pontos

## 📊 API - Endpoints de Dados

Use o token obtido no login para:

### GET /api/clientes/me
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/clientes/me
```
- [ ] Retorna dados do cliente (nome, CPF mascarado, telefone, endereço)
- [ ] Inclui resumoJardim com estatísticas
- [ ] Inclui historicoRecente com serviços

### GET /api/clientes/1/registro ⭐ PRINCIPAL
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/clientes/1/registro
```
- [ ] Retorna cliente com dados completos
- [ ] Inclui array de jardins
- [ ] Inclui array de serviços com fotos
- [ ] Inclui observações para cada serviço
- [ ] Inclui array de proximosCuidados
- [ ] Inclui estatísticas calculadas
- [ ] Status 200

### GET /api/servicos
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/servicos
```
- [ ] Retorna array de serviços
- [ ] Cada serviço tem fotos agregadas

### GET /api/clientes/1
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/clientes/1
```
- [ ] Retorna dados do cliente
- [ ] CPF está mascarado (XXX.***.***-XX)
- [ ] Tem email, telefone, endereço

### GET /api/proximos-cuidados/clientes/1
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/proximos-cuidados/clientes/1
```
- [ ] Retorna array de próximos cuidados
- [ ] Cada item tem titulo, descricao, dataPrevista, status
- [ ] Status 200

## 🖼️ API - Fotos

### POST /api/fotos/servicos/1 (Upload)
```bash
curl -X POST http://localhost:3001/api/fotos/servicos/1 \
  -H "Authorization: Bearer <token>" \
  -F "foto=@/path/to/image.jpg" \
  -F "tipo=antes" \
  -F "descricao=Test photo"
```
- [ ] Status 201
- [ ] Retorna ID da foto
- [ ] URL foi gerada
- [ ] Arquivo foi salvo em /uploads

### GET /api/fotos/servicos/1
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/fotos/servicos/1
```
- [ ] Retorna objeto com chaves: antes, depois, geral
- [ ] Cada chave é um array de fotos
- [ ] Fotos têm id, tipo, url, descricao

### DELETE /api/fotos/1
```bash
curl -X DELETE -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/fotos/1
```
- [ ] Status 200
- [ ] Retorna mensagem de sucesso
- [ ] Arquivo foi removido de /uploads

## 🌐 Frontend - Login

### Acessar página de login
1. [ ] Abrir `http://localhost:5500/registro.html`
2. [ ] Ver botão "Entrar no Portal"
3. [ ] Clicar em "Entrar no Portal"
4. [ ] Ir para `portal/login/index.html`
5. [ ] Ver formulário com campo de CPF

### Fazer Login
1. [ ] Digitar CPF: 529.982.247-25
2. [ ] Campo formata automaticamente: 529.982.247-25
3. [ ] Clicar em "Entrar"
4. [ ] Ver loader enquanto carrega
5. [ ] Ser redirecionado para dashboard
6. [ ] Ver saudação "Bem-vindo, João"

## 📈 Frontend - Dashboard

### Carregamento
- [ ] Dashboard carrega automaticamente
- [ ] Skeletons aparecem durante carregamento
- [ ] Dados aparecem após 1-2 segundos
- [ ] Nenhum erro no console (F12)

### Dados Pessoais
- [ ] Nome está preenchido
- [ ] CPF está mascarado (529.***.***-25)
- [ ] Email está preenchido
- [ ] Telefone está preenchido
- [ ] Endereço está preenchido

### Resumo do Jardim
- [ ] "Início do atendimento" mostra data
- [ ] "Visitas realizadas" mostra número
- [ ] "Última manutenção" mostra data
- [ ] "Próxima visita" mostra data

### Histórico Recente
- [ ] Tabela mostra serviços
- [ ] Cada linha tem: data, serviço, descrição, responsável, valor
- [ ] Link "Ver histórico completo" funciona

### Próximos Cuidados
- [ ] Cards aparecem abaixo do histórico
- [ ] Cada card mostra: titulo, descricao, dataPrevista, status
- [ ] Status tem cor apropriada (pendente=amarelo, concluído=verde)
- [ ] Pelo menos 1 card de cuidado aparece

## 🔒 Segurança

### Rate Limiting
- [ ] Fazer 10+ logins falhando com CPF incorreto
- [ ] Tentativa 11 retorna erro 429 (too many requests)
- [ ] Aguardar 15 minutos antes de nova tentativa

### Validação de CPF
- [ ] CPF inválido (ex: 11111111111) retorna erro
- [ ] CPF com formato incorreto é aceito e normalizado
- [ ] CPF válido mas inexistente retorna 404

### CORS
- [ ] Requisição do frontend funciona
- [ ] Headers de CORS estão corretos
- [ ] Originário de http://localhost:5500 é permitido

### JWT
- [ ] Token JWT tem 3 partes (header.payload.signature)
- [ ] Token expira em 7 dias
- [ ] Token inválido retorna 401
- [ ] Token expirado redireciona para login

## 🗄️ Banco de Dados

### Tabelas
```sql
psql -U postgres -d raiz_silvestre
```
- [ ] `\dt` mostra 6 tabelas:
  - [ ] clientes
  - [ ] jardins
  - [ ] servicos
  - [ ] fotos_servico
  - [ ] observacoes
  - [ ] proximos_cuidados

### Dados de Teste
```sql
SELECT COUNT(*) FROM clientes;       -- Deve retornar 1+
SELECT COUNT(*) FROM servicos;       -- Deve retornar 4+
SELECT COUNT(*) FROM proximos_cuidados; -- Deve retornar 3+
SELECT COUNT(*) FROM observacoes;    -- Deve retornar 2+
```

### Relacionamentos
```sql
-- Verificar integridade referencial
SELECT * FROM servicos WHERE cliente_id = 1;
SELECT * FROM proximos_cuidados WHERE cliente_id = 1;
SELECT * FROM fotos_servico WHERE servico_id IN (SELECT id FROM servicos WHERE cliente_id = 1);
```
- [ ] Retorna dados conforme esperado

## 📱 Páginas do Portal

- [ ] Dashboard (`/portal/dashboard/index.html`) - OK
- [ ] Histórico (`/portal/historico/index.html`) - Testado
- [ ] Fotos (`/portal/fotos/index.html`) - Testado
- [ ] Próximas Visitas (`/portal/visitas/index.html`) - Testado
- [ ] Documentos (`/portal/documentos/index.html`) - Testado
- [ ] Meus Dados (`/portal/meus-dados/index.html`) - Testado
- [ ] Menu lateral abre/fecha - OK
- [ ] Logout funciona - OK

## 🐛 Erro Handling

### 404 Not Found
- [ ] Acessar `/api/clientes/999` com token retorna 404
- [ ] Mensagem de erro é clara

### 401 Unauthorized
- [ ] Acessar sem token retorna 401
- [ ] Token inválido retorna 401
- [ ] Redireciona para login automaticamente

### 400 Bad Request
- [ ] CPF inválido retorna 400
- [ ] Email inválido retorna 400
- [ ] Campos obrigatórios vazios retornam 400

### 500 Internal Server Error
- [ ] Erros de banco retornam 500
- [ ] Mensagem genérica é retornada (sem detalhes internos)

## 📝 Logs

### Backend Console
```bash
npm run dev
```
- [ ] Mostra "Servidor rodando na porta 3001"
- [ ] Cada requisição mostra método, rota, status
- [ ] Erros aparecem com stack trace

### Browser Console (F12)
- [ ] Não há erros JavaScript
- [ ] Não há erros de CORS
- [ ] Requisições API aparecem na aba Network

## ✨ Performance

- [ ] Dashboard carrega em < 2 segundos
- [ ] Imagens carregam rapidamente
- [ ] Scroll é suave
- [ ] Nenhum layout shift

## 🎯 Final Verification

- [ ] Todos os endpoints retornam dados esperados
- [ ] Frontend exibe dados corretamente
- [ ] Nenhuma requisição falha
- [ ] Token funciona em todas as páginas
- [ ] Logout limpa dados
- [ ] Login novamente funciona
- [ ] Upload de foto funciona (opcional)
- [ ] Banco de dados está íntegro

---

## 📊 Resultado

Quando todos os itens estiverem marcados ✅:

**Sistema está 100% funcional e pronto para uso!** 🎉

---

## 🆘 Se algo falhar

1. **Verificar logs no terminal backend**
2. **Abrir console do navegador (F12)**
3. **Consultar troubleshooting em QUICKSTART.md**
4. **Verificar variáveis de ambiente em .env**
5. **Confirmar que banco está rodando**
6. **Testar endpoints com curl primeiro**

---

*Tempo estimado de testes: 15-20 minutos*

Última atualização: 31/08/2026
