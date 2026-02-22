# DecorRental Web

<p align="center">
  <img width="360" alt="DecorRental" src="https://github.com/user-attachments/assets/9bcd611e-183a-44c9-bf4a-845d98fb97c4" />
</p>

## Contexto real

Front-end do sistema DecorRental, criado para operar o dia a dia de uma empresa familiar de locacao de decoracoes.
O foco e oferecer um painel simples para controle de kits, reservas e disponibilidade.

## Objetivo

Mostrar um fluxo completo de operacao em cima da API, com autenticação, listagem, criação e cancelamento de reservas.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## Telas

- Login
- Dashboard (resumo de kits e reservas)
- Kits (lista e criacao)
- Detalhe do kit (reservas e cancelamento)
- Calendario de reservas

## Como executar

1. Instale dependencias:

```bash
npm install
```

2. Crie um `.env.local` com base no `.env.example`:

```bash
copy .env.example .env.local
```

3. Rode o projeto:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Variaveis

- `NEXT_PUBLIC_API_BASE_URL`: URL da DecorRental API.

## API usada no front

Esta UI consome a API em:

```
https://decorrental-api-production.up.railway.app
```

Para rodar local, ajuste `NEXT_PUBLIC_API_BASE_URL` para `http://localhost:8080`.

## Fluxo rapido (teste)

1. Acesse `/login`.
2. Informe as credenciais da API.
3. Crie um kit.
4. Acesse o kit e crie uma reserva.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Planos futuros

- Calendario em visao mensal.
- Tela de disponibilidade por kit.
- Exportacao de reservas (CSV).
- Deploy do front e docs de ambiente.
