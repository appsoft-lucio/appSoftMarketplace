# Catálogo com categorias e filtros

Rota pública: /catalogo. O catálogo não exige login. Dados vêm de GET /api/catalog,
sem expor usuários, responsáveis, telefones ou dados de pagamento.

## Interface

- Menu lateral com categorias expansíveis e subcategorias em até três níveis na taxonomia inicial.
- Selecionar uma categoria inclui os produtos das suas descendentes.
- Preço mínimo/máximo, múltiplos tamanhos e múltiplas lojas combináveis.
- Busca de produtos por nome/descrição e busca local pelo nome da loja no filtro.
- Filtros aplicados acima dos resultados, remoção individual e limpeza geral.
- Ordenação por novidades ou preço, paginação e detalhes do produto.
- No celular, painel modal de filtros; Escape/Fechar retorna ao catálogo.
- Filtros ficam na URL, preservados ao atualizar, compartilhar e navegar pelo histórico.

O intervalo de preço é inclusivo. A API converte valores decimais para centavos sem
usar arredondamento de ponto flutuante. Tamanhos e lojas são OR dentro de cada grupo;
grupos diferentes são combinados com AND. Busca é literal e não diferencia maiúsculas.
As opções de lojas/tamanhos correspondem ao catálogo elegível geral, não são contagens
calculadas a partir de cada filtro aplicado. Cada página retorna até 24 produtos.

## Elegibilidade

A API lista somente produtos ativos com disponibilidade, de lojas aprovadas com
assinatura ativa no período atual. Lojas vencidas ou suspensas não aparecem nem
nas opções do filtro. Produtos com variações são considerados disponíveis somente
se uma variação tem estoque; tamanho sem estoque nunca corresponde ao filtro.
Produto sem variação usa o estoque geral existente. Resultados não se duplicam
quando um produto corresponde a mais de um tamanho selecionado.

A migração 004 adiciona parent_id às categorias, impede ciclos na hierarquia e cria
product_variants com tamanho/estoque próprio e RLS. Inclui categorias iniciais de moda,
eletrônicos, casa, esporte e beleza. Não cria produtos, lojas, assinaturas ou vendas.
Não altera o estado de aprovação das lojas existentes.

## Limites desta etapa

Cadastro/edição de produtos, upload de fotos e gestão das variações estão no
[painel de produtos](produtos.md). O [carrinho](navegacao-publica.md) permite cotar
itens; o checkout ainda será implementado. O catálogo pode estar vazio até haver produtos elegíveis.
Não há produtos fictícios para esconder esse estado. Produtos com tamanhos deverão
ser cadastrados pelo editor com a quantidade de cada variação; o estoque de
checkout também deverá reservar a variação específica em transação.

A hierarquia é uma taxonomia inicial versionada; a edição pelo administrador não faz
parte desta entrega. O trigger do limite de 50 produtos ativos por loja permanece válido.

## Testes

Os testes usam PostgreSQL temporário para comprovar seleção de descendentes, filtros
combinados, preços inclusivos, tamanhos esgotados, ordenação, ausência de duplicações,
lojas vencidas/suspensas e bloqueio de ciclos nas categorias. Os testes de interface
cobrem subcategorias, combinações, remoção de filtros, URL, preço inválido e painel móvel.
Não criam produtos em produção nem enviam e-mails.
