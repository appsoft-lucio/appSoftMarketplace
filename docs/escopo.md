# Escopo da primeira versão

## Regras confirmadas

- Marketplace único da AppSoft para 30 lojas ou mais, sem limite artificial de lojas no modelo.
- Receita inicial somente de assinaturas, sem comissão por venda.
- Básico: R$ 200/mês e até 50 produtos ativos por loja. Rascunhos e inativos não consomem vagas.
- Cobrança por 1, 3, 6 ou 12 meses. Sem descontos definidos: R$ 200, R$ 600, R$ 1.200 e R$ 2.400.
- Comprador paga no site. Cada lojista configura e assume sua entrega.
- Loja vencida sai da vitrine e não recebe novas compras; mantém painel, dados e pedidos anteriores.
- Médio e Pro serão definidos depois. Não vender planos nem recursos ainda não definidos.

## Organização

Um usuário pode comprar e administrar uma loja. A associação entre usuário e loja é explícita;
ser vendedor não concede acesso a outras lojas. O administrador do marketplace tem papel próprio.
Lojas novas aguardam aprovação. Aprovação administrativa e assinatura válida são condições independentes.

Uma compra com várias lojas gera um pedido por loja, cada um com frete e status próprios.
O comprador terá um agrupamento da compra. O lojista verá apenas seus itens e pedidos.
Assinatura não deve ser exigida para concluir um pedido já existente ou consultar seu histórico.

## Próximas entregas

1. Escolher autenticação, implementar sessão no servidor, associações e autorização por loja.
2. Cadastro e aprovação de lojas; catálogo e produtos com limite de ativações.
3. Escolher provedor de pagamentos com suporte ao modelo de marketplace e assinaturas.
4. Cobranças, renovação e webhooks autenticados e idempotentes.
5. Carrinho, cálculo de frete por loja, reserva de estoque e checkout transacional.
6. Painéis do comprador, lojista e administrador; testes completos antes de publicar.

## Decisões pendentes

- Provedor de autenticação e identidade dos lojistas.
- Provedor de pagamentos, recebimento direto/split, taxas e responsabilidade por estornos.
- Renovação automática ou manual, notificações e política de cancelamento da assinatura.
- Áreas atendidas e cálculo do frete (CEP, distância, tabela ou valor fixo).
- Carga de treinamento, canais e horários de suporte do Básico.
- Identidade visual, páginas e experiência de navegação da nova versão.

A base não implementa cobrança, split, cadastro ou entrega. Nenhuma integração financeira será simulada como concluída.
