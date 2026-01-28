'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  TextInput,
  Table,
  Group,
  ActionIcon,
  Modal,
  Switch,
  Alert,
  Loader,
  Pagination,
  Badge,
  Flex,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import axios from 'axios';

interface Pessoa {
  id: number;
  cpf_cnpj: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

interface Empresa {
  id: number;
  nome: string;
  nome_fantasia: string | null;
  email_cliente: string;
}

// Função para formatar CPF/CNPJ
function formatarCpfCnpj(valor: string): string {
  if (valor.length === 11) {
    return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (valor.length === 14) {
    return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return valor;
}

// Função para máscara de CPF/CNPJ durante digitação
function aplicarMascaraCpfCnpj(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  
  if (numeros.length <= 11) {
    // Máscara de CPF
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // Máscara de CNPJ
    return numeros
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
}

export default function ClienteDashboard() {
  const router = useRouter();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;

  // Busca
  const [busca, setBusca] = useState('');

  // Modal de adicionar/editar
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editando, setEditando] = useState<Pessoa | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formCpfCnpj, setFormCpfCnpj] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Modal de confirmação de exclusão
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [pessoaParaExcluir, setPessoaParaExcluir] = useState<Pessoa | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    verificarAuth();
  }, []);

  // Carregar dados quando mudar página ou busca
  useEffect(() => {
    if (empresa) {
      carregarPessoas();
    }
  }, [page, empresa]);

  const verificarAuth = async () => {
    try {
      const response = await axios.get('/api/cliente/auth/me');
      setEmpresa(response.data.empresa);
    } catch (error) {
      router.push('/cliente/login');
    } finally {
      setLoading(false);
    }
  };

  const carregarPessoas = useCallback(async () => {
    setLoadingTable(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (busca) {
        params.append('busca', busca);
      }

      const response = await axios.get(`/api/cliente/pessoas?${params}`);
      setPessoas(response.data.data);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
    } catch (error: any) {
      setErro('Erro ao carregar dados');
    } finally {
      setLoadingTable(false);
    }
  }, [page, busca, pageSize]);

  const handleBuscar = () => {
    setPage(1);
    carregarPessoas();
  };

