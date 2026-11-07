import React, { useEffect, useState } from 'react';
import Inicio from './components/Inicio.jsx';
import Criar from './components/Criar.jsx';
import Meus from './components/Meus.jsx';
import ConectarIA from './components/ConectarIA.jsx';
import Publicar from './components/Publicar.jsx';
import PaginaVendas from './components/PaginaVendas.jsx';
import { carregarApps, salvarApps, carregarChaveSalva } from './lib/armazenamento.js';
import { geracoesTesteRestantes } from './lib/ia.js';
import { SEM_SERVIDOR } from './lib/modo.js';

const MENU = [
  { id: 'inicio', rotulo: 'Dashboard', icone: '🏠' },
  { id: 'criar', rotulo: 'Criar app', icone: '✨' },
  { id: 'meus', rotulo: 'Meus apps', icone: '📚' },
  { id: 'pagina', rotulo: 'Página de vendas', icone: '🚀' },
  { id: 'ia', rotulo: 'Conectar IA', icone: '🔑' },
  { id: 'publicar', rotulo: 'Publicar', icone: '🌐' },
];

export default function App() {
  const [aba, setAba] = useState('inicio');
  const [apps, setApps] = useState(() => carregarApps());
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [chave, setChave] = useState(() => carregarChaveSalva());
  const [appPagina, setAppPagina] = useState(null);

  useEffect(() => {
    if (!salvarApps(apps)) setAviso('Não consegui guardar os apps neste navegador. Baixe o backup para não perder o trabalho.');
  }, [apps]);

  function salvar(app, destino = 'meus') {
    setApps((lista) => {
      const existe = lista.some((a) => a.id === app.id);
      return existe ? lista.map((a) => (a.id === app.id ? app : a)) : [app, ...lista];
    });
    setEditando(null);
    setAviso('');
    if (destino === 'pagina') {
      setAppPagina(app.id);
      setAba('pagina');
    } else {
      setAba('meus');
    }
  }

  function importar(lista) {
    setApps((atual) => {
      const ids = new Set(atual.map((a) => a.id));
      return [...lista.filter((a) => a && a.id && !ids.has(a.id)), ...atual];
    });
  }

  function salvarPagina(appId, pagina) {
    setApps((lista) => lista.map((a) => (a.id === appId ? { ...a, pagina } : a)));
  }

  function novo() {
    setEditando(null);
    setFormKey((k) => k + 1);
    setAba('criar');
  }

  const titulo = MENU.find((m) => m.id === aba)?.rotulo || '';
  const comChave = !!(chave && chave.trim());

  return (
    <div className="layout">
      <aside className="menu-lateral">
        <div className="marca-topo">
          <img className="logo" src="./logo-240.png" alt="Ateliê de Mini Apps da Sala ao Digital" />
          <div>
            <strong>Ateliê de Mini Apps</strong>
            <span>da Sala ao Digital</span>
          </div>
        </div>
        <nav aria-label="Seções">
          {MENU.map((m) => (
            <button key={m.id} type="button" className={aba === m.id ? 'ativo' : ''} onClick={() => setAba(m.id)}>
              <span aria-hidden="true">{m.icone}</span> {m.rotulo}
            </button>
          ))}
        </nav>
        <p className="rodape-menu">Seus apps ficam neste navegador. Faça backup em "Meus apps".</p>
      </aside>

      <div className="conteudo">
        <header className="barra-topo">
          <h1>{titulo}</h1>
          <span className={comChave ? 'pilula ok' : 'pilula'}>{comChave ? 'IA conectada com sua chave' : SEM_SERVIDOR ? 'Sem IA conectada' : `Teste: ${geracoesTesteRestantes()} geração(ões)`}</span>
        </header>

        {aviso && <p className="aviso" role="alert">{aviso}</p>}

        <main>
          {aba === 'inicio' && <Inicio apps={apps} chave={chave} restantes={geracoesTesteRestantes()} irPara={setAba} />}
          {aba === 'criar' && (
            <>
              {editando && <p className="dica">Editando "{editando.titulo}". <button type="button" className="sutil" onClick={novo}>Criar um novo em vez disso</button></p>}
              <Criar key={editando?.id || 'novo-' + formKey} editando={editando} chave={chave} onSalvar={(app) => salvar(app, 'meus')} onSalvarEIrPagina={(app) => salvar(app, 'pagina')} onCancelar={editando ? novo : null} />
            </>
          )}
          {aba === 'meus' && (
            <Meus
              apps={apps}
              onEditar={(app) => { setEditando(app); setAba('criar'); }}
              onExcluir={(id) => setApps((lista) => lista.filter((a) => a.id !== id))}
              onImportar={importar}
              onPagina={(app) => { setAppPagina(app.id); setAba('pagina'); }}
            />
          )}
          {aba === 'ia' && <ConectarIA chave={chave} setChave={setChave} lembrarInicial={!!carregarChaveSalva()} />}
          {aba === 'pagina' && <PaginaVendas key={appPagina || 'nenhum'} apps={apps} appIdInicial={appPagina} chave={chave} salvarPagina={salvarPagina} onCriarApp={novo} />}
          {aba === 'publicar' && <Publicar />}
        </main>
      </div>
    </div>
  );
}
