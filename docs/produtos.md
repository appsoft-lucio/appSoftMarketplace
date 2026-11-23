# Gestão de produtos

Em **Minhas lojas → Gerenciar produtos**, cada proprietário cadastra e edita o
catálogo da própria loja. Rota: `/minhas-lojas/:storeId/produtos`.

## Campos e regras

- Nome, descrição completa, marca e código interno (SKU).
- Categoria/subcategoria com o caminho completo da taxonomia. Escolher uma
  subcategoria também permite encontrar o produto nas categorias superiores.
- Preço normal e promocional opcional. A promoção deve ser positiva e menor
  que o preço normal. Apagar o preço promocional encerra a oferta. Catálogo,
  filtros, ordenação e cotação do carrinho usam o preço vigente.
- Até oito fotos com upload JPG/PNG/WebP ou link HTTPS. A primeira é a capa;
  pode-se trocar a capa e remover fotos. O navegador reduz uploads para JPEG
  de até 1200 pixels no maior lado e 200 KB por imagem, mantendo a proporção.
  Qualidade e dimensões são ajustadas progressivamente até atingir o limite.
  Links HTTPS externos mantêm o arquivo hospedado na origem; para garantir
  a otimização, prefira enviar o arquivo pelo campo de upload.
- Estoque geral ou até 50 variações identificadas por tamanho/cor/opção, com
  estoque próprio. Não são aceitas variações repetidas. Para combinar atributos,
  use uma identificação como `Azul / P`.
- Frete a combinar, grátis, fixo por produto ou retirada, com condições,
  prazo estimado em dias úteis e peso embalado em gramas.
- Rascunho/inativo ou ativo. Ativar exige foto e estoque. O banco mantém o limite
  transacional de 50 ativos por loja. Esgotar estoque oculta o produto público,
  mas não o desativa automaticamente nem libera vaga.

Produtos podem ser preparados antes da aprovação/assinatura. A vitrine exige
loja aprovada, assinatura vigente e estoque. A listagem permite buscar por
nome/SKU e filtrar ativos e rascunhos. Para retirar da vitrine, edite e desmarque
**Ativar produto**; não há exclusão definitiva.

## API e persistência

- `GET /api/stores/:storeId/products`: produtos e categorias para o editor.
- `POST /api/stores/:storeId/products`: criar produto.
- `PUT /api/stores/:storeId/products/:productId`: editar produto completo.

As rotas exigem token verificado e associação explícita à loja. A autorização,
a gravação do produto e a substituição de fotos/variações ocorrem na mesma
transação, serializada pela loja. Categoria e identificadores são validados.

Uploads são persistidos como URLs de dados JPEG em `product_images`, junto
dos links externos; não exigem bucket. Substituir por armazenamento de objetos
quando o volume crescer: o editor atualmente carrega todas as fotos da loja.

## Ativação

Aplicar `database/migrations/005_product_management.sql` após 001–004,
antes de publicar a API nova. Não cria produtos nem ativa assinaturas e
preserva os preços existentes. Não foi aplicada automaticamente ao Supabase.

O frete cadastrado é informativo na página do produto. O carrinho apresenta
subtotal dos produtos; somar fretes por loja, validar área atendida, reservar
estoque e criar pedidos continuam sendo etapas do checkout.

## Verificação

`npm test` cobre isolamento entre lojas, criação/edição, fotos e variações,
promoção nos filtros e no carrinho, término da promoção, limite do plano e
tratamento de erros no formulário. `npm run build` verifica TypeScript e o pacote.
