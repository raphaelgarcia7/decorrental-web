# DecorRental Web

Front-end do sistema DecorRental para operacao diaria de kits e reservas.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

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

## Telas

- Login
- Dashboard
- Kits (lista e criacao)
- Detalhe do kit (reservas e cancelamento)
- Calendario de reservas
