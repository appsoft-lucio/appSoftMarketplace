# AppSoft Marketplace ? frontend

Interface React com Vite e React Router. O backend fica em `../backend`.

## Desenvolvimento

No diret?rio `backend`, instale as depend?ncias e execute a API:

```sh
npm install
npm run dev
```

Em outro terminal, no diret?rio `frontend`:

```sh
npm install
npm run dev
```

A API usa a porta 4000 e o Vite usa a porta 5173 por padr?o. As op??es do
backend est?o em `backend/.env.example`.

## Endere?o da API

Copie `frontend/.env.example` para `frontend/.env` e configure:

```dotenv
VITE_API_URL=http://localhost:4000/api
```

Inclua `/api` na URL. Sem essa vari?vel, o frontend usa o endere?o local acima.
Reinicie o Vite ap?s alterar o arquivo. Em produ??o, configure a vari?vel antes
de executar `npm run build`: ela ? incorporada aos arquivos gerados e ? p?blica.
Configure tamb?m `FRONTEND_URL` no backend com a origem do frontend para o CORS.

## Navega??o e publica??o

As telas t?m URLs pr?prias: `/`, `/login`, `/cadastro`, `/recuperar-senha`,
`/carrinho`, `/perfil`, `/vendedor` e `/vendedor/painel`.
Carrinho e perfil exigem sess?o local; o painel exige perfil vendedor.
O backend continua respons?vel por validar o JWT e as permiss?es.

Ao publicar `dist/`, configure a hospedagem para servir `index.html` nas rotas
que n?o correspondem a arquivos est?ticos. Isso permite abrir links diretamente
e atualizar a p?gina. O Vite j? oferece esse comportamento no desenvolvimento.

## Verifica??o

No frontend, execute `npm run build` e `npm run lint`.
No backend, execute `npm test`. O teste de integra??o inicia uma API em uma
porta tempor?ria e usa um banco SQLite em uma pasta tempor?ria, sem acessar
`backend/data/appsoft.db`. Ele verifica login, permiss?es, cadastro de produto,
quantidade e estoque, checkout e listagem do pedido para cliente e vendedor.
