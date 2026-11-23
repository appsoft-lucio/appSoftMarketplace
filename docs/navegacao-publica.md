# Navegação pública e carrinho

Visitantes podem acessar `/catalogo`, `/lojas`, `/loja/:slug`, `/produto/:id`
e `/carrinho` sem conta. O catálogo continua exibindo apenas lojas aprovadas
com assinatura vigente e produtos ativos com estoque disponível.

O carrinho guarda somente identificadores, tamanhos e quantidades no navegador,
com formato versionado. Permanece após login no mesmo navegador; não existe
sincronização com a conta ou entre dispositivos. A API recalcula preços e
disponibilidade antes de permitir continuar. Adicionar não reserva estoque.

Para continuar, o visitante entra ou cria uma conta. `/finalizar-compra` exige
autenticação e permite revisar endereço, frete por loja e preparar pedidos com
reserva temporária de estoque. O pagamento ainda não está disponível e nenhuma
cobrança é realizada. Consulte [checkout e frete](checkout.md).

A gestão das lojas fica nas rotas protegidas `/minhas-lojas` e
`/minhas-lojas/nova`. A rota antiga `/lojas/nova` redireciona para o cadastro.

As APIs públicas retornam somente os dados da vitrine, sem dados dos
proprietários ou contatos privados. Esta entrega não requer nova migração.
