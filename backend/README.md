# AppSoft Marketplace — backend

API Express com PostgreSQL (Supabase). Requer Node.js 22.13 ou superior.

## Configurar a conexão

No diretório `backend`, execute `npm install`. Copie `.env.example` para
`.env` apenas se ainda não existir e preencha `DATABASE_URL` com a conexão
PostgreSQL do painel Connect → Session pooler. Não use a URL HTTP do projeto.

Se a senha tiver caracteres especiais, codifique esses caracteres para uso em
URL. A conexão fica somente no backend e nunca deve usar o prefixo `VITE_`.

Variáveis:

- `DATABASE_URL`: conexão PostgreSQL com usuário, senha, host, porta e banco.
- `DATABASE_SCHEMA`: schema da aplicação; padrão `appsoft`.
- `DATABASE_CA_FILE`: caminho opcional do certificado raiz do Supabase.
- `JWT_SECRET`: segredo do JWT; use um valor forte e exclusivo em produção.
- `FRONTEND_URL`: origem permitida pelo CORS; localmente `http://localhost:5173`.
- `PORT`: porta HTTP; padrão 4000.

O backend usa TLS com verificação do certificado nas conexões remotas.
No Supabase, baixe o certificado em Database → Settings → SSL Configuration.
Salve em `backend/certs/supabase-ca.crt`; esse caminho é detectado automaticamente.
Também é possível usar `DATABASE_CA_FILE` para apontar para outro arquivo.
O certificado raiz é público e pode acompanhar o código; a senha nunca deve
acompanhar o código. A Data API do Supabase não é necessária.

## Criar as tabelas e iniciar

Com o certificado e a conexão configurados:

```sh
npm run db:migrate
npm run dev
```

A migração cria/verifica as tabelas no schema `appsoft`, sem apagar dados.
Ela não modifica os schemas internos do Supabase. O servidor verifica se a
tabela de usuários está acessível antes de aceitar requisições.

As tabelas são `users`, `products`, `cart_items`, `orders` e `order_items`.
Valores monetários usam `NUMERIC(14, 2)` e são devolvidos como números na API.
O checkout usa uma transação e bloqueios de linhas para proteger o estoque.
Usuários de demonstração não são criados automaticamente.

## Importar os dados do SQLite existente

Pare qualquer API antiga que ainda esteja escrevendo no SQLite. Faça uma cópia
do arquivo `backend/data/appsoft.db` como backup. Depois de criar as tabelas,
e antes de cadastrar contas no novo banco, execute:

```sh
npm run db:import-sqlite
```

O comando lê o SQLite em modo somente leitura, preservando IDs, hashes de senha,
produtos, carrinhos e pedidos. Ele copia os dados em uma transação PostgreSQL e
ajusta as sequências dos IDs. Exige que todas as tabelas de destino estejam
vazias; se já houver dados, aborta sem sobrescrever registros.
Um caminho alternativo pode ser passado após `--`.

O arquivo SQLite permanece intacto e não é mais usado pela API. As contas
importadas mantêm as senhas anteriores, inclusive eventuais contas de demonstração.

## Testes

```sh
npm test
```

Usa PGlite (PostgreSQL em memória) via protocolo PostgreSQL e driver `pg`.
Não acessa o Supabase nem o SQLite local. Verifica importação, autenticação,
permissões, produtos, carrinho, checkout e rollback após uma falha parcial.

Para verificar também concorrência em PostgreSQL real:

```sh
npm run test:postgres
```

Usa a conexão do `.env`, cria um schema exclusivo `appsoft_test_<id>` e o remove
ao final. Nunca limpa o schema `appsoft`. Requer permissão para criar schemas.
O teste de concorrência é ignorado no PGlite porque ele usa uma única conexão
interna e não representa os bloqueios entre sessões de um servidor PostgreSQL.

## Publicação

Ainda é necessário hospedar a API Express. Na hospedagem, configure
`DATABASE_URL`, o certificado, `JWT_SECRET` e
`FRONTEND_URL=https://appsoftmarketplace.vercel.app`.
Execute a migração antes de iniciar a API com `npm start`.

No frontend da Vercel, configure `VITE_API_URL=https://HOST_DA_API/api` e gere uma
nova publicação. A URL HTTP do projeto Supabase não substitui a URL da API
Express. `GET /api/health` deve responder `{"status":"ok"}`.
