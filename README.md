# DecorRental Web

<p align="center">
  <img width="360" alt="DecorRental" src="https://github.com/user-attachments/assets/9bcd611e-183a-44c9-bf4a-845d98fb97c4" />
</p>

## Contexto

Frontend do DecorRental para operação diária da locadora: cadastro, reservas, contratos e calendário.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS

## Funcionalidades

- Login com JWT.
- Gestão de kits, categorias e itens de estoque.
- Tela de reservas com:
  - seleção de kit e categoria;
  - dados completos do cliente;
  - endereço estruturado (CEP, logradouro, número, complemento, bairro, cidade, UF, referência);
  - autocomplete de CEP via API;
  - edição e cancelamento de reservas;
  - opção de exceção de estoque.
- Geração de contrato em Word, PDF e impressão.
- Calendário de reservas.

## Como executar

1. Instale dependências:

```bash
npm install
```

2. Crie o arquivo de ambiente:

```bash
copy .env.example .env.local
```

3. Configure:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

4. Rode a aplicação:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
