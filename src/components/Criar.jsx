import React, { useMemo, useState } from 'react';
import { gerarHtml } from '../lib/gerador.js';
import { baixarArquivo, nomeArquivo, novoId } from '../lib/armazenamento.js';
import { CORES, nomeCorNormalizado } from '../lib/cores.js';
import { gerarConteudo, gerarAppLivre, geracoesTesteRestantes } from '../lib/ia.js';

const ITEM_QUIZ = () => ({ pergunta: '', opcoes: ['', '', ''], correta: 0 });
const ITEM_PAR = () => ({ esquerda: '', direita: '' });

export function itensIniciais(tipo) {
  return tipo === 'quiz' ? [ITEM_QUIZ(), ITEM_QUIZ()] : [ITEM_PAR(), ITEM_PAR(), ITEM_PAR()];
}

/* Confere o que está faltando antes de salvar ou exportar. */
export function validar(app) {
  const erros = [];
  if (app.tipo === 'livre') {
    if (!app.titulo.trim()) erros.push('Dê um título ao aplicativo.');
    if (!app.html) erros.push('Gere o aplicativo com IA antes de salvar.');
    return erros;
  }
  if (!app.titulo.trim()) erros.push('Dê um título ao mini app.');
  const itens = app.itens.filter((it) => !itemVazio(app.tipo, it));
  if (itens.length < 2) erros.push('Crie pelo menos 2 itens preenchidos.');
  itens.forEach((item, i) => {
    const n = i + 1;
    if (app.tipo === 'quiz') {
      if (!item.pergunta.trim()) erros.push(`Pergunta ${n}: escreva a pergunta.`);
      const preenchidas = item.opcoes.filter((o) => o.trim());
      if (preenchidas.length < 2) erros.push(`Pergunta ${n}: preencha pelo menos 2 opções.`);
      if (!(item.opcoes[item.correta] || '').trim()) {
        erros.push(`Pergunta ${n}: marque uma opção certa que esteja preenchida.`);
      }
    } else {
      if (!item.esquerda.trim()) erros.push(`${NOMES_PAR[app.tipo] || 'Par'} ${n}: preencha o texto.`);
      else if (app.tipo === 'colorir' && !CORES[nomeCorNormalizado(item.direita)]) erros.push(`Número ${n}: use uma destas cores: ${Object.keys(CORES).join(', ')}.`);
      else if (CAMPO_DIREITO[app.tipo] && app.tipo !== 'rotina' && !item.direita.trim()) erros.push(`${NOMES_PAR[app.tipo] || 'Par'} ${n}: preencha os dois lados.`);
    }
  });
  return erros;
}

/* Itens totalmente em branco são ignorados (ficam de fora ao salvar e validar). */
export function itemVazio(tipo, it) {
  if (tipo === 'quiz') return !it.pergunta.trim() && it.opcoes.every((o) => !o.trim());
  return !(it.esquerda || '').trim() && !(it.direita || '').trim();
}

/* Limpa os dados antes de salvar, baixar ou mostrar na prévia. */
export function normalizar(id, tipo, titulo, instrucao, itensBrutos) {
  const itens = itensBrutos.filter((it) => !itemVazio(tipo, it));
  return {
    id,
    tipo,
    titulo: titulo.trim(),
    instrucao: instrucao.trim(),
    itens: tipo === 'quiz'
      ? itens.map((it) => {
          // Descarta opções vazias e recalcula qual é a certa na lista limpa.
          const preenchidas = it.opcoes
            .map((texto, k) => ({ texto: (texto || '').trim(), k }))
            .filter((x) => x.texto);
          return {
            pergunta: it.pergunta.trim(),
            opcoes: preenchidas.map((x) => x.texto),
            correta: preenchidas.findIndex((x) => x.k === it.correta),
          };
        })
      : itens.map((it) => ({ esquerda: it.esquerda.trim(), direita: it.direita.trim() })),
  };
}

