# Verificação do checkout — 23/11/2026

Verificação realizada contra o Supabase configurado no backend local, sem publicar
nova versão na Vercel e sem realizar cobranças ou criar contas de autenticação.

## Migrações e banco

- Histórico inicial: 001–004. Aplicadas 005 e 006 pelo runner versionado.
- Histórico final: 001–006; dois usuários e duas lojas existentes preservados.
- RLS habilitada nas 21 tabelas do schema `marketplace_v2`.
- A conexão do frontend e a do backend apontam para o mesmo projeto Supabase.

## Fluxo no PostgreSQL real

O script cria duas lojas, produtos e pedidos temporários dentro de uma única
transação, sempre encerrada com `ROLLBACK`. Não cria contas no Supabase Auth,
não envia e-mails e não deixa lojas de teste visíveis para outras conexões.

Confirmado:

- Promoção e frete por loja: produtos R$ 240,00 + frete R$ 15,00 = R$ 255,00.
- Retirada sem frete e bloqueio da entrega fora da cidade configurada.
- Isolamento de proprietários e consulta dos pedidos apenas do comprador.
- Uma compra com dois pedidos; repetição da chave sem duplicação nem novo débito.
- Cancelamento repetido devolve estoques geral e de variação uma única vez.
- Expiração repetida cancela a reserva e devolve o estoque uma única vez.
- Após o rollback, nenhuma loja temporária permaneceu no banco.

Reexecutar usando a conexão definida no backend:

```sh
npm run db:verify-checkout --workspace @appsoft/api
```

Esse teste é sequencial, numa conexão real. Não substitui uma prova de
concorrência com múltiplas sessões, autenticação no navegador ou teste em celular.

## Respostas HTTP locais

Servidores já existentes em `127.0.0.1:4000` e `127.0.0.1:5173`:

| Requisição | Resultado |
| --- | --- |
| API `/api/health` | 200, banco configurado |
| API `/api/catalog` | 200, 19 categorias, sem produtos públicos elegíveis |
| API `/api/orders` sem token | 401, exige login |
| Web `/finalizar-compra` | 200, HTML da aplicação |
| Web `/api/catalog` via proxy | 200, resposta do catálogo |

Receber o HTML não confirma a renderização nem o funcionamento dos formulários.
Não havia navegador conectado à sessão, portanto não foi possível executar
o fluxo visual com login, viewport de celular ou conexão limitada.

## Validação visual pendente

Com o navegador conectado, usar duas contas de teste:

1. Entrar, preparar produtos e frete de duas lojas próprias de teste; garantir
   aprovação e assinatura elegíveis nesse ambiente.
2. Comprar itens das duas lojas, conferir o total e escolher entrega/retirada.
3. Com conexão limitada, repetir uma tentativa cuja resposta se perdeu e verificar
   que não surgiu uma segunda compra.
4. Conferir os pedidos do comprador e o isolamento dos pedidos de cada lojista.
5. Cancelar, depois repetir deixando vencer; conferir estoque e histórico.
6. Em viewport de celular, conferir formulários, seletores, mensagens e navegação.

O catálogo real permaneceu vazio durante esta verificação: os dados sintéticos
utilizados no teste de banco foram descartados, sem ativar lojas ou assinaturas
existentes para preencher a vitrine.
