/* Página de vendas do mini app. Só mostra o que a aluna preencheu.
   Não cria preço, depoimento, número ou garantia que ela não tenha informado. */

export function escapar(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function linhas(texto) {
  return String(texto || '').split('\n').map((l) => l.trim()).filter(Boolean);
}

export function paginaVazia(app) {
  return {
    produto: app?.titulo || '',
    promessa: '',
    paraQuem: '',
    beneficios: '',
    preco: '',
    textoBotao: 'Quero começar agora',
    linkCompra: '',
    linkExperimentar: '',
    autora: '',
    garantia: '',
  };
}

/* Gera o HTML completo da página de vendas. */
export function gerarPaginaVendas(p) {
  const beneficios = linhas(p.beneficios).slice(0, 8);
  const botao = (href, rotulo) => href
    ? `<a class="botao" href="${escapar(href)}" target="_blank" rel="noopener">${escapar(rotulo)}</a>`
    : '';

  const secoes = [];

  secoes.push(`<section class="topo">
  <p class="selo">${escapar(p.produto)}</p>
  <h1>${escapar(p.promessa || p.produto)}</h1>
  ${p.paraQuem ? `<p class="subtitulo">${escapar(p.paraQuem)}</p>` : ''}
  ${botao(p.linkCompra, p.textoBotao || 'Quero começar agora')}
</section>`);

  if (beneficios.length) {
    secoes.push(`<section class="bloco">
  <h2>O que você recebe</h2>
  <ul class="lista">
    ${beneficios.map((b) => `<li>${escapar(b)}</li>`).join('\n    ')}
  </ul>
</section>`);
  }

  if (p.linkExperimentar) {
    secoes.push(`<section class="bloco destaque-bloco">
  <h2>Experimente antes</h2>
  <p>Teste o ${escapar(p.produto)} gratuitamente e veja como funciona na prática.</p>
  ${botao(p.linkExperimentar, 'Experimentar agora')}
</section>`);
  }

  if (p.preco) {
    secoes.push(`<section class="bloco preco">
  <p class="rotulo-preco">Investimento</p>
  <p class="valor">${escapar(p.preco)}</p>
  ${botao(p.linkCompra, p.textoBotao || 'Quero começar agora')}
</section>`);
  }

  if (p.garantia) {
    secoes.push(`<section class="bloco">
  <h2>Garantia</h2>
  <p>${escapar(p.garantia)}</p>
</section>`);
  }

  secoes.push(`<footer class="rodape">
  ${p.autora ? `<p>Criado por ${escapar(p.autora)}</p>` : ''}
  ${botao(p.linkCompra, p.textoBotao || 'Quero começar agora')}
</footer>`);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapar(p.promessa || p.produto)}">
<title>${escapar(p.produto)}</title>
<style>
:root { --fundo:#fbf6ef; --texto:#3b2a1e; --principal:#7a4a2e; --suave:#f1e4d3; --rosa:#e7a8a0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--fundo); color: var(--texto); font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; line-height: 1.55; }
section, footer { max-width: 680px; margin: 0 auto; padding: 28px 20px; }
.topo { text-align: center; padding-top: 44px; }
.selo { display: inline-block; background: var(--suave); color: var(--principal); padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: .9rem; margin: 0 0 14px; }
h1 { font-size: clamp(1.7rem, 5vw, 2.4rem); line-height: 1.2; margin: 0 0 12px; color: var(--principal); }
h2 { font-size: 1.35rem; color: var(--principal); margin: 0 0 12px; }
.subtitulo { font-size: 1.1rem; margin: 0 0 22px; opacity: .9; }
.bloco { border-top: 1px solid #e6d6c2; }
.lista { padding-left: 0; list-style: none; display: grid; gap: 10px; }
.lista li { background: #fff; border: 1px solid #e6d6c2; border-radius: 14px; padding: 12px 16px; }
.lista li::before { content: "✓ "; color: var(--principal); font-weight: 700; }
.destaque-bloco { background: var(--suave); border-radius: 18px; margin-top: 20px; border: 0; }
.preco { text-align: center; }
.rotulo-preco { margin: 0; opacity: .75; }
.valor { font-size: 1.8rem; font-weight: 800; color: var(--principal); margin: 4px 0 14px; }
.botao { display: inline-block; background: var(--principal); color: #fff; text-decoration: none; font-weight: 700; padding: 14px 26px; border-radius: 14px; font-size: 1.05rem; }
.topo .botao, .preco .botao, .rodape .botao { margin-top: 6px; }
.rodape { text-align: center; border-top: 1px solid #e6d6c2; margin-top: 20px; }
@media (prefers-color-scheme: dark) {
  :root { --fundo:#23190f; --texto:#f6ead9; --principal:#e0a878; --suave:#3a2a1b; }
  .lista li { background:#2d2117; border-color:#4a3828; }
  .bloco, .rodape { border-color:#4a3828; }
  .botao { color:#23190f; }
}
</style>
</head>
<body>
${secoes.join('\n')}
</body>
</html>
`;
}
