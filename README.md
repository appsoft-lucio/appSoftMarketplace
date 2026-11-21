# AppSoft Marketplace

Marketplace com React/Vite, API Express e PostgreSQL no Supabase.
Frontend e backend são publicados no mesmo projeto Vercel.

## Desenvolvimento local

Requer Node.js 22.13 ou superior (na Vercel, selecione Node.js 22.x).

1. No diretório `backend`, execute `npm ci`, configure `.env` e execute `npm run dev`.
2. No diretório `frontend`, execute `npm ci` e `npm run dev`.

O frontend usa `http://localhost:4000/api` no desenvolvimento. No build de produção,
usa `/api`, no próprio domínio, salvo se `VITE_API_URL` definir outro endereço.
Detalhes: [backend](backend/README.md) e [frontend](frontend/README.md).

## Publicar no projeto Vercel existente

A publicação precisa usar a raiz do repositório, incluindo `api/`, `backend/`
e `frontend/`. Usar somente `frontend` como Root Directory não publica a API.

No projeto `appsoftmarketplace`, abra Settings → Build and Deployment:

| Campo | Valor |
| --- | --- |
| Root Directory | Raiz do repositório (`./`), removendo `frontend` |
| Framework Preset | Other |
| Node.js Version | 22.x |

O `vercel.json` na raiz já configura instalação, build, saída e rotas. Remova
overrides antigos no painel que apontem somente para o frontend, se houver.

A instalação executa `npm ci --prefix backend --omit=dev` e
`npm ci --prefix frontend --include=dev`. O build executa `npm run build` na raiz
e publica `frontend/dist`. A API entra por `api/index.js`, que exporta o Express
sem abrir uma porta HTTP.

## Variáveis de ambiente na Vercel

Em Settings → Environment Variables, configure para Production:

| Nome | Valor |
| --- | --- |
| `DATABASE_URL` | Conexão do Supabase → Connect → Transaction pooler (porta 6543) |
| `DATABASE_SCHEMA` | `appsoft` |
| `JWT_SECRET` | Um segredo aleatório forte, exclusivo do projeto |
| `FRONTEND_URL` | `https://appsoftmarketplace.vercel.app` |
| `VITE_API_URL` | `/api` |

Remova valores antigos de `VITE_API_URL` que apontem para localhost.
O arquivo `backend/.env` não é enviado à Vercel. Copie os valores diretamente
no painel, sem expor a conexão ou a senha em capturas de tela.

O certificado público `backend/certs/supabase-ca.crt` acompanha a função.
Não configure `DATABASE_CA_FILE` com um caminho local do Windows na hospedagem.
O pool PostgreSQL é reutilizado entre chamadas e registrado com o helper oficial
`attachDatabasePool`. Não executamos migrações nem importações durante requisições.

Os dados já foram migrados para o schema `appsoft`. Em um banco novo, execute
`npm run db:migrate` no backend antes da publicação. Não repita a importação
SQLite em um destino que já contém dados.

Para Preview, use um banco/schema de teste próprio com as tabelas criadas.
Não copie as credenciais do banco de produção para previews de código não revisado.

## Enviar e publicar

Depois de salvar a configuração no painel, envie o commit ao GitHub. Se a
publicação não iniciar automaticamente, abra Deployments e execute Redeploy,
usando o commit atualizado.

Valide:

1. `https://appsoftmarketplace.vercel.app/api/health` responde JSON com `status: ok`.
2. `/login` e `/cadastro` abrem diretamente e continuam funcionando ao atualizar.
3. Cadastro, login e compra funcionam no navegador.
4. `/api/rota-inexistente` responde 404 JSON, sem carregar a interface React.

O service worker da PWA não substitui as rotas `/api` pela página em cache.

## Verificação local

Na raiz:

```sh
npm test
npm run build
```

No backend, `npm run test:postgres` executa os testes em um schema temporário no
Supabase e inclui concorrência de compras. O schema de produção não é limpo.