const TIPOS = [
  { id: 'livre', rotulo: 'App completo (IA cria tudo)' },
  { id: 'quiz', rotulo: 'Quiz' },
  { id: 'relacionar', rotulo: 'Relacionar pares' },
  { id: 'memoria', rotulo: 'Jogo da memória' },
  { id: 'encaixe', rotulo: 'Encaixe (sombra)' },
  { id: 'ordenar', rotulo: 'Montar frase' },
  { id: 'rotina', rotulo: 'Rotina visual' },
  { id: 'colorir', rotulo: 'Pintar por número' },
  { id: 'receita', rotulo: 'Receita' },
];
const CAMPO_DIREITO = { relacionar: true, memoria: true, encaixe: true, rotina: true, colorir: true, receita: true };
const ROTULOS_PAR = {
  relacionar: ['Lado esquerdo (ex.: Cachorro)', 'Lado direito (ex.: Au au)'],
  memoria: ['Carta A (ex.: Cachorro)', 'Carta B (ex.: Au au)'],
  encaixe: ['Nome da peça (ex.: Cachorro)', 'Figura (um emoji, ex.: 🐶)'],
  ordenar: ['Frase na ordem certa (ex.: O cachorro late)', ''],
  rotina: ['Passo da rotina (ex.: Escovar os dentes)', 'Emoji do passo (ex.: 🪥)'],
  colorir: ['Número (ex.: 1)', 'Cor (ex.: vermelho)'],
  receita: ['Ingrediente (ex.: 2 ovos)', 'Modo de preparo (ex.: Bata os ovos até espumar)'],
};
const NOMES_PAR = { relacionar: 'par', memoria: 'par de cartas', encaixe: 'peça', ordenar: 'frase', rotina: 'passo', colorir: 'número', receita: 'passo' };

