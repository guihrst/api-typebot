import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import z from 'zod';
import { limparCpfCnpj, formatarCpfCnpj } from '@/lib/auth-cliente';

// Classe de erro customizada para permitir status HTTP
class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function GET(req: NextRequest) {
  try {
    const ParamsSchema = z.object({
      cpf: z.string().min(1, { message: 'CPF/CNPJ é obrigatório' })
    });

    const headersList = req.headers;
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      throw new HttpError('Undefined authorization token', 401);
    }

    const empresa = await prisma.empresa.findFirst({
      where: { token: authHeader },
    });

    if (!empresa) {
      throw new HttpError('Invalid authorization token', 401);
    }

    const { searchParams } = new URL(req.url);
    const paramsObject = Object.fromEntries(searchParams);

    const { cpf } = ParamsSchema.parse(paramsObject);
    const cpfLimpo = limparCpfCnpj(cpf);

    // Buscar no banco de dados (nova forma - mais rápida!)
    const pessoa = await prisma.empresaPessoa.findFirst({
      where: {
        empresa_id: empresa.id,
        cpf_cnpj: cpfLimpo,
        ativo: true, // Apenas pessoas ativas
      },
    });

    if (!pessoa) {
      throw new HttpError('Person not found', 404);
    }

    return new Response(
      JSON.stringify({
        found: true,
        cpf: formatarCpfCnpj(pessoa.cpf_cnpj),
        nome: pessoa.nome
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    let status = 500;
    let message = 'Error processing request';
    let details = {};

    // O Zod lança um erro do tipo `ZodError`
    if (error instanceof z.ZodError) {
      message = error.issues[0].message;
      details = error.issues;
      status = 400;
    } else {
      status = error?.status || status;
      message = error?.message || message;
    }

    return new Response(JSON.stringify({
      found: false,
      error: message,
      details: details
    }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
