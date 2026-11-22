# Cadastro da loja

## Entrega

Em Minha conta → Minhas lojas, o usuário autenticado pode enviar os dados de uma loja:
nome, slug exclusivo, descrição, telefone comercial, cidade e UF. Cada conta pode
acompanhar seus próprios cadastros. A API define status `pending` e plano `basic`.
Não cria assinatura, cobrança ou entrada na vitrine.

O servidor valida o Bearer token consultando o Supabase Auth e exige e-mail confirmado.
O identificador de usuário enviado pelo navegador e os metadados de perfil não são
usados como autorização. Nome/e-mail do usuário validado são sincronizados em
`marketplace_v2.users`; `role` não é atualizado pelo cadastro.

A criação de usuário local, loja e associação de proprietário ocorre em uma transação.
Conflito de slug retorna 409 e desfaz tudo. GET /api/stores/mine filtra por associações
do usuário autenticado. POST /api/stores aceita somente dados comerciais validados.
Não há edição, exclusão, aprovação administrativa ou publicação de catálogo nesta etapa.

## Configurar backend local

Copie `apps/api/.env.example` para `apps/api/.env`:

- SUPABASE_URL: URL do projeto novo.
- SUPABASE_PUBLISHABLE_KEY: a mesma chave pública usada pelo frontend.
- DATABASE_URL: conexão completa do projeto novo, com senha real somente neste arquivo.
- DATABASE_CA_FILE: se necessário, caminho do CA público do Supabase.

Não coloque a conexão PostgreSQL em variáveis VITE_. O TLS externo mantém verificação
ativa. Consulte o painel Connect do Supabase para a conexão e o certificado apropriados.
O CA público do Supabase acompanha a função em apps/api/certs/supabase-ca.crt.
Os dados não passam pela Data API, que pode permanecer desabilitada.

Aplique as migrações explicitamente, somente no banco de destino correto:

```sh
npm run db:migrate --workspace @appsoft/api
```

O comando usa as migrações 001 e 002 e registra nomes/checksums em appsoft_internal.
Não remove schemas existentes. Se marketplace_v2 já existir sem o histórico do runner,
pare e reconcilie o histórico antes de executar; não apague tabelas para contornar o erro.
Nenhuma migração é aplicada durante requisições ou durante o build.

Inicie a API com `npm run dev:api` e o frontend com `npm run dev`.
A API retorna 503 se estiver sem conexão ou schema; não simula um cadastro salvo.

## Vercel

O entrypoint `api/index.ts` publica a API Node no mesmo projeto do frontend.
As rotas /api são encaminhadas à função; /lojas e /lojas/nova abrem a SPA.
Cadastre SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e DATABASE_URL como variáveis de servidor.
A conexão deve ser um segredo de Production, nunca VITE_DATABASE_URL.
Aplique as migrações no destino antes de liberar a versão com gravação real.
Nenhuma credencial de banco foi cadastrada na Vercel por esta entrega.

## Verificação

`npm test` inclui integração HTTP com PostgreSQL temporário (PGlite), verificando:

- rejeição de sessão ausente ou inválida;
- validação dos campos e do estado;
- status/plano/proprietário definidos no servidor;
- isolamento das lojas de usuários diferentes;
- transação desfeita quando o slug está ocupado;
- loja pendente fora da vitrine e ausência de assinatura automática;
- formulário, geração do slug e preservação de dados após falha.

Os testes usam identidades simuladas e banco temporário, não criam lojas no Supabase.
Depois de configurar o banco real, validar com duas contas: cadastro na primeira,
recarregamento da página e ausência da loja ao entrar com a segunda.
Verificação somente de leitura após aplicar o schema: `npm run db:check --workspace @appsoft/api`.
