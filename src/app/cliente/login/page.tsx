'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, Button, Paper, Title, Text, Container, Alert } from '@mantine/core';
import axios from 'axios';

export default function ClienteLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await axios.post('/api/cliente/auth/login', {
        email,
        senha,
      });

      if (response.data.success) {
        router.push('/cliente/dashboard');
      }
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Container size={420}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Title order={2} ta="center" mb="md">
            Portal do Cliente
          </Title>
          <Text c="dimmed" size="sm" ta="center" mb="lg">
            Faça login para gerenciar seus cadastros
          </Text>

          {erro && (
            <Alert color="red" mb="md" onClose={() => setErro('')} withCloseButton>
              {erro}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextInput
              label="Email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              mb="md"
            />

            <TextInput
              label="Senha"
              type="password"
              placeholder="Sua senha"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              mb="lg"
            />

            <Button type="submit" fullWidth loading={loading}>
              Entrar
            </Button>
          </form>
        </Paper>
      </Container>
    </div>
  );
}
