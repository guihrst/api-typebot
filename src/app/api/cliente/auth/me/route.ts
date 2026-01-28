import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sua-chave-secreta-aqui-mude-em-producao'
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cliente_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar e decodificar o token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Buscar dados atualizados da empresa
    const empresa = await prisma.empresa.findUnique({
      where: { id: payload.empresaId as number },
      select: {
        id: true,
        nome: true,
        nome_fantasia: true,
        email_cliente: true,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      empresa,
    });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 401 }
    );
  }
}
