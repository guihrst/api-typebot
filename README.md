# API Typebot - Portal do Cliente

Sistema de gestão de CPF/CNPJ para clientes, integrado ao Typebot.

---

## 🚀 Instalação Rápida (Docker)

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/api-typebot.git
cd api-typebot
```

### 2. Configure o ambiente

```bash
cp env.example .env
nano .env
```

Edite o arquivo `.env` e preencha:
- Suas chaves do **Clerk** (pegue em https://clerk.com)
- Uma **JWT_SECRET** segura

### 3. Suba os containers

```bash
docker compose up -d
```

### 4. Pronto! 🎉

Acesse: `http://SEU_IP:5000`

- Portal Admin: `/sign-in` (login Clerk)
- Portal Cliente: `/cliente/login`

---

## 📋 Comandos Úteis

```bash
# Ver logs
docker compose logs -f app

# Reiniciar
docker compose restart app

# Parar tudo
docker compose down

# Rebuild após mudanças
docker compose up -d --build
```

---

## 👤 Criar Acesso do Cliente

```bash
docker compose exec app npx ts-node scripts/criar-acesso-cliente.ts 1 email@cliente.com senha123
```

Ou use o script auxiliar:
```bash
chmod +x comandos.sh
./comandos.sh criar-acesso 1 email@cliente.com senha123
```

---

## 📥 Migrar Dados do Excel

1. Copie o Excel para o container:
```bash
docker cp clientes.xlsx api-typebot-app:/app/clientes.xlsx
```

2. Execute a migração:
```bash
docker compose exec app npx ts-node scripts/migrar-excel.ts 1 /app/clientes.xlsx
```

---

## 🔌 APIs para Typebot

### Consultar CPF/CNPJ

```http
GET /api/empresas/consulta-cpf?cpf=12345678901
Authorization: TOKEN_DA_EMPRESA
```

**Resposta:**
```json
{
  "found": true,
  "cpf": "123.456.789-01",
  "nome": "João Silva"
}
```

### Enviar Dados

```http
POST /api/empresas/envio-dados
Authorization: TOKEN_DA_EMPRESA
Content-Type: application/json

{
  "nome": "João Silva",
  "cpf": "12345678901"
}
```

---

## 🔐 Portas

| Serviço | Porta |
|---------|-------|
| Aplicação | 5000 |
| PostgreSQL | 5433 |

---

## 🐛 Problemas Comuns

### Container não inicia
```bash
docker compose logs app
```

### Erro de conexão com banco
```bash
docker compose restart postgres
docker compose restart app
```

### Rebuild completo
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 📁 Estrutura

```
/cliente/login      → Login do cliente
/cliente/dashboard  → Gerenciar CPFs/CNPJs
/list               → Dashboard admin (Clerk)
/sign-in            → Login admin
```
