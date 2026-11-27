# Frete e preparação de pedidos

Esta etapa prepara pedidos e reserva estoque por 30 minutos. O [Pix com Asaas](asaas.md)
pode ser habilitado no ambiente de homologação.

## Lojista

Em **Minhas lojas → Frete e retirada**, configure:

- Entrega habilitada e alcance: cidade da loja, estado ou Brasil.
- Frete base por pedido e prazo em dias úteis.
- Retirada sem frete, com endereço e condições nas observações.

Nada é habilitado por padrão. O alcance considera cidade/UF declaradas no endereço;
há validação de formato do CEP, sem consulta postal nem verificação automática da
correspondência CEP/cidade. Não há cálculo por distância, transportadora ou faixa
de CEP. O lojista deve escolher uma abrangência que consiga atender integralmente.

No checkout, o frete é separado por loja:

- Produto com frete fixo: valor do produto multiplicado pela quantidade.
- Produto com frete grátis: não acrescenta tarifa.
- Produto com frete a combinar: usa a tarifa base da loja, uma vez por pedido.
- Produto somente para retirada: impede a opção de entrega daquela loja.
- Retirada: frete zero para todos os itens; exige retirada habilitada na loja.

O prazo de entrega é o maior prazo entre loja e produtos. As observações de ambos
são copiadas para o pedido. Os pedidos da loja ficam em
`/minhas-lojas/:storeId/pedidos`, inclusive após vencimento ou suspensão.

## Comprador

`/finalizar-compra` exige login e carrinho com itens. O comprador informa o
destinatário, telefone e endereço, escolhe entrega/retirada de cada loja e revisa
os valores. Mudar os dados exige recalcular o resumo antes de reservar.

Preparar gera uma compra agrupadora e um pedido independente por loja. O servidor
revalida aprovação, assinatura, preço promocional, estoque/variação e entrega.
O estoque é debitado como reserva, com validade de 30 minutos. Não há cobrança.
O carrinho remove apenas as quantidades enviadas após resposta de sucesso.

Uma chave idempotente e o resumo enviado ficam na sessão do navegador até a
resposta ser conhecida. Se a conexão falhar, **Conferir e repetir tentativa** usa
a mesma chave. O servidor retorna a compra existente, sem debitar estoque outra vez.
Se o armazenamento do navegador não funcionar, a criação não é enviada.

Em **Minha conta → Meus pedidos**, é possível consultar os últimos 100 pedidos e
cancelar todos os pedidos pendentes da mesma compra. O histórico conserva nomes,
preços, tamanhos, quantidades, endereço e condições de entrega da compra.

## Transação e reservas

Criação, itens, auditoria e estoque são gravados na mesma transação. Locks seguem
ordem estável por loja, produto e variação. A soma é calculada no servidor;
valores enviados pelo navegador não substituem os preços do catálogo.
Preço/frete alterado após a revisão exige um novo resumo.

Cancelar ou vencer a reserva muda o pedido pendente para cancelado e devolve
as quantidades uma única vez, inclusive de variações. O produto com reserva ativa
fica bloqueado para edição, evitando apagar ou substituir o estoque reservado.

A expiração é processada sob demanda ao consultar catálogo, produto, carrinho,
checkout, pedidos ou gestão de produtos/frete. Se o sistema ficar ocioso, a baixa
administrativa ocorre na próxima consulta; a reserva vencida é liberada antes
de uma nova cotação/compra. Não foi configurado um cron nem um processo externo.
O botão **Atualizar pedidos** atualiza o status exibido numa tela já aberta.

## API

- `GET/PUT /api/stores/:storeId/shipping`: configuração, exige proprietário.
- `GET /api/stores/:storeId/orders`: pedidos apenas da loja autorizada.
- `POST /api/checkout/quote`: endereço, itens e métodos; retorna resumo e token.
- `POST /api/checkouts`: os mesmos dados, token e chave UUID idempotente.
- `GET /api/orders`: pedidos apenas do comprador autenticado.
- `POST /api/checkouts/:id/cancel`: cancela a compra do próprio comprador.

As rotas usam o token de sessão verificado no servidor. O lojista só vê dados
de entrega dos pedidos da sua loja. Não há endpoint para o navegador marcar pago.

## Ativação e próximos passos

Aplicar `006_checkout_shipping.sql` após 001–005, antes de publicar a API nova.
A migração cria a configuração por loja, campos de reserva e a função de
liberação. Não ativa frete, cria pedidos ou cobra clientes. Não foi aplicada
automaticamente ao Supabase nesta entrega.

Faltam o fluxo de produção, repasses aos lojistas, estornos e expedição. Antes de compras pagas,
validar concorrência contra PostgreSQL real e decidir a abrangência operacional
de entrega. Os testes atuais usam PGlite temporário, sem banco de produção.
