# Ateliê de Mini Apps da Sala ao Digital

Painel onde alunas criam mini apps pedagógicos (quiz, memória, encaixe, relacionar, montar frase, rotina visual, pintar por número e receita) e baixam cada um como arquivo `.html`.

## Como funciona a geração com IA

- Com a chave da própria aluna (em "Conectar IA"), a geração é direta com o Google.
- Sem chave, a aluna tem gerações de teste, feitas pela função `netlify/functions/gerar.js`, que usa a variável `GEMINI_API_KEY` configurada no Netlify.

## Publicação (Netlify, com repositório conectado)

1. Netlify → Add new site → Import from Git → escolha este repositório.
2. Build command: `npm run build` · Publish directory: `dist` (já vem no `netlify.toml`).
3. Site settings → Environment variables → criar `GEMINI_API_KEY` com a chave da professora.
4. Opcional: `LIMITE_DIARIO` (padrão 300 gerações por dia, no total de todas as alunas).

## Rodar localmente

    npm install
    npm run dev
