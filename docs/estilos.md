# Organização dos estilos

## Global e compartilhado

`apps/web/src/styles/global.css` é a única entrada global, importada em main.tsx.
A ordem de importação é explícita:

1. tokens.css: famílias de fontes, escala de tamanhos em rem, pesos, entrelinhas,
   espaçamentos, raios e larguras de contêineres.
2. theme.css: paleta semântica do tema claro, estados e superfícies.
3. base.css: box-sizing, margem inicial, controles, foco e resets mínimos.
4. typography.css: fonte do texto, família dos títulos e tipografia base.
5. layout.css: shell/cabeçalho/rodapé e títulos/contêineres compartilhados.
6. components.css: botões, mensagens, cards, badges, paginação e listas de definição.
7. forms.css: estrutura dos formulários e campos reutilizados.

Os arquivos globais não contêm layout específico da home, autenticação, lojas,
administração ou catálogo. O antigo style.css foi removido.

## CSS local

Cada página/componente importa o CSS que lhe pertence:

- pages/HomePage.tsx → HomePage.css
- pages/AccountPage.tsx → AccountPage.css
- pages/AuthPages.tsx → AuthPages.css
- pages/StorePages.tsx → StorePages.css
- pages/AdminPage.tsx → AdminPage.css
- pages/CatalogPage.tsx → CatalogPage.css
- components/AuthLayout.tsx → AuthLayout.css
- components/PasswordField.tsx → PasswordField.css

Home e Minha conta saíram de App.tsx; App mantém as rotas. As páginas de administração
e catálogo continuam com carregamento sob demanda. As classes locais usam prefixos
de página/componente para evitar colisões; estes arquivos são CSS comum, não CSS Modules.

## Como alterar

Para trocar a fonte do projeto, edite --font-family-body e --font-family-heading em
tokens.css. Se escolher uma fonte externa, carregue-a explicitamente antes de usá-la.
A configuração atual usa a fonte de sistema, sem download externo.

Para alterar a escala de textos, edite --font-size-body, --font-size-sm,
--font-size-caption e os tamanhos dos títulos em tokens.css. As medidas rem e a
base de 100% respeitam as preferências de tamanho de fonte do navegador.

Para mudar a cor dos botões principais, use --color-primary e --color-primary-hover
em theme.css. Mensagens usam cores próprias para warning/error/success. A paleta
atual permanece clara; alternância entre claro/escuro não foi implementada.

Para espaçamentos reutilizados, use --space-16, --space-24 etc. As medidas específicas
de um layout (por exemplo, largura de imagem ou breakpoint) ficam no CSS local.
Breakpoints permanecem nos respectivos @media porque variáveis CSS comuns não são
substituídas diretamente nas condições de media queries.

### Exemplo

```css
.minha-pagina-card {
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-14);
  padding: var(--space-24);
  font-size: var(--font-size-body);
}
```

Crie um novo arquivo CSS junto à página quando o estilo for exclusivo dela. Adicione
uma regra compartilhada somente quando houver uso real por mais de uma tela. Evite
seletores globais como section, footer ou dl para elementos de layout; use classes
como site-footer e definition-list. Não duplique cores ou tamanhos de fonte no CSS local.

## Verificação desta refatoração

A comparação das 235 regras/seletores anteriores não encontrou diferenças nos valores
equivalentes após resolver os tokens (na configuração-base do navegador). O build e
os testes do frontend verificam imports, rotas e comportamento. Essa comparação não
substitui inspeção visual em diferentes navegadores e tamanhos de tela.
