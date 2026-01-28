# ============================================
# Dockerfile - API Typebot com Portal Cliente
# ============================================

FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat openssl

# Copiar arquivos de dependências
COPY package.json yarn.lock ./

# Instalar dependências
RUN yarn install --frozen-lockfile

# Copiar código fonte
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

# Expor porta
EXPOSE 5000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=5000

# Comando de inicialização
CMD ["yarn", "start"]