export default function Criar({ editando, chave, onSalvar, onCancelar }) {
  const [tipo, setTipo] = useState(editando?.tipo || 'livre');
  const [titulo, setTitulo] = useState(editando?.titulo || '');
  const [instrucao, setInstrucao] = useState(editando?.instrucao || '');
  const [itens, setItens] = useState(editando?.itens || itensIniciais('quiz'));
  const [aviso, setAviso] = useState([]);
  const [mostrarPrevia, setMostrarPrevia] = useState(true);
  const [tema, setTema] = useState('');
  const [ano, setAno] = useState('');
  const [quantidade, setQuantidade] = useState(8);
  const [gerando, setGerando] = useState(false);
  const [erroIA, setErroIA] = useState('');
  const [msgIA, setMsgIA] = useState('');
  const [htmlLivre, setHtmlLivre] = useState(editando?.html || '');

  async function gerarComIA() {
    setErroIA('');
    setMsgIA('');
    setGerando(true);
    try {
      if (tipo === 'livre') {
        const app = await gerarAppLivre({ chave, tema, ano });
        setTitulo(app.titulo);
        setHtmlLivre(app.html);
        setAviso([]);
        const restantes = chave && chave.trim() ? null : geracoesTesteRestantes();
        setMsgIA('Aplicativo gerado. Veja a prévia e teste antes de salvar: a IA pode errar.' + (restantes !== null ? ` Gerações de teste restantes: ${restantes}.` : ''));
        return;
      }
      const r = await gerarConteudo({ chave, tipo, tema, ano, quantidade });
      setTitulo(r.titulo);
      setInstrucao(r.instrucao);
      setItens(r.itens);
      setAviso([]);
      const restantes = chave && chave.trim() ? null : geracoesTesteRestantes();
      setMsgIA(`${r.itens.length} itens gerados. Revise antes de salvar: a IA pode errar.` + (restantes !== null ? ` Gerações de teste restantes: ${restantes}.` : ''));
    } catch (e) {
      setErroIA(e.message);
    } finally {
      setGerando(false);
    }
  }

  // Troca o tipo e os itens juntos, para nunca renderizar um formato misturado.
  function trocarTipo(novo) {
    if (novo === tipo) return;
    setTipo(novo);
    setItens(itensIniciais(novo));
  }

  const app = useMemo(() => ({ id: editando?.id || novoId(), tipo, titulo, instrucao, itens, html: htmlLivre }), [tipo, titulo, instrucao, itens, editando, htmlLivre]);
  const html = useMemo(() => {
    if (tipo === 'livre') {
      return htmlLivre || '<!doctype html><body style="font-family:system-ui;padding:20px;color:#7a4a2e">Descreva o aplicativo e clique em "Gerar com IA" para ver a prévia aqui.</body>';
    }
    return gerarHtml(normalizar(app.id, tipo, titulo, instrucao, itens));
  }, [app.id, tipo, titulo, instrucao, itens, htmlLivre]);

  function atualizarItem(i, campo, valor) {
    setItens((lista) => lista.map((it, k) => (k === i ? { ...it, [campo]: valor } : it)));
  }
  function atualizarOpcao(i, k, valor) {
    setItens((lista) => lista.map((it, n) => {
      if (n !== i) return it;
      const opcoes = it.opcoes.map((o, j) => (j === k ? valor : o));
      return { ...it, opcoes };
    }));
  }
  function adicionarOpcao(i) {
    setItens((lista) => lista.map((it, n) => (n === i && it.opcoes.length < 4 ? { ...it, opcoes: [...it.opcoes, ''] } : it)));
  }
  function removerItem(i) {
    setItens((lista) => (lista.length > 1 ? lista.filter((_, k) => k !== i) : lista));
  }
  function adicionarItem() {
    setItens((lista) => [...lista, tipo === 'quiz' ? ITEM_QUIZ() : ITEM_PAR()]);
  }

  function dadosParaSalvar() {
    if (tipo === 'livre') return { id: app.id, tipo: 'livre', titulo: titulo.trim(), instrucao: '', itens: [], html: htmlLivre };
    return normalizar(app.id, tipo, titulo, instrucao, itens);
  }

  function salvar() {
    const erros = validar(app);
    setAviso(erros);
    if (erros.length) return;
    onSalvar(dadosParaSalvar());
  }

  function exportar() {
    const erros = validar(app);
    setAviso(erros);
    if (erros.length) return;
    const dados = dadosParaSalvar();
    baixarArquivo(nomeArquivo(dados.titulo) + '.html', gerarHtml(dados), 'text/html;charset=utf-8');
  }

  return (
    <div className="criar">
      <div className="coluna-form">
        <h2>{editando ? 'Editar mini app' : 'Criar mini app'}</h2>

        <div className="campo">
          <span className="rotulo">Tipo de app</span>
          <div className="escolha">
            {TIPOS.map((t) => (
              <button key={t.id} type="button" className={tipo === t.id ? 'ativo' : ''} onClick={() => trocarTipo(t.id)} disabled={!!editando}>{t.rotulo}</button>
            ))}
          </div>
        </div>

        {!editando && (
          <div className="gerador">
            <h3>Gerar com IA</h3>
            <p className="dica">Escreva o tema do jeito que quiser. A IA cria os itens no formato do tipo escolhido acima.</p>
            <label className="campo">
              <span className="rotulo">Tema</span>
              <textarea rows={3} value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex.: animais da fazenda. Pode ser livre: escreva uma frase ou um parágrafo com o que você quer ensinar." />
            </label>
            <div className="linha-gerador">
              <label className="campo">
                <span className="rotulo">Público</span>
                <select value={ano} onChange={(e) => setAno(e.target.value)}>
                  <option value="">Não definir</option>
                  <option value="educação infantil">Educação infantil</option>
                  <option value="1º ano">1º ano</option>
                  <option value="2º ano">2º ano</option>
                  <option value="3º ano">3º ano</option>
                  <option value="4º ano">4º ano</option>
                  <option value="5º ano">5º ano</option>
                </select>
              </label>
              <label className="campo">
                <span className="rotulo">Quantidade</span>
                <select value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))}>
                  {[3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <button type="button" className="principal" onClick={gerarComIA} disabled={gerando || !tema.trim()}>
              {gerando ? 'Gerando…' : 'Gerar com IA'}
            </button>
            {!(chave && chave.trim()) && (
              <p className="dica">
                Você tem {geracoesTesteRestantes()} geração(ões) de teste gratuitas. Para gerar sem limite, cole a sua chave em "Conectar IA".
              </p>
            )}
            {msgIA && <p className="aviso ok" role="status">{msgIA}</p>}
            {erroIA && <p className="aviso" role="alert">{erroIA}</p>}
          </div>
        )}

        <label className="campo">
          <span className="rotulo">Título</span>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Quem vive no campo?" />
        </label>

        <label className="campo">
          <span className="rotulo">Instrução para o aluno</span>
          <input value={instrucao} onChange={(e) => setInstrucao(e.target.value)} placeholder="Ex.: Toque na resposta certa." />
        </label>

        {tipo !== 'livre' && itens.map((item, i) => (
          <fieldset key={i} className="item">
            <legend>{tipo === 'quiz' ? `Pergunta ${i + 1}` : `${NOMES_PAR[tipo]} ${i + 1}`}</legend>
            {tipo === 'quiz' ? (
              <>
                <input value={item.pergunta} onChange={(e) => atualizarItem(i, 'pergunta', e.target.value)} placeholder="Escreva a pergunta" />
                {item.opcoes.map((op, k) => (
                  <div className="linha-opcao" key={k}>
                    <input type="radio" name={`certa-${i}`} checked={item.correta === k} onChange={() => atualizarItem(i, 'correta', k)} title="Marcar como certa" />
                    <input value={op} onChange={(e) => atualizarOpcao(i, k, e.target.value)} placeholder={`Opção ${k + 1}`} />
                  </div>
                ))}
                {item.opcoes.length < 4 && <button type="button" className="sutil" onClick={() => adicionarOpcao(i)}>+ opção</button>}
              </>
            ) : (
              <>
                <input value={item.esquerda} onChange={(e) => atualizarItem(i, 'esquerda', e.target.value)} placeholder={ROTULOS_PAR[tipo][0]} />
                {CAMPO_DIREITO[tipo] && <input value={item.direita} onChange={(e) => atualizarItem(i, 'direita', e.target.value)} placeholder={ROTULOS_PAR[tipo][1]} />}
              </>
            )}
            {itens.length > 1 && <button type="button" className="sutil perigo" onClick={() => removerItem(i)}>Remover</button>}
          </fieldset>
        ))}
        {tipo !== 'livre' && <button type="button" className="secundario" onClick={adicionarItem}>+ adicionar {tipo === 'quiz' ? 'pergunta' : NOMES_PAR[tipo]}</button>}

        {tipo === 'quiz' && <p className="dica">Marque a bolinha ao lado da opção certa.</p>}

        {aviso.length > 0 && (
          <div className="aviso" role="alert">
            <strong>Antes de salvar:</strong>
            <ul>{aviso.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        )}

        <div className="acoes">
          <button type="button" className="principal" onClick={salvar}>{editando ? 'Salvar alterações' : 'Salvar no painel'}</button>
          <button type="button" className="secundario" onClick={exportar}>Baixar mini app (.html)</button>
          {onCancelar && <button type="button" className="sutil" onClick={onCancelar}>Cancelar</button>}
        </div>
      </div>

      <div className="coluna-previa">
        <div className="previa-topo">
          <h3>Prévia</h3>
          <button type="button" className="sutil" onClick={() => setMostrarPrevia((v) => !v)}>{mostrarPrevia ? 'Ocultar' : 'Mostrar'}</button>
        </div>
        {mostrarPrevia && (
          <iframe title="Prévia do mini app" className="previa" srcDoc={html} sandbox="allow-scripts" />
        )}
        <p className="dica">A prévia é exatamente o arquivo que você baixa. Ouça o botão 🔊 para testar a voz.</p>
      </div>
    </div>
  );
}
