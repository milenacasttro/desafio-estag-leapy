# Interface de Talentos

Interface web para listagem de talentos com busca, filtros avançados e paginação, desenvolvida com Next.js e TypeScript, utilizando Directus como backend.

## Stack

- **Backend**: PostgreSQL + Directus (via Docker Compose)
- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Integração**: Next.js API Routes (BFF) para evitar CORS e melhorar segurança

## Funcionalidades Implementadas

- **Listagem de talentos**: Tabela com todos os campos relevantes
- **Busca por email**: Busca por `directus_users.email` via relacionamento com `talents.user_id`
- **Filtros**:
  - `department`, `current_status`, `pdi_plan_ready`, `orchestrator_state`
  - Intervalo de datas (`start_date`/`end_date`)
  - `leader_id`, `target_role_id`
- **Ordenação**: Por `date_updated` (desc) e outras colunas (clique nos headers)
- **Paginação server-side**: Com limite configurável (5, 10, 20, 50)
- **Exportação CSV**: Exporta os dados visíveis (com filtros aplicados) para arquivo CSV com encoding UTF-8 (compatível com Excel)
- **Estados de UI**: Loading, erro e estados vazios
- **Responsividade**: Layout adaptável com scroll interno na tabela
- **Acessibilidade**: ARIA labels básicos implementados

## Como rodar localmente

### Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ e npm instalados

### Backend (Directus + PostgreSQL)

1. Navegue até a pasta do projeto:
```bash
cd 01-interface-talent
```

2. (Opcional) Crie um arquivo `.env` na pasta `directus` para customizar as configurações:
```bash
# Windows PowerShell
New-Item -Path directus/.env -ItemType File

# Linux/Mac
touch directus/.env
```

3. Adicione as variáveis de ambiente no arquivo `directus/.env` (valores padrão já estão no docker-compose.yml, mas você pode customizar):
```env
# PostgreSQL
POSTGRES_PASSWORD=postgres
POSTGRES_USER=postgres
POSTGRES_DB=leapy
POSTGRES_PORT=5432

# Directus
PORT=8055
KEY=supersecretkey
SECRET=supersecretsecret
PUBLIC_URL=http://localhost:8055
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin

# CORS (ajuste se necessário)
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000
```

**Nota**: Se você não criar o arquivo `.env`, o docker-compose.yml usará os valores padrão indicados acima.

4. Suba os serviços Docker:
```bash
docker compose -f directus/docker-compose.yml up -d --build
```

5. Aguarde o Directus iniciar completamente (pode levar alguns minutos na primeira vez). O `schema.sql` e `seed.sql` serão aplicados automaticamente.

6. Configure as permissões públicas (necessário para o frontend funcionar sem autenticação):
```bash
# No PowerShell (Windows)
Get-Content directus/setup-public-access.sql | docker exec -i leapy_pg psql -U postgres -d leapy

# No Linux/Mac
docker exec -i leapy_pg psql -U postgres -d leapy < directus/setup-public-access.sql
```

7. Verifique se os serviços estão rodando:
```bash
docker ps
```

Você deve ver os containers `leapy_pg` e `leapy_directus` rodando.

8. Acesse o Directus Admin em: http://localhost:8055
   - Email: `admin@example.com`
   - Senha: `admin`

### Frontend (Next.js)

1. Navegue até a pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o arquivo `.env.local` na pasta `frontend`:
```bash
# Windows PowerShell
New-Item -Path .env.local -ItemType File

# Linux/Mac
touch .env.local
```

4. Adicione as variáveis de ambiente no arquivo `.env.local`:
```env
# URL do Directus (backend)
# Ajuste a porta se você customizou no docker-compose.yml
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
```

**Nota**: O arquivo `.env.local` é necessário para o frontend funcionar. Ele não deve ser commitado no Git (já está no .gitignore).

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse a aplicação em: http://localhost:3000

### Verificação

- Backend: http://localhost:8055 (Directus Admin)
- Frontend: http://localhost:3000 (Interface de Talentos)
- API de exemplo: Use os exemplos em `api/rest.http` para testar endpoints/filters

## Esquema e Dados

- Os schemas estão em `directus/seed/schema.sql`:
  - `public.talents`
  - `public.internship_leaders`
  - `public.target_roles`
  - (o Directus provisiona `directus_users`)
- Os dados fictícios estão em `directus/seed/seed.sql` (~100 talentos, com relacionamentos válidos).

**Observação sobre busca por email**: Os `user_id` dos talents no seed são UUIDs aleatórios que não correspondem a usuários reais no Directus. Por isso, a busca por email não retorna resultados na prática, embora a funcionalidade esteja implementada corretamente. Para testar a busca, seria necessário criar usuários reais no Directus e associá-los aos talents.

## Decisões Técnicas

### Arquitetura

- **Next.js App Router**: Escolhido para aproveitar Server Components e melhor performance
- **API Routes como BFF**: Implementado para evitar problemas de CORS e permitir lógica server-side (ex: busca por email via dois passos)
- **TypeScript**: Usado para type safety e melhor DX

### Busca por Email

- **Problema**: Directus não permite filtrar diretamente por campos de relações aninhadas (`filter[user_id][email][_icontains]`) mesmo com permissões públicas
- **Solução**: Implementada busca em dois passos:
  1. Busca usuários por email usando `/users`
  2. Filtra talents pelos IDs dos usuários encontrados usando `filter[user_id][_in][]`

### Permissões Públicas

- **Decisão**: Configurar permissões públicas para desenvolvimento local (não recomendado para produção)
- **Implementação**: Script SQL (`setup-public-access.sql`) que configura permissões de leitura para todas as coleções necessárias

### Performance

- **Debounce**: 500ms para busca por email, reduzindo requisições desnecessárias
- **Carregamento de filtros**: Opções de filtros carregadas uma vez no mount, evitando múltiplas requisições (evita N+1)
- **Transições suaves**: Implementado `isTransitioning` para evitar "flickering" durante atualizações
- **Paginação server-side**: Implementada via API routes para carregar apenas os dados necessários

## Estrutura do Projeto

```
01-interface-talent/
├── directus/
│   ├── docker-compose.yml       # Configuração do Docker
│   ├── setup-public-access.sql  # Script de permissões públicas
│   └── seed/
│       ├── schema.sql           # Estrutura do banco de dados
│       └── seed.sql              # Dados fictícios
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/talents/     # API Routes (BFF)
│   │   │   ├── page.tsx         # Página principal
│   │   │   └── layout.tsx       # Layout raiz
│   │   ├── components/
│   │   │   └── TalentList.tsx  # Componente principal
│   │   └── lib/
│   │       └── directus.ts      # Cliente e tipos TypeScript
│   └── package.json
└── api/
    └── rest.http                 # Exemplos de endpoints
```

## Melhorias Futuras

1. **Acessibilidade**: Adicionar navegação por teclado completa e melhor suporte a leitores de tela
2. **Testes**: Implementar testes unitários e de integração
3. **Autenticação**: Implementar autenticação real ao invés de permissões públicas
4. **Validação de dados**: Adicionar validação de formulários e feedback visual mais robusto
5. **Internacionalização**: Suporte a múltiplos idiomas
6. **Exportação**: Adicionar suporte a outros formatos (Excel, JSON) além de CSV

## Exemplos de Endpoints

Consulte `api/rest.http` para exemplos de filtros, paginação e join para buscar por email.

## Referências

- [Directus Documentation](https://directus.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
