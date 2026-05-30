# InvestFlow — Setup Guide

## 1. Banco de Dados (Neon PostgreSQL — gratuito)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta gratuita
2. Crie um novo projeto
3. Copie a **Connection String** (formato: `postgresql://user:pass@host/db?sslmode=require`)
4. Cole no `.env` como `DATABASE_URL`

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
NEXTAUTH_SECRET="gere com: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

## 3. Criar as tabelas no banco

```bash
npx prisma db push
```

## 4. Criar o primeiro usuário RM

```bash
npm run dev
```

Acesse `http://localhost:3000/register` e crie sua conta de RM.

## 5. Deploy no Vercel

1. Suba o projeto no GitHub
2. Importe no [vercel.com](https://vercel.com)
3. Adicione as variáveis de ambiente no painel do Vercel:
   - `DATABASE_URL` — a string do Neon
   - `NEXTAUTH_SECRET` — o segredo gerado
   - `NEXTAUTH_URL` — a URL do seu app (ex: `https://investflow.vercel.app`)
4. Deploy!

Após o deploy, rode as migrations:
```bash
npx prisma db push
```
(ou configure via Vercel CLI)

## Estrutura de usuários

- **RM**: acessa `/dashboard` e todas as funcionalidades de gestão
- **Investidor**: acessa `/investor/dashboard` com visão somente-leitura dos seus dados

O RM pode criar login para um investidor ao cadastrá-lo, fornecendo e-mail e senha.
