import React, { useRef, useState } from 'react';
import { gerarHtml } from '../lib/gerador.js';
import { baixarArquivo, nomeArquivo } from '../lib/armazenamento.js';

export default function Meus({ apps, onEditar, onExcluir, onImportar, onPagina }) {
  const [mensagem, setMensagem] = useState('');
  const arquivoRef = useRef(null);

  function exportarBackup() {
    const conteudo = JSON.stringify({ versao: 1, apps }, null, 2);
    baixarArquivo('backup-meus-mini-apps.json', conteudo, 'application/json');
    setMensagem('Backup baixado. Guarde esse arquivo: ele permite recuperar seus apps em outro navegador.');
  }

  function lerBackup(evento) {
    const arq = evento.target.files?.[0];
    if (!arq) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const dados = JSON.parse(String(leitor.result));
        const lista = Array.isArray(dados.apps) ? dados.apps : null;
        if (!lista) throw new Error('arquivo sem apps');
        onImportar(lista);
        setMensagem(`${lista.length} app(s) importado(s).`);
      } catch (e) {
        setMensagem('Não consegui ler esse arquivo. Use um backup gerado por este painel.');
      }
    };
    leitor.readAsText(arq);
    evento.target.value = '';
  }

  return (
    <div className="meus">
      <div className="barra-backup">
        <button type="button" className="secundario" onClick={exportarBackup} disabled={!apps.length}>Baixar backup (.json)</button>
        <button type="button" className="secundario" onClick={() => arquivoRef.current?.click()}>Importar backup</button>
        <input ref={arquivoRef} type="file" accept="application/json,.json" hidden onChange={lerBackup} />
      </div>
      <p className="dica">Os apps ficam guardados <strong>neste navegador</strong>. Faça o backup de vez em quando.</p>
      {mensagem && <p className="aviso ok" role="status">{mensagem}</p>}

      {apps.length === 0 && <p className="vazio">Você ainda não criou nenhum mini app. Vá em "Criar" para começar.</p>}

      <ul className="lista-apps">
        {apps.map((app) => (
          <li key={app.id} className="card-app">
            <div>
              <strong>{app.titulo}</strong>
              <span className="etiqueta">{{ quiz: 'Quiz', relacionar: 'Relacionar', memoria: 'Memória', encaixe: 'Encaixe', ordenar: 'Frase', rotina: 'Rotina', colorir: 'Colorir', receita: 'Receita' }[app.tipo]}</span>
              <p className="dica">{app.itens.length} {app.tipo === 'quiz' ? 'pergunta(s)' : 'item(ns)'}</p>
            </div>
            <div className="acoes">
              <button type="button" className="principal" onClick={() => onPagina(app)}>Criar página de vendas</button>
              <button type="button" className="secundario" onClick={() => onEditar(app)}>Editar</button>
              <button type="button" className="secundario" onClick={() => baixarArquivo(nomeArquivo(app.titulo) + '.html', gerarHtml(app), 'text/html;charset=utf-8')}>Baixar (.html)</button>
              <button type="button" className="sutil perigo" onClick={() => { if (window.confirm('Excluir "' + app.titulo + '"? Essa ação não pode ser desfeita.')) onExcluir(app.id); }}>Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
