# Instalação e abertura

O manifesto inicia o aplicativo instalado em `/`, a vitrine pública de produtos,
com busca, categorias e filtros. `/catalogo` mantém acesso ao mesmo catálogo.
O logo retorna à vitrine. O convite de instalação aparece na home. Links diretos
para produtos e os retornos de autenticação continuam acessíveis.

O login usa sessionStorage: uma nova sessão de navegação começa como visitante,
sem recuperar o token persistente da versão anterior. Atualizar a página mantém
o acesso da sessão atual. Fechar e restaurar abas depende do navegador, que pode
restaurar também sessionStorage. O carrinho continua em localStorage.
O verificador PKCE permanece no armazenamento compartilhado para permitir
confirmação e recuperação por links abertos em outra aba.

A home oferece instalação quando o navegador emite beforeinstallprompt. O
diálogo nativo depende de clique em Instalar app. No iPhone/iPad, mostramos
instruções para adicionar à tela inicial. Agora não oculta o convite nesta sessão.
O convite some ao instalar e não aparece em modo standalone. Navegadores não
oferecem uma forma universal de descobrir instalações feitas anteriormente.

São usados os ícones existentes. Não registramos o antigo service worker nem
adicionamos cache offline, para evitar servir a interface anterior.
