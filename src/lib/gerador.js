import playerJs from '../player/player.js?raw';
import playerCss from '../player/player.css?raw';
import { CORES } from './cores.js';

function escapar(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Gera o arquivo HTML completo e independente de um mini app.
   Não depende de servidor, de conta ou de internet para funcionar. */
export function gerarHtml(app) {
  if (app.tipo === 'livre') return app.html;
  const dados = JSON.stringify(app).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapar(app.instrucao || app.titulo)}">
<title>${escapar(app.titulo)}</title>
<style>${playerCss}</style>
</head>
<body>
<main id="app"></main>
<script>window.APP = ${dados};</script>
<script>window.CORES = ${JSON.stringify(CORES)};</script>
<script>${playerJs}</script>
</body>
</html>
`;
}
