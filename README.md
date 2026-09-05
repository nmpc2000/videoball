# Coach Vision — Supabase completo

## O que esta versão faz
- Supabase Auth para criar conta / entrar / terminar sessão.
- Sessões integradas com Next.js via cookies/SSR.
- PostgreSQL para jogos e eventos.
- Row Level Security: cada treinador só vê os seus jogos/eventos.
- Supabase Storage privado para vídeos.
- Upload de vídeos pelo iPhone, Android ou computador.
- Vídeos guardados por utilizador/jogo.
- URLs assinados para reproduzir vídeos privados.
- Marcação de eventos e notas persistentes.

## Configuração
1. Cria um projeto no Supabase.
2. No SQL Editor, executa `supabase/schema.sql`.
3. Em Project Settings > API, copia Project URL e Publishable Key.
4. Copia `.env.local.example` para `.env.local`.
5. Preenche:
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
6. `npm install`
7. `npm run dev`
8. Abre `http://localhost:3000`.

## Email de confirmação
No Supabase Auth podes decidir se o sign-up exige confirmação por email. Se estiver ativo, configura também a URL de redirect da tua aplicação.

## Deploy Vercel
- Importa este projeto no GitHub.
- Na Vercel, adiciona as duas variáveis de ambiente.
- Faz deploy.
- No Supabase Auth > URL Configuration, adiciona o domínio da Vercel às URLs permitidas.

## Vídeos grandes
A versão usa o upload Storage normal. Para vídeos muito grandes/instáveis, a evolução recomendada é trocar para TUS/resumable uploads. A documentação Supabase recomenda uploads resumíveis para ficheiros maiores que 6 MB.

## Segurança
Nunca coloques a `service_role` key no browser ou no `.env` público. A aplicação usa a publishable key e RLS. O bucket de vídeos é privado.
