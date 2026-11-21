# AppSoft Marketplace

Nova base local em React + Vite + TypeScript, API Node.js e modelo PostgreSQL.
Esta versão substitui o código antigo; as imagens originais estão em `imagens/`.

## Executar

Requer Node.js 22.13 ou superior da série 22 e npm.

```sh
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. Em outro terminal:

```sh
npm run dev:api
```

A API responde em http://127.0.0.1:4000/api/health. O Vite encaminha `/api` à API local.

```sh
npm run typecheck
npm test
npm run build
```

## Estrutura

- `apps/web`: interface React/Vite (`.tsx`). A tela inicial é provisória.
- `apps/api`: API Node.js (`.ts`), atualmente somente liveness.
- `packages/domain`: regras compartilhadas e tipos TypeScript.
- `database/migrations`: modelo SQL versionado, ainda não aplicado ao Supabase.
- `database/test`: validação do SQL em PostgreSQL temporário com PGlite, sem acesso ao banco real.
- `docs/escopo.md`: requisitos e próximos passos.
- `docs/banco.md`: organização e limites do modelo.
- `imagens`: imagens preservadas do projeto anterior.

## Estado desta entrega

Estrutura executável, TypeScript estrito, regras iniciais e modelo SQL testável.
Login, autorização das rotas comerciais, CRUD, checkout, assinatura e pagamentos ainda não estão implementados.
A API de saúde não verifica banco de dados. Não há banco real conectado, migração aplicada ou novo deploy.
Não use esta base para receber pagamentos ou publicar uma operação comercial ainda.
O aplicativo antigo na Vercel e os dados antigos no Supabase não foram alterados.

## Referências

- Vite: https://vite.dev/guide/
- TypeScript: https://www.typescriptlang.org/docs/
- Testes Node.js: https://nodejs.org/download/release/latest-jod/docs/api/test.html
