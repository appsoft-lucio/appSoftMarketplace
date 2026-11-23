# Organização do frontend

`App.tsx` compõe os providers e define as rotas. `pages` contém as telas e a
coordenação dos seus dados. As funcionalidades ficam em `auth`, `cart`, `catalog`
e `stores`, com serviços, estado e componentes específicos próximos entre si.

Componentes compartilhados:

- `components/layout`: SiteHeader, BrandLink, PublicHeader e SiteFooter.
- `components/auth`: estrutura visual das telas de autenticação.
- `components/forms`: campos reutilizáveis, como PasswordField.
- `components/pwa`: convite de instalação.
- `catalog/components`: filtros, categorias e detalhes de produto.
- `stores/components`: estrutura da área de lojas e acesso administrativo.
- `cart/CartLink.tsx`: acesso ao carrinho com a quantidade atual.

SiteHeader concentra o logo, ações, layout responsivo e CSS. Usa `sticky`,
preservando seu espaço no fluxo e permanecendo no topo durante a rolagem.
Não exige compensações de altura fixa quando a navegação quebra linhas no celular.
Diálogos nativos continuam acima do header. O nível de empilhamento está em tokens.css.

Cada componente visual importa seu CSS local. Cores e medidas vêm dos tokens
globais. Prefira extrair componentes quando houver uma responsabilidade própria
ou uso compartilhado; evite abstrações que só adicionem uma camada sem benefício.
