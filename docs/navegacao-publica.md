# Navegação pública e carrinho

Visitantes podem acessar `/catalogo`, `/lojas`, `/loja/:slug`, `/produto/:id`
e `/carrinho` sem conta. O catálogo continua exibindo apenas lojas aprovadas
com assinatura vigente e produtos ativos com estoque disponível.

O carrinho guarda somente identificadores, tamanhos e quantidades no navegador,
com formato versionado. Permanece após login no mesmo navegador; não existe
sincronização com a conta ou entre dispositivos. A API recalcula preços e
disponibilidade antes de permitir continuar. Adicionar não reserva estoque.

Para continuar, o visitante entra ou cria uma conta. `/finalizar-compra` exige
autenticação e informa que frete e pagamento ainda estão em desenvolvimento.
Nenhum pedido ou cobrança é criado nesta etapa.

A gestão das lojas fica nas rotas protegidas `/minhas-lojas` e
`/minhas-lojas/nova`. A rota antiga `/lojas/nova` redireciona para o cadastro.

As APIs públicas retornam somente os dados da vitrine, sem dados dos
proprietários ou contatos privados. Esta entrega não requer nova migração.
