import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verificarAutenticacaoCliente, limparCpfCnpj } from '@/lib/auth-cliente';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const cliente = await verificarAutenticacaoCliente();
    if (!cliente) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const pessoaId = parseInt(id);
    if (isNaN(pessoaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const pessoa = await prisma.empresaPessoa.findFirst({
      where: { id: pessoaId, empresa_id: cliente.empresaId },
    });

    if (!pessoa) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(pessoa);
  } catch (error) {
    console.error('Erro ao buscar pessoa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const cliente = await verificarAutenticacaoCliente();
    if (!cliente) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const pessoaId = parseInt(id);
    if (isNaN(pessoaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const { cpf_cnpj, nome, ativo } = body;

    const pessoaExistente = await prisma.empresaPessoa.findFirst({
      where: { id: pessoaId, empresa_id: cliente.empresaId },
    });

    if (!pessoaExistente) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 });
    }

    const dadosAtualizacao: any = { updated_at: new Date() };

    if (nome !== undefined) {
      if (!nome.trim()) {
        return NextResponse.json({ error: 'Nome não pode ser vazio' }, { status: 400 });
      }
      dadosAtualizacao.nome = nome.trim();
    }

    if (ativo !== undefined) {
      dadosAtualizacao.ativo = Boolean(ativo);
    }

    if (cpf_cnpj !== undefined) {
      const cpfCnpjLimpo = limparCpfCnpj(cpf_cnpj);

      const duplicado = await prisma.empresaPessoa.findFirst({
        where: {
          empresa_id: cliente.empresaId,
          cpf_cnpj: cpfCnpjLimpo,
          id: { not: pessoaId },
        },
      });

      if (duplicado) {
        return NextResponse.json({ error: 'Este CPF/CNPJ já está cadastrado para outra pessoa' }, { status: 409 });
      }

      dadosAtualizacao.cpf_cnpj = cpfCnpjLimpo;
    }

    const pessoa = await prisma.empresaPessoa.update({
      where: { id: pessoaId },
      data: dadosAtualizacao,
    });

    return NextResponse.json(pessoa);
  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const cliente = await verificarAutenticacaoCliente();
    if (!cliente) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const pessoaId = parseInt(id);
    if (isNaN(pessoaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const pessoa = await prisma.empresaPessoa.findFirst({
      where: { id: pessoaId, empresa_id: cliente.empresaId },
    });

    if (!pessoa) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 });
    }

    await prisma.empresaPessoa.delete({ where: { id: pessoaId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover pessoa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
