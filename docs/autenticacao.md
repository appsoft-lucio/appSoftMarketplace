# Cadastro, login e recuperação de senha

## O que esta entrega implementa

- Cadastro por nome, e-mail, senha e preferência comprador/lojista.
- Confirmação e reenvio de confirmação por e-mail.
- Login, sessão restaurada pelo SDK, página Minha conta e saída desta sessão.
- Solicitação de recuperação, callback e definição da nova senha.
- Senha nova com mínimo de 6 caracteres, confirmação e opção de mostrar/ocultar.
- Mensagens em português, carregamento, erros e formulários bloqueados sem configuração.

A autenticação usa o SDK oficial do Supabase com PKCE. Os links devem ser abertos
no mesmo navegador e dispositivo em que a solicitação foi feita. O SDK troca o
código por uma sessão automaticamente; não fazemos uma segunda troca manual.
Não registramos senhas ou tokens em logs.

## 1. Configuração local

Crie `apps/web/.env.local` copiando `apps/web/.env.example` e configure:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
```

Use a URL do projeto e a chave **publishable**, em Project Settings → API Keys.
Para projetos com chave legada, use a chave **anon** no mesmo campo ou em
`VITE_SUPABASE_ANON_KEY`. Nunca use service_role, sb_secret, senha PostgreSQL ou
DATABASE_URL em uma variável VITE_. Essas variáveis entram no JavaScript público.

Reinicie `npm run dev` depois de salvar. Sem esses valores, as telas abrem,
mas não executam chamadas de cadastro ou login. O login por e-mail segue direto ao Supabase. O login por usuário passa pela API Node, que encaminha a senha ao Supabase sem gravá-la nem registrá-la em logs.

## 2. Configuração no Supabase

Em Authentication, habilite autenticação por e-mail/senha, novos cadastros e
confirmação de e-mail. Alinhe o mínimo de senha a 6 caracteres no provedor.

Em URL Configuration, configure o Site URL de produção e autorize os callbacks exatos:

```text
http://127.0.0.1:5173/auth/confirmar
http://127.0.0.1:5173/redefinir-senha
http://localhost:5173/auth/confirmar
http://localhost:5173/redefinir-senha
https://appsoftmarketplace.vercel.app/auth/confirmar
https://appsoftmarketplace.vercel.app/redefinir-senha
```

Se usar outra porta/domínio, autorize a origem correspondente. Não alterne entre
localhost e 127.0.0.1 durante um fluxo: são origens diferentes para o armazenamento PKCE.
Mantenha os modelos de e-mail usando o link oficial `{{ .ConfirmationURL }}`.

Configure SMTP próprio para enviar confirmações e recuperações a clientes reais.
O SMTP padrão do Supabase é restrito a endereços autorizados da equipe e não é
adequado para produção. SMTP e seus segredos ficam no painel do Supabase, não no Vite.
Não desative confirmação de e-mail apenas para contornar configuração de entrega.

## 3. Configuração na Vercel

Cadastre a URL e a chave pública em Production e faça um novo build. Não copie
credenciais do banco. `vercel.json` já preserva a abertura direta das rotas de
login, cadastro, recuperação, redefinição, confirmação e conta.

A entrega de código não altera configurações do Supabase nem envia e-mails reais.

## Testes

`npm test` executa regras/SQL/API e testes de formulário com SDK simulado.
Esses testes cobrem login, sessão, saída, cadastro, senhas diferentes, erros,
configuração ausente, redirects de e-mail, reenvio e recuperação.

Depois de configurar o provedor, validar com um e-mail de teste autorizado:

1. Cadastrar, receber o e-mail, abrir no mesmo navegador e acessar a conta.
2. Sair, entrar, atualizar a página e sair novamente.
3. Solicitar recuperação e abrir o link no mesmo navegador.
4. Definir a nova senha; verificar que a antiga falha e a nova funciona.
5. Abrir novamente o link utilizado e testar um link expirado.
6. Abrir /minha-conta sem sessão e /redefinir-senha sem link.
7. Repetir em celular e verificar mensagens de erro/rede.

Nunca salve links de recuperação, senhas de teste, tokens ou capturas de sessão no Git.

## Limites de autorização e persistência

A conta é criada no Supabase Auth. Ao cadastrar uma loja, a API valida a sessão
e sincroniza o usuário em `marketplace_v2.users`, conforme [cadastro de lojas](lojas.md).
A preferência `account_type` e o nome em user_metadata são editáveis pelo usuário;
nunca podem ser usados como autorização de administrador ou proprietário de loja.

A proteção da página Minha conta organiza a navegação; futuras rotas da API precisam
validar o token no servidor e carregar permissões confiáveis do banco.
Não foram concedidas políticas públicas às tabelas do marketplace e nenhuma
migração foi executada no Supabase.

O identificador de recuperação na sessionStorage só mantém a tela durante uma
atualização da aba; não concede autorização. `updateUser` exige a sessão validada
pelo Supabase. A recuperação só é liberada por um evento PASSWORD_RECOVERY ou pela
continuidade da mesma sessão na aba; falhas no callback bloqueiam o formulário.

## Referências oficiais

- https://supabase.com/docs/reference/javascript/auth-signup
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
- https://supabase.com/docs/reference/javascript/auth-updateuser
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/sessions/pkce-flow
- https://supabase.com/docs/guides/auth/auth-smtp

## Nome de usuário

O cadastro solicita um nome único, compartilhado por clientes e lojistas.
São permitidos de 3 a 30 caracteres: letras ASCII, números, ponto, hífen e sublinhado,
começando com letra ou número. Espaços externos são removidos e o nome fica em minúsculas.

Aplicar a migração 008_login_names.sql antes de publicar esta versão. A exclusividade
é garantida pela tabela privada marketplace_v2.login_names. Um trigger transacional
reserva o nome junto da criação em auth.users; colisões desfazem o cadastro inteiro.
Alterar user_metadata não troca o usuário reservado. A tabela não concede acesso ao navegador.

Contas antigas continuam entrando com e-mail e podem escolher ou trocar o usuário
em Minha conta. GET/PUT /api/me/username valida a sessão e só opera na conta autenticada.
POST /api/auth/username/check retorna somente a disponibilidade do nome.
POST /api/auth/username/login verifica a senha no Supabase e devolve apenas os tokens
da sessão; não devolve o e-mail associado. O SDK valida/restaura a sessão com setSession.
As respostas usam no-store, e tentativas por usuário são limitadas no banco.

E-mails continuam únicos no Supabase, independentemente da preferência cliente/lojista.
Os formulários normalizam e-mail para minúsculas e apresentam orientação para usar
a conta existente quando o provedor informa duplicidade. O provedor pode ocultar
a existência de uma conta e devolver uma resposta genérica de cadastro.