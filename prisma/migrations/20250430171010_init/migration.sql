-- CreateTable
CREATE TABLE "empresas" (
    "id" SERIAL NOT NULL,
    "cnpj" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "colunas_tabela_dados" JSONB NOT NULL DEFAULT '[]',
    "token" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas_arquivos" (
    "id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "empresas_arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas_dados" (
    "id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "dados" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_dados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- AddForeignKey
ALTER TABLE "empresas_arquivos" ADD CONSTRAINT "empresas_arquivos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas_dados" ADD CONSTRAINT "empresas_dados_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- INSERT TABELAS
INSERT INTO empresas (
  cnpj,
  nome,
  nome_fantasia,
  colunas_tabela_dados
) VALUES (
  '039410520001501',
  'ALIBEM ALIMENTOS S.A.',
  'ALIBEM ALIMENTOS S.A.',
  '[{"name": "nome", "label": "Nome", "required": true}, {"name": "cpf", "label": "CPF", "required": true}, {"name": "lote", "label": "Lote", "required": false}, {"name": "tipo_granja", "label": "Tipo da granja", "required": false}, {"name": "tipo_racao", "label": "Tipo da ração", "required": false}, {"name": "quantidade_racao", "label": "Quantidade de ração", "required": false}, {"name": "peso_medio", "label": "Peso médio", "required": false}, {"name": "causa_morte", "label": "Causa da morte", "required": false}, {"name": "mortalidade", "label": "Mortalidade", "required": false}, {"name": "quantidade_mortalidade", "label": "Quantidade de mortalidade", "required": false}]'
);
