# API Typebot - Sistema de Gestão de Dados

Sistema de gestão de dados para empresas integrado ao Typebot, com portal de autogestão para clientes.

## 📋 Funcionalidades

### Para Administradores (Clerk)
- Dashboard para visualização de dados coletados
- Filtros por nome, CPF e período
- Exportação para Excel

### Para Clientes (Portal de Autogestão)
- Login com email e senha
- Cadastro de CPFs/CNPJs
- Edição e exclusão de cadastros
- Ativação/desativação de registros

### APIs para Typebot
- `/api/empresas/consulta-cpf` - Consulta se CPF/CNPJ está cadastrado
- `/api/empresas/envio-dados` - Recebe dados coletados pelo chatbot

---

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- Yarn ou NPM

### 1. Clonar e instalar dependências

```bash
git clone <repositorio>
cd api-typebot
yarn install
```

### 2. Configurar variáveis de ambiente

```bash
cp env.example .env
```

Edite o arquivo `.env`:

```env
# Clerk (admin)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxxxx
CLERK_SECRET_KEY=sk_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/api_typebot

# IMPORTANTE: Gere uma chave segura para produção!
JWT_SECRET=sua-chave-secreta-muito-segura-aqui
```

### 3. Executar migrations do banco

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Iniciar aplicação

```bash
# Desenvolvimento
yarn dev

# Produção
yarn build
yarn start
```

A aplicação estará disponível em `http://localhost:5000`.

---

## 👤 Configurar Acesso do Cliente

Para criar um acesso para o cliente gerenciar seus CPFs/CNPJs:

```bash
npx ts-node scripts/criar-acesso-cliente.ts <empresa_id> <email> <senha>
```

**Exemplo:**
```bash
npx ts-node scripts/criar-acesso-cliente.ts 1 cliente@empresa.com senhaSegura123
```

O cliente poderá acessar: `https://seu-dominio.com/cliente/login`

---

## 📥 Migrar Dados do Excel

Para importar CPFs/CNPJs de um arquivo Excel existente:

```bash
npx ts-node scripts/migrar-excel.ts <empresa_id> <caminho_do_excel>
```

**Exemplo:**
```bash
npx ts-node scripts/migrar-excel.ts 1 dados_clientes.xlsx
```

**Formato do Excel:**
| CPF | NOME |
|-----|------|
| 12345678901 | João Silva |
| 00012345678901 | Maria Santos |

> O script aceita CPF ou CNPJ, valida os dígitos verificadores e ignora duplicados.

---

## 🔌 APIs

### Consulta CPF/CNPJ

Verifica se um CPF/CNPJ está cadastrado para a empresa.

```http
GET /api/empresas/consulta-cpf?cpf=12345678901
Authorization: <token-da-empresa>
```

**Resposta de sucesso (200):**
```json
{
  "found": true,
  "cpf": "123.456.789-01",
  "nome": "João Silva"
}
```

**Resposta não encontrado (404):**
```json
{
  "found": false,
  "error": "Person not found"
}
```

### Envio de Dados

Recebe dados coletados pelo Typebot.

```http
POST /api/empresas/envio-dados
Authorization: <token-da-empresa>
Content-Type: application/json

{
  "nome": "João Silva",
  "cpf": "12345678901",
  "campo_customizado": "valor"
}
```

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── cliente/           # APIs do portal do cliente
│   │   │   ├── auth/          # Login, logout, verificação
│   │   │   └── pessoas/       # CRUD de CPFs/CNPJs
│   │   └── empresas/          # APIs para Typebot
│   │       ├── consulta-cpf/  # Consulta CPF/CNPJ
│   │       ├── envio-dados/   # Recebe dados
│   │       └── filtragem/     # Listagem (admin)
│   ├── cliente/               # Páginas do portal do cliente
│   │   ├── login/
│   │   └── dashboard/
│   ├── list/                  # Dashboard admin
│   └── sign-in/               # Login admin (Clerk)
├── lib/
│   ├── prisma.ts              # Cliente Prisma
│   ├── auth-cliente.ts        # Helpers de autenticação
│   └── utils.ts               # Utilitários
└── middleware.ts              # Proteção de rotas

scripts/
├── criar-acesso-cliente.ts    # Criar login do cliente
└── migrar-excel.ts            # Importar dados do Excel

prisma/
├── schema.prisma              # Modelo do banco
└── migrations/                # Histórico de migrations
```

---

## 🗄️ Modelo do Banco de Dados

```
empresas
├── id
├── cnpj
├── nome
├── nome_fantasia
├── colunas_tabela_dados (JSON)
├── token (UUID) ─────────────────> Autenticação API Typebot
├── email_cliente ────────────────> Login portal cliente
├── senha_cliente (hash bcrypt)
├── created_at
└── updated_at

empresas_pessoas (NOVO!)
├── id
├── empresa_id ───────────────────> FK empresas
├── cpf_cnpj (string) ────────────> Somente números
├── nome
├── ativo (boolean)
├── created_at
└── updated_at
```

---

## 🔐 Segurança

- **Admin (Clerk):** Autenticação OAuth via Clerk
- **Cliente:** JWT com cookie httpOnly
- **API Typebot:** Token UUID por empresa
- **Senhas:** Hash bcrypt com salt

---

## 📝 Changelog

### v2.0.0 - Portal do Cliente
- ✅ Nova tabela `empresas_pessoas` para substituir Excel
- ✅ Portal de login do cliente
- ✅ CRUD de CPFs/CNPJs pelo cliente
- ✅ Validação de CPF e CNPJ
- ✅ Máscara de formatação no frontend
- ✅ API `/consulta-cpf` agora usa banco (mais rápido!)
- ✅ Script de migração de dados do Excel
- ✅ Script para criar acesso do cliente

---

## 🆘 Suporte

Em caso de dúvidas ou problemas, verifique:

1. As variáveis de ambiente estão corretas?
2. O banco de dados está acessível?
3. As migrations foram executadas?
4. A chave JWT_SECRET foi definida?

---

## 📄 Licença

Projeto privado.
