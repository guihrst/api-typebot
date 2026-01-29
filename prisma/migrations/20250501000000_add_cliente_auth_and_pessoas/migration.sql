-- Migration: Adicionar autenticação de cliente e tabela de pessoas (CPF/CNPJ)

-- Adicionar campos de autenticação na tabela empresas
ALTER TABLE "empresas" ADD COLUMN "email_cliente" TEXT;
ALTER TABLE "empresas" ADD COLUMN "senha_cliente" TEXT;

-- Criar índice único para email_cliente
CREATE UNIQUE INDEX "empresas_email_cliente_key" ON "empresas"("email_cliente");

-- Criar tabela de pessoas (CPF/CNPJ) - substitui o Excel
CREATE TABLE "empresas_pessoas" (
    "id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "empresas_pessoas_pkey" PRIMARY KEY ("id")
);

-- Criar índice único para CPF/CNPJ por empresa
CREATE UNIQUE INDEX "empresas_pessoas_empresa_id_cpf_cnpj_key" ON "empresas_pessoas"("empresa_id", "cpf_cnpj");

-- Criar índice para busca rápida
CREATE INDEX "empresas_pessoas_empresa_id_cpf_cnpj_idx" ON "empresas_pessoas"("empresa_id", "cpf_cnpj");

-- Adicionar chave estrangeira
ALTER TABLE "empresas_pessoas" ADD CONSTRAINT "empresas_pessoas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
