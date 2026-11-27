# Pix com Asaas em homologação

O comprador prepara a reserva e abre **Meus pedidos → Pagar compra com Pix de teste**. O Asaas hospeda a página e coleta os dados do pagador. O valor vem dos pedidos gravados, com frete, e uma sessão Pix cobre toda a compra, inclusive quando há várias lojas.

1. Aplique as migrações 001 a 009 no banco de homologação.
2. Configure no servidor `ASAAS_SANDBOX_API_KEY` com a chave da conta Sandbox, `ASAAS_WEBHOOK_TOKEN` com um segredo exclusivo de pelo menos 32 caracteres e `ASAAS_RETURN_ORIGIN` com a origem HTTPS do site de homologação.
3. Na conta Sandbox, configure um webhook sequencial para `https://<origem>/api/webhooks/asaas` com o mesmo segredo. Selecione `CHECKOUT_PAID`, `CHECKOUT_CANCELED` e `CHECKOUT_EXPIRED`.
4. Faça uma reserva e abra o Pix de teste. Simule a confirmação no Asaas, retorne a **Meus pedidos** e atualize a lista. Os pedidos devem passar para **Em preparação**. Repita com cancelamento ou expiração e confira a devolução das unidades.

A sessão Pix dura 10 minutos e só pode ser iniciada com mais de 11 minutos de reserva restantes. O cancelamento de uma sessão aberta ocorre na página do Asaas. O webhook autenticado confirma o pagamento e atualiza os pedidos. Eventos repetidos preservam a transição já realizada.

Se o estoque já foi devolvido quando chega a confirmação, a compra fica com `asaas_status = 'review'` para conferência no Sandbox. Se a criação tiver resposta ambígua, fica como `creating`, impedindo uma segunda sessão para a mesma reserva. Use o ID da compra como referência ao conferir esses casos no Asaas.

A integração é limitada ao Sandbox. Split entre lojistas, assinaturas e estornos estão fora deste fluxo.

[Checkout Pix no Asaas](https://docs.asaas.com/docs/checkout-para-pix) · [Eventos de checkout](https://docs.asaas.com/docs/checkout-events)
