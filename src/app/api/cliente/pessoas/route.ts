import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verificarAutenticacaoCliente, limparCpfCnpj, validarCpfCnpj } from '@/lib/auth-cliente';

// GET - Listar pessoas da empresa
export async function GET(req: NextRequest) {
  try {
    const cliente = await verificarAutenticacaoCliente();

    if (!cliente) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const busca = searchParams.get('busca') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '15');
    const ativo = searchParams.get('ativo'); // 'true', 'false' ou null (todos)

    // Construir filtro
    const where: any = {
      empresa_id: cliente.empresaId,
    };

    // Filtro de busca por nome ou CPF/CNPJ
    if (busca) {
      const buscaLimpa = limparCpfCnpj(busca);
      where.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { cpf_cnpj: { contains: buscaLimpa } },
      ];
    }

    // Filtro de ativo/inativo
    if (ativo === 'true') {
      where.ativo = true;
    } else if (ativo === 'false') {
      where.ativo = false;
    }

    // Buscar total
    const total = await prisma.empresaPessoa.count({ where });

    // Buscar dados paginados
    const pessoas = await prisma.empresaPessoa.findMany({
      where,
      orderBy: { nome: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      data: pessoas,
    });
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova pessoa
export async function POST(req: NextRequest) {
  try {
    const cliente = await verificarAutenticacaoCliente();

    if (!cliente) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { cpf_cnpj, nome } = body;

    // Validações
    if (!cpf_cnpj || !nome) {
      return NextResponse.json(
        { error: 'CPF/CNPJ e Nome são obrigatórios' },
        { status: 400 }
      );
    }

    const cpfCnpjLimpo = limparCpfCnpj(cpf_cnpj);

    // Validar CPF ou CNPJ
    const validacao = validarCpfCnpj(cpfCnpjLimpo);
    if (!validacao.valido) {
      return NextResponse.json(
        { error: `${validacao.tipo || 'CPF/CNPJ'} inválido` },
        { status: 400 }
      );
    }

    // Verificar se já existe
    const existente = await prisma.empresaPessoa.findFirst({
      where: {
        empresa_id: cliente.empresaId,
        cpf_cnpj: cpfCnpjLimpo,
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: 'Este CPF/CNPJ já está cadastrado' },
        { status: 409 }
      );
    }

    // Criar pessoa
    const pessoa = await prisma.empresaPessoa.create({
      data: {
        empresa_id: cliente.empresaId,
        cpf_cnpj: cpfCnpjLimpo,
        nome: nome.trim(),
        ativo: true,
      },
    });

    return NextResponse.json(pessoa, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
