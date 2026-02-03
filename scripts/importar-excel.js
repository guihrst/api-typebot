const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importar() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Uso: node scripts/importar-excel.js <empresa_id> <arquivo.xlsx>');
    console.log('Exemplo: node scripts/importar-excel.js 1 /app/dados.xlsx');
    process.exit(1);
  }

  const empresaId = parseInt(args[0]);
  const arquivo = args[1];

  console.log(`Importando para empresa ID: ${empresaId}`);
  console.log(`Arquivo: ${arquivo}`);

  // Ler Excel
  const workbook = XLSX.readFile(arquivo);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const dados = XLSX.utils.sheet_to_json(sheet);

  console.log(`Total de linhas: ${dados.length}`);

  let importados = 0;
  let duplicados = 0;
  let erros = 0;

  for (const linha of dados) {
    try {
      const nome = (linha.NOME || linha.nome || '').toString().trim();
      const cpfOriginal = (linha.CPF || linha.cpf || linha.CNPJ || linha.cnpj || '').toString();
      
      // Limpar CPF/CNPJ (remover pontos, traços, barras)
      const cpfLimpo = cpfOriginal.replace(/[^\d]/g, '');

      if (!nome || !cpfLimpo) {
        erros++;
        continue;
      }

      // Verificar se já existe
      const existente = await prisma.empresaPessoa.findFirst({
        where: { empresa_id: empresaId, cpf_cnpj: cpfLimpo }
      });

      if (existente) {
        duplicados++;
        continue;
      }

      // Inserir
      await prisma.empresaPessoa.create({
        data: {
          empresa_id: empresaId,
          cpf_cnpj: cpfLimpo,
          nome: nome,
          ativo: true
        }
      });

      importados++;
    } catch (err) {
      erros++;
    }
  }

  console.log('\n--- Resultado ---');
  console.log(`Importados: ${importados}`);
  console.log(`Duplicados: ${duplicados}`);
  console.log(`Erros: ${erros}`);

  await prisma.$disconnect();
}

importar().catch(console.error);
