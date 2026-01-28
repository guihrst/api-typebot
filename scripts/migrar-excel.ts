/**
 * Script de Migração: Excel para Banco de Dados
 * 
 * Este script importa os CPFs/CNPJs de um arquivo Excel para a tabela empresas_pessoas.
 * 
 * USO:
 * 1. Coloque o arquivo Excel na mesma pasta deste script ou forneça o caminho completo
 * 2. Execute: npx ts-node scripts/migrar-excel.ts <empresa_id> <caminho_do_excel>
 * 
 * EXEMPLO:
 * npx ts-node scripts/migrar-excel.ts 1 dados.xlsx
 * 
 * O arquivo Excel deve ter as colunas:
 * - CPF (ou CPF_CNPJ ou CPFCNPJ)
 * - NOME
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Função para limpar CPF/CNPJ
function limparCpfCnpj(valor: any): string {
  if (!valor) return '';
  return String(valor).replace(/\D/g, '');
}

// Função para validar CPF
function validarCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Função para validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

async function migrar(empresaId: number, caminhoExcel: string) {
  console.log('='.repeat(60));
  console.log('MIGRAÇÃO DE DADOS: EXCEL -> BANCO DE DADOS');
  console.log('='.repeat(60));
  console.log();

  // Verificar se o arquivo existe
  if (!fs.existsSync(caminhoExcel)) {
    console.error(`❌ Arquivo não encontrado: ${caminhoExcel}`);
    process.exit(1);
  }

  // Verificar se a empresa existe
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
  });

  if (!empresa) {
    console.error(`❌ Empresa com ID ${empresaId} não encontrada`);
    process.exit(1);
  }

  console.log(`📁 Arquivo: ${caminhoExcel}`);
  console.log(`🏢 Empresa: ${empresa.nome} (ID: ${empresa.id})`);
  console.log();

  // Ler o arquivo Excel
  console.log('📖 Lendo arquivo Excel...');
  const workbook = XLSX.readFile(caminhoExcel);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const dados: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`   Encontradas ${dados.length} linhas`);
  console.log();

  // Estatísticas
  let importados = 0;
  let duplicados = 0;
  let invalidos = 0;
  let erros = 0;

  const registrosInvalidos: { linha: number; cpf_cnpj: string; nome: string; motivo: string }[] = [];

  console.log('🔄 Processando registros...');
  console.log();

  for (let i = 0; i < dados.length; i++) {
    const linha = dados[i];
    const numeroLinha = i + 2; // +2 porque começa em 1 e tem cabeçalho

    // Tentar encontrar a coluna de CPF/CNPJ
    const cpfCnpjRaw = linha.CPF || linha.cpf || linha.CPF_CNPJ || linha.cpf_cnpj || linha.CPFCNPJ || linha.cpfcnpj || '';
    const nomeRaw = linha.NOME || linha.nome || linha.Nome || '';

    const cpfCnpj = limparCpfCnpj(cpfCnpjRaw);
    const nome = String(nomeRaw).trim();

    // Validar dados
    if (!cpfCnpj) {
      invalidos++;
      registrosInvalidos.push({
        linha: numeroLinha,
        cpf_cnpj: cpfCnpjRaw,
        nome,
        motivo: 'CPF/CNPJ vazio',
      });
      continue;
    }

    if (!nome) {
      invalidos++;
      registrosInvalidos.push({
        linha: numeroLinha,
        cpf_cnpj: cpfCnpj,
        nome: nomeRaw,
        motivo: 'Nome vazio',
      });
      continue;
    }

    // Validar CPF ou CNPJ
    const isCPF = cpfCnpj.length === 11;
    const isCNPJ = cpfCnpj.length === 14;

    if (!isCPF && !isCNPJ) {
      invalidos++;
      registrosInvalidos.push({
        linha: numeroLinha,
        cpf_cnpj: cpfCnpj,
        nome,
        motivo: `Tamanho inválido (${cpfCnpj.length} dígitos)`,
      });
      continue;
    }

    if (isCPF && !validarCPF(cpfCnpj)) {
      invalidos++;
      registrosInvalidos.push({
        linha: numeroLinha,
        cpf_cnpj: cpfCnpj,
        nome,
        motivo: 'CPF inválido (dígito verificador)',
      });
      continue;
    }

    if (isCNPJ && !validarCNPJ(cpfCnpj)) {
      invalidos++;
      registrosInvalidos.push({
        linha: numeroLinha,
        cpf_cnpj: cpfCnpj,
        nome,
        motivo: 'CNPJ inválido (dígito verificador)',
      });
      continue;
    }

    // Tentar inserir no banco
    try {
      await prisma.empresaPessoa.create({
        data: {
          empresa_id: empresaId,
          cpf_cnpj: cpfCnpj,
          nome,
          ativo: true,
        },
      });
      importados++;

      // Mostrar progresso a cada 100 registros
      if (importados % 100 === 0) {
        console.log(`   ✅ ${importados} registros importados...`);
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Violação de constraint único (duplicado)
        duplicados++;
      } else {
        erros++;
        console.error(`   ❌ Erro na linha ${numeroLinha}: ${error.message}`);
      }
    }
  }

  console.log();
  console.log('='.repeat(60));
  console.log('RESULTADO DA MIGRAÇÃO');
  console.log('='.repeat(60));
  console.log();
  console.log(`✅ Importados com sucesso: ${importados}`);
  console.log(`⏭️  Duplicados (ignorados): ${duplicados}`);
  console.log(`⚠️  Registros inválidos:    ${invalidos}`);
  console.log(`❌ Erros:                   ${erros}`);
  console.log();

  // Mostrar registros inválidos
  if (registrosInvalidos.length > 0) {
    console.log('REGISTROS INVÁLIDOS:');
    console.log('-'.repeat(60));
    registrosInvalidos.slice(0, 20).forEach((r) => {
      console.log(`Linha ${r.linha}: ${r.cpf_cnpj} - ${r.nome} [${r.motivo}]`);
    });
    if (registrosInvalidos.length > 20) {
      console.log(`... e mais ${registrosInvalidos.length - 20} registros`);
    }
    console.log();
  }

  // Salvar log de erros
  if (registrosInvalidos.length > 0) {
    const logPath = path.join(path.dirname(caminhoExcel), 'migracao-erros.json');
    fs.writeFileSync(logPath, JSON.stringify(registrosInvalidos, null, 2));
    console.log(`📄 Log de erros salvo em: ${logPath}`);
  }

  console.log();
  console.log('✨ Migração concluída!');
}

// Execução principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('USO: npx ts-node scripts/migrar-excel.ts <empresa_id> <caminho_do_excel>');
    console.log('');
    console.log('EXEMPLO:');
    console.log('  npx ts-node scripts/migrar-excel.ts 1 dados.xlsx');
    console.log('');
    console.log('O arquivo Excel deve ter as colunas CPF e NOME');
    process.exit(1);
  }

  const empresaId = parseInt(args[0]);
  const caminhoExcel = args[1];

  if (isNaN(empresaId)) {
    console.error('❌ ID da empresa deve ser um número');
    process.exit(1);
  }

  try {
    await migrar(empresaId, caminhoExcel);
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
