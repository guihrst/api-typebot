#!/bin/bash

# ============================================
# Comandos úteis - API Typebot Docker
# ============================================

case "$1" in
  # Criar acesso para cliente
  criar-acesso)
    if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
      echo "Uso: ./comandos.sh criar-acesso <empresa_id> <email> <senha>"
      echo "Exemplo: ./comandos.sh criar-acesso 1 cliente@email.com senha123"
      exit 1
    fi
    docker compose exec app npx ts-node scripts/criar-acesso-cliente.ts $2 $3 $4
    ;;

  # Migrar dados do Excel
  migrar-excel)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo "Uso: ./comandos.sh migrar-excel <empresa_id> <caminho_excel>"
      echo "Exemplo: ./comandos.sh migrar-excel 1 /dados/clientes.xlsx"
      echo ""
      echo "Primeiro copie o Excel para o container:"
      echo "  docker cp seu-arquivo.xlsx api-typebot-app:/app/dados.xlsx"
      echo "Depois execute:"
      echo "  ./comandos.sh migrar-excel 1 /app/dados.xlsx"
      exit 1
    fi
    docker compose exec app npx ts-node scripts/migrar-excel.ts $2 $3
    ;;

  # Ver logs
  logs)
    docker compose logs -f app
    ;;

  # Reiniciar aplicação
  restart)
    docker compose restart app
    ;;

  # Rebuild completo
  rebuild)
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    ;;

  # Executar migrations
  migrate)
    docker compose exec app npx prisma migrate deploy
    ;;

  # Acessar shell do container
  shell)
    docker compose exec app sh
    ;;

  # Acessar PostgreSQL
  psql)
    docker compose exec postgres psql -U typebot -d api_typebot
    ;;

  # Status dos containers
  status)
    docker compose ps
    ;;

  # Parar tudo
  stop)
    docker compose down
    ;;

  # Iniciar tudo
  start)
    docker compose up -d
    ;;

  # Ajuda
  *)
    echo "============================================"
    echo "  Comandos Úteis - API Typebot"
    echo "============================================"
    echo ""
    echo "Uso: ./comandos.sh <comando> [argumentos]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start                           - Iniciar containers"
    echo "  stop                            - Parar containers"
    echo "  restart                         - Reiniciar aplicação"
    echo "  rebuild                         - Rebuild completo"
    echo "  logs                            - Ver logs da aplicação"
    echo "  status                          - Status dos containers"
    echo "  shell                           - Acessar shell do container"
    echo "  psql                            - Acessar PostgreSQL"
    echo "  migrate                         - Executar migrations"
    echo "  criar-acesso <id> <email> <senha>  - Criar acesso cliente"
    echo "  migrar-excel <id> <arquivo>     - Migrar dados do Excel"
    echo ""
    echo "Exemplos:"
    echo "  ./comandos.sh criar-acesso 1 cliente@email.com senha123"
    echo "  ./comandos.sh logs"
    echo "  ./comandos.sh restart"
    echo ""
    ;;
esac
