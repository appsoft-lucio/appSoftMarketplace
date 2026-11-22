# Modelo PostgreSQL

Arquivo: `database/migrations/001_initial.sql`. Schema novo: `marketplace_v2`.
As migrações 001 e 002 foram aplicadas ao projeto Supabase novo. O schema antigo `appsoft` não é referenciado nem modificado.
A migração falha se `marketplace_v2` já existir; ela não apaga nem reaproveita dados existentes.

## Grupos de tabelas

| Grupo | Tabelas | Propósito |
| --- | --- | --- |
| Identidade | users, stores, store_members | Usuários, lojas e propriedade |
| Assinatura | plans, subscriptions, subscription_invoices | Plano Básico, período de acesso e histórico de cobranças |
| Catálogo | categories, products, product_images | Produtos por loja e imagens |
| Carrinho e frete | carts, cart_items, shipping_options | Carrinho e opções de entrega por loja |
| Compras | checkouts, store_orders, order_items, order_events | Compra agrupada e pedido independente por loja |
| Integrações | order_payments, webhook_events | Referências de pagamento e deduplicação de eventos |

Valores monetários são inteiros em centavos (BRL). Identificadores UUID, datas com fuso.
Nomes e preços dos produtos e informações da entrega são copiados para o pedido como histórico.
Não existem exclusões em cascata de registros comerciais; produtos e lojas devem ser desativados.

## Proteções iniciais

- Trigger limita produtos ativos segundo o plano; trava a loja durante ativações concorrentes.
- Não é permitido transferir um produto para outra loja.
- Chaves compostas impedem vincular produto de outra loja a um pedido.
- `visible_stores` exige aprovação e assinatura ativa dentro do período, com fim exclusivo.
- Assinatura vencida não altera produtos, pedidos ou associações de usuários.
- RLS habilitada em todas as tabelas, sem políticas públicas. Nenhum acesso pelo navegador está concedido.
- A futura API deverá usar credenciais somente no servidor e validar identidade e loja em toda operação.
  RLS sem políticas não substitui autorização da API quando a conexão usa o proprietário das tabelas.

## Ainda precisa ser implementado

O SQL é a fundação, não um checkout completo. Antes de compras reais, implementar:

- validação de vitrine/assinatura no checkout, sem confiar no frontend;
- preço e estoque lidos no servidor, locks, reserva e liberação após falha/cancelamento;
- soma dos itens e fretes verificada na transação de checkout;
- transições de status, trilha de auditoria e confirmação exclusiva por webhook válido;
- pagamentos de várias lojas, repasses, reembolsos e eventos duplicados;
- renovação idempotente e aplicação de períodos pagos;
- credencial restrita de aplicação, políticas de acesso e testes contra PostgreSQL real.

O comando manual de migração está documentado em [lojas](lojas.md). Só deve ser executado após conferir o banco de destino.
Os testes usam um PostgreSQL temporário local em memória, sem credenciais.
