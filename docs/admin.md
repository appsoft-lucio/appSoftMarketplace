# Administração do marketplace

## Acesso

Entre com a conta administradora e abra Minha conta → Abrir painel administrativo,
ou diretamente `/admin`. A API consulta `marketplace_v2.users.role` a cada operação.
Metadados do Supabase, preferências de cadastro e valores do navegador não concedem acesso.
Usuários comuns recebem HTTP 403 nas rotas administrativas.

A primeira conta é promovida somente por manutenção no servidor:

```sh
npm run admin:grant --workspace @appsoft/api -- --email EMAIL_DA_CONTA
```

A conta precisa estar sincronizada em marketplace_v2.users (por exemplo, após um cadastro
de loja). O comando não cria usuários Auth, não recebe senha e não tem endpoint público.
Nesta entrega, a conta Teste 01 recebeu acesso após confirmação expressa do proprietário.

## Recursos

- Lista de lojas com filtros por situação, busca literal por nome/slug e paginação de 20 itens.
- Resumo de cadastros pendentes, aprovados e suspensos.
- Detalhes comerciais, responsáveis e data de cadastro.
- Aprovação/reativação e suspensão com motivo obrigatório (10 a 500 caracteres).
- Histórico das últimas 50 decisões, com autor, data, status anterior/novo e observação.

Aprovar o cadastro não cria assinatura nem cobrança. A vitrine continua exigindo loja
aprovada e assinatura ativa dentro do período. Suspensão não remove produtos, associações
ou pedidos. Não há envio automático de e-mails nesta entrega.

## API

- `GET /api/me`: retorna o papel da conta a partir do banco.
- `GET /api/admin/stores?status=pending&q=&page=1`: lista e resumo.
- `GET /api/admin/stores/:id/history`: histórico da loja.
- `PATCH /api/admin/stores/:id/status`: recebe status, expectedStatus e reason.

Somente `approved` e `suspended` são aceitos como destino. O servidor trava o registro
administrativo e a loja durante a decisão; alteração e histórico são gravados na mesma
transação. Status desatualizado retorna 409 sem sobrescrever outra decisão. O usuário deve
fechar a análise, atualizar a lista e abrir novamente a loja. Revogação de role no banco
vale na próxima chamada à API.

## Banco e testes

A migração 003 cria store_reviews com RLS, chaves estrangeiras e restrições. Foi aplicada
ao projeto novo sem mudar os cadastros existentes. Não há promoção automática em migração.

Os testes usam PostgreSQL temporário e sessões simuladas. Cobrem acesso 401/403, tentativa
de fingir role administrativa, aprovação, suspensão, reativação, conflito de status,
histórico, rollback quando a auditoria falha e revogação de acesso.

Validação real após publicar: entrar com Teste 01, abrir o painel, analisar a loja e escolher
explicitamente a decisão. Nenhuma loja real foi aprovada ou suspensa durante os testes.
# Consulta de clientes

O painel `/admin` tem as seções Lojas e Clientes. Clientes permite consultar as
contas por nome ou e-mail, com paginação de 20 registros, data de cadastro,
confirmação de e-mail, papel administrativo e quantidade de lojas vinculadas.

`GET /api/admin/customers?q=&page=1` exige autenticação e papel `admin` consultado
no banco. Usa `auth.users` como origem para incluir compradores sem loja, com
associação opcional ao perfil local. Exclui contas excluídas e anônimas. Retorna
apenas os campos necessários; senhas, tokens e metadados completos não são enviados.
É uma consulta somente leitura e não requer nova migração.
