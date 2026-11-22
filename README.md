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

Base TypeScript com telas de cadastro, login, confirmação de e-mail, recuperação
 e redefinição de senha integradas ao SDK do Supabase. Para ativar, configure as
variáveis públicas e as URLs no provedor conforme [autenticação](docs/autenticacao.md).
Sem configuração, os formulários permanecem bloqueados.

A conta é criada no Supabase Auth. O cadastro de lojas está implementado e documentado em [lojas](docs/lojas.md). A gravação real depende da configuração do backend e da aplicação explícita das migrações.

O [painel administrativo](docs/admin.md) permite analisar, aprovar e suspender lojas. A migração 003 e o acesso inicial da conta Teste 01 já foram aplicados.

O [catálogo com filtros](docs/catalogo.md) está em /catalogo, com categorias laterais, subcategorias, preço, tamanhos e lojas.

Outros recursos, como
gestão de produtos, checkout, assinatura e pagamentos ainda
serão implementados. A API de saúde não verifica banco de dados. As migrações 001, 002 e 003 foram aplicadas ao projeto Supabase novo. Não receba pagamentos nesta etapa.

## Estilos

Lojas, produtos e carrinho podem ser explorados sem conta. Consulte
[navegação pública](docs/navegacao-publica.md) para as rotas e os limites desta etapa.

Tema, tipografia e medidas ficam em `apps/web/src/styles`. Páginas e componentes têm CSS próprio. Consulte [organização dos estilos](docs/estilos.md).

## Referências

- Vite: https://vite.dev/guide/
- TypeScript: https://www.typescriptlang.org/docs/
- Testes Node.js: https://nodejs.org/download/release/latest-jod/docs/api/test.html
