import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sua-chave-secreta-aqui-mude-em-producao'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar empresa pelo email do cliente
    const empresa = await prisma.empresa.findFirst({
      where: { email_cliente: email.toLowerCase().trim() },
    });

    if (!empresa || !empresa.senha_cliente) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, empresa.senha_cliente);

    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = await new SignJWT({
      empresaId: empresa.id,
      email: empresa.email_cliente,
      nome: empresa.nome,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h') // Token válido por 8 horas
      .sign(JWT_SECRET);

    // Definir cookie httpOnly
    const cookieStore = await cookies();
    cookieStore.set('cliente_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    });

    return NextResponse.json({
      success: true,
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        nome_fantasia: empresa.nome_fantasia,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
