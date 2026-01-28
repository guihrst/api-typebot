/**
 * Script para Criar/Atualizar Acesso do Cliente
 * 
 * Este script configura email e senha de acesso para uma empresa no portal do cliente.
 * 
 * USO:
 * npx ts-node scripts/criar-acesso-cliente.ts <empresa_id> <email> <senha>
 * 
 * EXEMPLO:
 * npx ts-node scripts/criar-acesso-cliente.ts 1 cliente@empresa.com minhasenha123
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function criarAcesso(empresaId: number, email: string, senha: string) {
  console.log('='.repeat(60));
  console.log('CRIAR/ATUALIZAR ACESSO DO CLIENTE');
  console.log('='.repeat(60));
  console.log();

  // Verificar se a empresa existe
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
  });

  if (!empresa) {
    console.error(`❌ Empresa com ID ${empresaId} não encontrada`);
    process.exit(1);
  }

  console.log(`🏢 Empresa: ${empresa.nome}`);
  console.log(`📧 Email:   ${email}`);
  console.log();

  // Verificar se o email já está em uso por outra empresa
  const empresaComEmail = await prisma.empresa.findFirst({
    where: {
      email_cliente: email.toLowerCase().trim(),
      id: { not: empresaId },
    },
  });

  if (empresaComEmail) {
    console.error(`❌ O email ${email} já está em uso pela empresa "${empresaComEmail.nome}"`);
    process.exit(1);
  }

  // Gerar hash da senha
  console.log('🔐 Gerando hash da senha...');
  const senhaHash = await bcrypt.hash(senha, 10);

  // Atualizar empresa
  console.log('💾 Salvando no banco de dados...');
  await prisma.empresa.update({
    where: { id: empresaId },
    data: {
      email_cliente: email.toLowerCase().trim(),
      senha_cliente: senhaHash,
      updated_at: new Date(),
    },
  });

  console.log();
  console.log('='.repeat(60));
  console.log('✅ ACESSO CRIADO COM SUCESSO!');
  console.log('='.repeat(60));
  console.log();
  console.log('Dados de acesso:');
  console.log(`  URL:   /cliente/login`);
  console.log(`  Email: ${email}`);
  console.log(`  Senha: ${senha}`);
  console.log();
  console.log('⚠️  Envie esses dados para o cliente de forma segura!');
  console.log();
}

// Execução principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('USO: npx ts-node scripts/criar-acesso-cliente.ts <empresa_id> <email> <senha>');
    console.log('');
    console.log('EXEMPLO:');
    console.log('  npx ts-node scripts/criar-acesso-cliente.ts 1 cliente@empresa.com minhasenha123');
    console.log('');

    // Listar empresas disponíveis
    console.log('EMPRESAS DISPONÍVEIS:');
    const empresas = await prisma.empresa.findMany({
      select: { id: true, nome: true, email_cliente: true },
      orderBy: { id: 'asc' },
    });

    if (empresas.length === 0) {
      console.log('  Nenhuma empresa cadastrada');
    } else {
      empresas.forEach((e) => {
        const status = e.email_cliente ? `(${e.email_cliente})` : '(sem acesso)';
        console.log(`  ID ${e.id}: ${e.nome} ${status}`);
      });
    }

    process.exit(1);
  }

  const empresaId = parseInt(args[0]);
  const email = args[1];
  const senha = args[2];

  if (isNaN(empresaId)) {
    console.error('❌ ID da empresa deve ser um número');
    process.exit(1);
  }

  if (!email.includes('@')) {
    console.error('❌ Email inválido');
    process.exit(1);
  }

  if (senha.length < 6) {
    console.error('❌ A senha deve ter pelo menos 6 caracteres');
    process.exit(1);
  }

  try {
    await criarAcesso(empresaId, email, senha);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
