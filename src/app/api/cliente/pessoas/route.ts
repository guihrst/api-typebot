import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verificarAutenticacaoCliente, limparCpfCnpj } from '@/lib/auth-cliente';

export async function GET(req: NextRequest) {
  try {
    const cliente = await verificarAutenticacaoCliente();
    if (!cliente) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const busca = searchParams.get('busca') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '15');
    const ativo = searchParams.get('ativo');

    const where: any = { empresa_id: cliente.empresaId };

    if (busca) {
      const buscaLimpa = limparCpfCnpj(busca);
      const orConditions: any[] = [
        { nome: { contains: busca, mode: 'insensitive' } }
      ];
      
      if (buscaLimpa) {
        orConditions.push({ cpf_cnpj: { contains: buscaLimpa } });
      }
      
      where.AND = [{ OR: orConditions }];
    }

    if (ativo === 'true') where.ativo = true;
    else if (ativo === 'false') where.ativo = false;

    const total = await prisma.empresaPessoa.count({ where });
    const pessoas = await prisma.empresaPessoa.findMany({
      where,
      orderBy: { nome: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({ total, page, pageSize, totalPages: Math.ceil(total / pageSize), data: pessoas });
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cliente = await verificarAutenticacaoCliente();
    if (!cliente) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { cpf_cnpj, nome } = body;

    if (!cpf_cnpj || !nome) {
      return NextResponse.json({ error: 'CPF/CNPJ e Nome são obrigatórios' }, { status: 400 });
    }

    const cpfCnpjLimpo = limparCpfCnpj(cpf_cnpj);

    const existente = await prisma.empresaPessoa.findFirst({
      where: { empresa_id: cliente.empresaId, cpf_cnpj: cpfCnpjLimpo },
    });

    if (existente) {
      return NextResponse.json({ error: 'Este CPF/CNPJ já está cadastrado' }, { status: 409 });
    }

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
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
