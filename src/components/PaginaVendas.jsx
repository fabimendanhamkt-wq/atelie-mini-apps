import React, { useMemo, useState } from 'react';
import { gerarPaginaVendas, paginaVazia } from '../lib/pagina.js';
import { gerarTextosVenda, geracoesTesteRestantes } from '../lib/ia.js';
import { baixarArquivo, nomeArquivo } from '../lib/armazenamento.js';

/* Página de vendas ligada a um mini app salvo. Cada app guarda a sua própria página. */
const NOMES_TIPO = { quiz: 'quiz de perguntas', relacionar: 'jogo de relacionar pares', memoria: 'jogo da memória', encaixe: 'atividade de encaixe', ordenar: 'atividade de montar frases', rotina: 'rotina visual', colorir: 'atividade de pintar por número', receita: 'receita passo a passo' };

/* Descreve o mini app a partir do conteúdo real dele, para a IA escrever a página. */
function resumoDoApp(app) {
  if (!app) return 'material pedagógico';
  const exemplos = app.itens.slice(0, 4).map((it) => it.pergunta || it.esquerda).filter(Boolean).join('; ');
  return `${NOMES_TIPO[app.tipo] || 'atividade'} com ${app.itens.length} itens sobre "${app.titulo}". Exemplos do conteúdo: ${exemplos}`;
}

export default function PaginaVendas({ apps, appIdInicial, chave, salvarPagina, onCriarApp }) {
  const [appId, setAppId] = useState(appIdInicial || apps[0]?.id || '');
  const app = apps.find((a) => a.id === appId);
  const [form, setForm] = useState(() => (app?.pagina ? { ...paginaVazia(app), ...app.pagina } : paginaVazia(app)));
  const [gerando, setGerando] = useState(false);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');

  function escolherApp(id) {
    const outro = apps.find((a) => a.id === id);
    setAppId(id);
    setForm(outro?.pagina ? { ...paginaVazia(outro), ...outro.pagina } : paginaVazia(outro));
    setMsg('');
    setErro('');
  }

  function campo(nome) {
    return (e) => setForm((f) => ({ ...f, [nome]: e.target.value }));
  }

  const html = useMemo(() => gerarPaginaVendas(form), [form]);

  async function gerarTextos() {
    setErro('');
    setMsg('');
    setGerando(true);
    try {
      const textos = await gerarTextosVenda({
        chave,
        produto: form.produto,
        resumo: resumoDoApp(app),
      });
      setForm((f) => ({ ...f, ...textos }));
      const restantes = chave && chave.trim() ? null : geracoesTesteRestantes();
      setMsg('Textos gerados. Revise antes de publicar.' + (restantes !== null ? ` Gerações de teste restantes: ${restantes}.` : ''));
    } catch (e) {
      setErro(e.message);
    } finally {
      setGerando(false);
    }
  }

  function salvar() {
    if (!app) return;
    salvarPagina(app.id, form);
    setMsg('Página salva junto com o mini app. Ela aparece no backup.');
  }

  function baixar() {
    const nome = nomeArquivo(form.produto) + '-pagina-de-vendas.html';
    baixarArquivo(nome, html, 'text/html;charset=utf-8');
  }

  if (!apps.length) {
    return (
      <div className="vazio">
        <p>A página de vendas é feita a partir de um mini app. Crie o mini app primeiro: a IA gera o conteúdo a partir do tema.</p>
        <button type="button" className="principal" onClick={onCriarApp}>Criar mini app com IA</button>
      </div>
    );
  }

  return (
    <div className="criar">
      <div className="coluna-form">
        <h2>Página de vendas</h2>

        <label className="campo">
          <span className="rotulo">Mini app</span>
          <select value={appId} onChange={(e) => escolherApp(e.target.value)}>
            {apps.map((a) => <option key={a.id} value={a.id}>{a.titulo}</option>)}
          </select>
        </label>

        <div className="gerador">
          <h3>Textos com IA</h3>
          <p className="dica">A IA escreve a promessa, o público e os benefícios a partir do nome do produto. Você revisa tudo antes de baixar.</p>
          <button type="button" className="principal" onClick={gerarTextos} disabled={gerando || !form.produto.trim()}>
            {gerando ? 'Gerando…' : 'Gerar textos com IA'}
          </button>
          {msg && <p className="aviso ok" role="status">{msg}</p>}
          {erro && <p className="aviso" role="alert">{erro}</p>}
        </div>

        <label className="campo">
          <span className="rotulo">Nome do produto</span>
          <input value={form.produto} onChange={campo('produto')} />
        </label>
        <label className="campo">
          <span className="rotulo">Promessa (a frase principal)</span>
          <input value={form.promessa} onChange={campo('promessa')} placeholder="Ex.: Alfabetize com jogos que a criança adora" />
        </label>
        <label className="campo">
          <span className="rotulo">Para quem é</span>
          <input value={form.paraQuem} onChange={campo('paraQuem')} placeholder="Ex.: Para professoras do 1º ano" />
        </label>
        <label className="campo">
          <span className="rotulo">O que a pessoa recebe (um por linha)</span>
          <textarea rows={5} value={form.beneficios} onChange={campo('beneficios')} placeholder={'Ensina sílabas com jogos\nFunciona no celular'} />
        </label>
        <label className="campo">
          <span className="rotulo">Preço (opcional; deixe vazio para não mostrar)</span>
          <input value={form.preco} onChange={campo('preco')} placeholder="Ex.: R$ 27" />
        </label>
        <label className="campo">
          <span className="rotulo">Garantia (opcional)</span>
          <input value={form.garantia} onChange={campo('garantia')} placeholder="Ex.: 7 dias para pedir o reembolso" />
        </label>
        <label className="campo">
          <span className="rotulo">Texto do botão</span>
          <input value={form.textoBotao} onChange={campo('textoBotao')} />
        </label>
        <label className="campo">
          <span className="rotulo">Link de compra</span>
          <input value={form.linkCompra} onChange={campo('linkCompra')} placeholder="https://..." />
        </label>
        <label className="campo">
          <span className="rotulo">Link para experimentar o mini app (opcional)</span>
          <input value={form.linkExperimentar} onChange={campo('linkExperimentar')} placeholder="https://seu-app.netlify.app" />
        </label>
        <label className="campo">
          <span className="rotulo">Quem criou (nome que aparece no rodapé)</span>
          <input value={form.autora} onChange={campo('autora')} />
        </label>

        <div className="acoes">
          <button type="button" className="principal" onClick={baixar} disabled={!form.produto.trim()}>Baixar página (.html)</button>
          <button type="button" className="secundario" onClick={salvar} disabled={!app}>Salvar com o mini app</button>
        </div>
        {!form.linkCompra && <p className="dica">Sem link de compra, o botão não aparece. Coloque o link da Kiwify ou do seu checkout.</p>}
      </div>

      <div className="coluna-previa">
        <h3>Prévia</h3>
        <iframe title="Prévia da página de vendas" className="previa" srcDoc={html} sandbox="allow-same-origin" />
      </div>
    </div>
  );
}
