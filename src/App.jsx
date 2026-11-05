import React, { useEffect, useState } from 'react';
import Criar from './components/Criar.jsx';
import Meus from './components/Meus.jsx';
import ConectarIA from './components/ConectarIA.jsx';
import Publicar from './components/Publicar.jsx';
import PaginaVendas from './components/PaginaVendas.jsx';
import { carregarApps, salvarApps, carregarChaveSalva } from './lib/armazenamento.js';

const ABAS = [
  { id: 'criar', rotulo: 'Criar' },
  { id: 'meus', rotulo: 'Meus apps' },
  { id: 'ia', rotulo: 'Conectar IA' },
  { id: 'pagina', rotulo: 'Página de vendas' },
  { id: 'publicar', rotulo: 'Publicar' },
];

export default function App() {
  const [aba, setAba] = useState('criar');
  const [apps, setApps] = useState(() => carregarApps());
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [chave, setChave] = useState(() => carregarChaveSalva());
  const [appPagina, setAppPagina] = useState(null);

  useEffect(() => {
    if (!salvarApps(apps)) setAviso('Não consegui guardar os apps neste navegador. Baixe o backup para não perder o trabalho.');
  }, [apps]);

  function salvar(app) {
    setApps((lista) => {
      const existe = lista.some((a) => a.id === app.id);
      return existe ? lista.map((a) => (a.id === app.id ? app : a)) : [app, ...lista];
    });
    setEditando(null);
    setAba('meus');
    setAviso('');
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

  return (
    <div className="painel">
      <header className="cabecalho">
        <img className="logo" src="./logo-240.png" alt="Ateliê de Mini Apps da Sala ao Digital" />
        <h1>Ateliê de Mini Apps</h1>
        <p className="marca">da Sala ao Digital</p>
        <p>Crie jogos e atividades com voz, prontos para colocar no ar.</p>
      </header>

      <nav className="abas" aria-label="Seções">
        {ABAS.map((a) => (
          <button key={a.id} type="button" className={aba === a.id ? 'ativo' : ''} onClick={() => setAba(a.id)}>{a.rotulo}</button>
        ))}
      </nav>

      {aviso && <p className="aviso" role="alert">{aviso}</p>}

      <main>
        {aba === 'criar' && (
          <>
            {editando && <p className="dica">Editando "{editando.titulo}". <button type="button" className="sutil" onClick={novo}>Criar um novo em vez disso</button></p>}
            <Criar key={editando?.id || 'novo-' + formKey} editando={editando} chave={chave} onSalvar={salvar} onCancelar={editando ? novo : null} />
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

      <footer className="rodape">Seus apps ficam no seu navegador. Faça backup em "Meus apps".</footer>
    </div>
  );
}