  const handleLimparBusca = () => {
    setBusca('');
    setPage(1);
    // Recarregar sem busca
    setTimeout(() => carregarPessoas(), 100);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/cliente/auth/logout');
      router.push('/cliente/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const abrirModalAdicionar = () => {
    setEditando(null);
    setFormNome('');
    setFormCpfCnpj('');
    setFormAtivo(true);
    openModal();
  };

  const abrirModalEditar = (pessoa: Pessoa) => {
    setEditando(pessoa);
    setFormNome(pessoa.nome);
    setFormCpfCnpj(formatarCpfCnpj(pessoa.cpf_cnpj));
    setFormAtivo(pessoa.ativo);
    openModal();
  };

  const handleSalvar = async () => {
    setSalvando(true);
    setErro('');

    try {
      const dados = {
        nome: formNome,
        cpf_cnpj: formCpfCnpj.replace(/\D/g, ''), // Enviar apenas números
        ativo: formAtivo,
      };

      if (editando) {
        await axios.put(`/api/cliente/pessoas/${editando.id}`, dados);
        setSucesso('Cadastro atualizado com sucesso!');
      } else {
        await axios.post('/api/cliente/pessoas', dados);
        setSucesso('Cadastro criado com sucesso!');
      }

      closeModal();
      carregarPessoas();

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSucesso(''), 3000);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const abrirModalExcluir = (pessoa: Pessoa) => {
    setPessoaParaExcluir(pessoa);
    openDeleteModal();
  };

  const handleExcluir = async () => {
    if (!pessoaParaExcluir) return;

    setExcluindo(true);
    try {
      await axios.delete(`/api/cliente/pessoas/${pessoaParaExcluir.id}`);
      setSucesso('Cadastro excluído com sucesso!');
      closeDeleteModal();
      carregarPessoas();
      setTimeout(() => setSucesso(''), 3000);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao excluir');
    } finally {
      setExcluindo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <Container size="lg">
        {/* Cabeçalho */}
        <Paper withBorder shadow="sm" p="md" mb="lg">
          <Flex justify="space-between" align="center">
            <div>
              <Title order={3}>{empresa?.nome_fantasia || empresa?.nome}</Title>
              <Text c="dimmed" size="sm">{empresa?.email_cliente}</Text>
            </div>
            <Button variant="outline" color="red" onClick={handleLogout}>
              Sair
            </Button>
          </Flex>
        </Paper>

        {/* Alertas */}
        {erro && (
          <Alert color="red" mb="md" onClose={() => setErro('')} withCloseButton>
            {erro}
          </Alert>
        )}

        {sucesso && (
          <Alert color="green" mb="md" onClose={() => setSucesso('')} withCloseButton>
            {sucesso}
          </Alert>
        )}

        {/* Área de busca e ações */}
        <Paper withBorder shadow="sm" p="md" mb="lg">
          <Flex gap="md" align="flex-end" wrap="wrap">
            <TextInput
              label="Buscar"
              placeholder="Nome ou CPF/CNPJ"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              style={{ flex: 1, minWidth: 200 }}
            />
            <Button variant="light" onClick={handleBuscar}>
              Buscar
            </Button>
            <Button variant="subtle" onClick={handleLimparBusca}>
              Limpar
            </Button>
            <Button onClick={abrirModalAdicionar}>
              + Novo Cadastro
            </Button>
          </Flex>
        </Paper>

        {/* Tabela de pessoas */}
        <Paper withBorder shadow="sm" p="md">
          <Flex justify="space-between" align="center" mb="md">
            <Title order={4}>Cadastros de CPF/CNPJ</Title>
            <Badge size="lg" variant="light">
              {total} registro{total !== 1 ? 's' : ''}
            </Badge>
          </Flex>

          {loadingTable ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : pessoas.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Nenhum cadastro encontrado
            </Text>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>CPF/CNPJ</Table.Th>
                    <Table.Th>Nome</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th style={{ width: 120 }}>Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pessoas.map((pessoa) => (
                    <Table.Tr key={pessoa.id}>
                      <Table.Td style={{ fontFamily: 'monospace' }}>
                        {formatarCpfCnpj(pessoa.cpf_cnpj)}
                      </Table.Td>
                      <Table.Td>{pessoa.nome}</Table.Td>
                      <Table.Td>
                        <Badge color={pessoa.ativo ? 'green' : 'gray'}>
                          {pessoa.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => abrirModalEditar(pessoa)}
                            title="Editar"
                          >
                            ✏️
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => abrirModalExcluir(pessoa)}
                            title="Excluir"
                          >
                            🗑️
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {totalPages > 1 && (
                <Flex justify="center" mt="lg">
                  <Pagination
                    value={page}
                    onChange={setPage}
                    total={totalPages}
                  />
                </Flex>
              )}
            </>
          )}
        </Paper>

        {/* Modal de Adicionar/Editar */}
        <Modal
          opened={modalOpened}
          onClose={closeModal}
          title={editando ? 'Editar Cadastro' : 'Novo Cadastro'}
          centered
        >
          <TextInput
            label="CPF ou CNPJ"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            value={formCpfCnpj}
            onChange={(e) => setFormCpfCnpj(aplicarMascaraCpfCnpj(e.target.value))}
            maxLength={18}
            required
            mb="md"
          />

          <TextInput
            label="Nome"
            placeholder="Nome completo"
            value={formNome}
            onChange={(e) => setFormNome(e.target.value)}
            required
            mb="md"
          />

          <Switch
            label="Cadastro ativo"
            checked={formAtivo}
            onChange={(e) => setFormAtivo(e.currentTarget.checked)}
            mb="lg"
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={salvando}>
              Salvar
            </Button>
          </Group>
        </Modal>

        {/* Modal de Confirmação de Exclusão */}
        <Modal
          opened={deleteModalOpened}
          onClose={closeDeleteModal}
          title="Confirmar Exclusão"
          centered
          size="sm"
        >
          <Text mb="lg">
            Tem certeza que deseja excluir o cadastro de{' '}
            <strong>{pessoaParaExcluir?.nome}</strong>?
          </Text>
          <Text c="dimmed" size="sm" mb="lg">
            CPF/CNPJ: {pessoaParaExcluir && formatarCpfCnpj(pessoaParaExcluir.cpf_cnpj)}
          </Text>

          <Group justify="flex-end">
            <Button variant="light" onClick={closeDeleteModal}>
              Cancelar
            </Button>
            <Button color="red" onClick={handleExcluir} loading={excluindo}>
              Excluir
            </Button>
          </Group>
        </Modal>
      </Container>
    </div>
  );
}
