# AppSoft Marketplace — frontend

Interface React com Vite e React Router. A API Express fica em `../backend` e
usa PostgreSQL no Supabase. Consulte [as instruções do backend](../backend/README.md)
para configurar a conexão, criar as tabelas e importar dados do SQLite antigo.

## Desenvolvimento

No diretório `backend`, após configurar o banco:

```sh
npm install
npm run db:migrate
npm run dev
```

Em outro terminal, no diretório `frontend`:

```sh
npm install
npm run dev
```

A API usa a porta 4000 e o Vite usa a porta 5173 por padrão.

## Endereço da API

Copie `frontend/.env.example` para `frontend/.env` e configure:

```dotenv
VITE_API_URL=http://localhost:4000/api
```

Inclua `/api` na URL. No desenvolvimento, sem essa variável, o frontend usa o
endereço local acima. Em produção, o padrão é `/api`, no mesmo domínio da interface. A variável é
opcional e pode apontar para outra API pública com HTTPS, se necessário.

Reinicie o Vite após alterar o arquivo. Em produção, configure a variável antes
de executar `npm run build`: ela é incorporada aos arquivos gerados e é pública.
Configure também `FRONTEND_URL` no backend com a origem do frontend para o CORS.
Nunca coloque a conexão PostgreSQL ou a senha do banco em variáveis `VITE_`.

## Navegação e publicação

As telas têm URLs próprias: `/`, `/login`, `/cadastro`, `/recuperar-senha`,
`/carrinho`, `/perfil`, `/vendedor` e `/vendedor/painel`.
Carrinho e perfil exigem sessão local; o painel exige perfil vendedor.
O backend continua responsável por validar o JWT e as permissões.

Ao publicar `dist/`, configure a hospedagem para servir `index.html` nas rotas
que não correspondem a arquivos estáticos. Isso permite abrir links diretamente
e atualizar a página. O Vite já oferece esse comportamento no desenvolvimento.

## Verificação

No frontend, execute `npm run build` e `npm run lint`.
No backend, execute `npm test` para os testes isolados com PostgreSQL em memória
ou `npm run test:postgres` para incluir concorrência em um schema temporário no
PostgreSQL real. Nenhum desses testes usa os dados do schema `appsoft`.

## Vercel

A publicação usa a raiz do repositório, com frontend e API no mesmo projeto.
Consulte [o guia de publicação](../README.md). No painel, Root Directory deve
ser a raiz (`./`), e `VITE_API_URL` deve ser `/api` ou ficar ausente.
