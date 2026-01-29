'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Pessoa {
  id: number;
  cpf_cnpj: string;
  nome: string;
  ativo: boolean;
}

interface Empresa {
  id: number;
  nome: string;
  email_cliente: string;
}

function formatarCpfCnpj(valor: string): string {
  if (valor.length === 11) {
    return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (valor.length === 14) {
    return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return valor;
}

export default function ClienteDashboard() {
  const router = useRouter();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formCpfCnpj, setFormCpfCnpj] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    verificarAuth();
  }, []);

  const verificarAuth = async () => {
    try {
      const res = await fetch('/api/cliente/auth/me');
      if (!res.ok) {
        router.push('/cliente/login');
        return;
      }
      const data = await res.json();
      setEmpresa(data.empresa);
      carregarPessoas();
    } catch {
      router.push('/cliente/login');
    }
  };

  const carregarPessoas = async () => {
    try {
      const res = await fetch('/api/cliente/pessoas');
      const data = await res.json();
      setPessoas(data.data || []);
    } catch {
      setErro('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/cliente/auth/logout', { method: 'POST' });
    router.push('/cliente/login');
  };

  const abrirModal = (pessoa?: Pessoa) => {
    if (pessoa) {
      setEditandoId(pessoa.id);
      setFormNome(pessoa.nome);
      setFormCpfCnpj(formatarCpfCnpj(pessoa.cpf_cnpj));
    } else {
      setEditandoId(null);
      setFormNome('');
      setFormCpfCnpj('');
    }
    setShowModal(true);
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const dados = {
        nome: formNome,
        cpf_cnpj: formCpfCnpj.replace(/\D/g, ''),
      };

      const url = editandoId 
        ? `/api/cliente/pessoas/${editandoId}`
        : '/api/cliente/pessoas';
      
      const res = await fetch(url, {
        method: editandoId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      if (res.ok) {
        setShowModal(false);
        carregarPessoas();
      } else {
        const data = await res.json();
        setErro(data.error || 'Erro ao salvar');
      }
    } catch {
      setErro('Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    
    try {
      await fetch(`/api/cliente/pessoas/${id}`, { method: 'DELETE' });
      carregarPessoas();
    } catch {
      setErro('Erro ao excluir');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <div>
          <h2 style={{ margin: 0 }}>{empresa?.nome}</h2>
          <small style={{ color: '#666' }}>{empresa?.email_cliente}</small>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Sair
        </button>
      </div>

      {erro && (
        <div style={{ background: '#fee', color: '#c00', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
          {erro}
          <button onClick={() => setErro('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Botão Adicionar */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => abrirModal()}
          style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Novo Cadastro
        </button>
      </div>

      {/* Tabela */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>CPF/CNPJ</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Nome</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', width: '120px' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pessoas.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Nenhum cadastro encontrado
              </td>
            </tr>
          ) : (
            pessoas.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontFamily: 'monospace' }}>
                  {formatarCpfCnpj(p.cpf_cnpj)}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.nome}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    background: p.ativo ? '#e6ffe6' : '#f0f0f0',
                    color: p.ativo ? '#006600' : '#666'
                  }}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  <button onClick={() => abrirModal(p)} style={{ marginRight: '8px', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleExcluir(p.id)} style={{ cursor: 'pointer' }}>🗑️</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>{editandoId ? 'Editar' : 'Novo'} Cadastro</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>CPF ou CNPJ</label>
              <input
                type="text"
                value={formCpfCnpj}
                onChange={(e) => setFormCpfCnpj(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Nome</label>
              <input
                type="text"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                onClick={handleSalvar} 
                disabled={salvando}
                style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
