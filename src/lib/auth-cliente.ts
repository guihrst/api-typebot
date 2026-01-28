import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sua-chave-secreta-aqui-mude-em-producao'
);

export interface ClientePayload {
  empresaId: number;
  email: string;
  nome: string;
}

export async function verificarAutenticacaoCliente(): Promise<ClientePayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cliente_token')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      empresaId: payload.empresaId as number,
      email: payload.email as string,
      nome: payload.nome as string,
    };
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
}

// Função para limpar CPF/CNPJ (remover caracteres não numéricos)
export function limparCpfCnpj(valor: string): string {
  return valor.replace(/\D/g, '');
}

// Função para validar CPF
export function validarCPF(cpf: string): boolean {
  cpf = limparCpfCnpj(cpf);
  
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
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
export function validarCNPJ(cnpj: string): boolean {
  cnpj = limparCpfCnpj(cnpj);
  
  if (cnpj.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validação do primeiro dígito verificador
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
  
  // Validação do segundo dígito verificador
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

// Função para validar CPF ou CNPJ
export function validarCpfCnpj(valor: string): { valido: boolean; tipo: 'CPF' | 'CNPJ' | null } {
  const limpo = limparCpfCnpj(valor);
  
  if (limpo.length === 11) {
    return { valido: validarCPF(limpo), tipo: 'CPF' };
  } else if (limpo.length === 14) {
    return { valido: validarCNPJ(limpo), tipo: 'CNPJ' };
  }
  
  return { valido: false, tipo: null };
}

// Função para formatar CPF
export function formatarCPF(cpf: string): string {
  const limpo = limparCpfCnpj(cpf);
  return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para formatar CNPJ
export function formatarCNPJ(cnpj: string): string {
  const limpo = limparCpfCnpj(cnpj);
  return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Função para formatar CPF ou CNPJ automaticamente
export function formatarCpfCnpj(valor: string): string {
  const limpo = limparCpfCnpj(valor);
  
  if (limpo.length === 11) {
    return formatarCPF(limpo);
  } else if (limpo.length === 14) {
    return formatarCNPJ(limpo);
  }
  
  return limpo;
}
