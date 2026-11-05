import React, { useState } from 'react';
import { testarChave } from '../lib/gemini.js';
import { salvarChave, esquecerChave } from '../lib/armazenamento.js';

/* A chave é da própria aluna. Ela fica só na memória da página,
   a menos que ela marque "lembrar neste navegador". */
export default function ConectarIA({ chave, setChave, lembrarInicial }) {
  const [lembrar, setLembrar] = useState(!!lembrarInicial);
  const [estado, setEstado] = useState({ carregando: false, sucesso: '', erro: '' });

  async function testar() {
    if (!chave.trim()) {
      setEstado({ carregando: false, sucesso: '', erro: 'Cole sua chave antes de testar.' });
      return;
    }
    setEstado({ carregando: true, sucesso: '', erro: '' });
    try {
      const resposta = await testarChave(chave);
      setEstado({ carregando: false, sucesso: 'Conectado! A IA respondeu: "' + resposta + '"', erro: '' });
      if (lembrar) salvarChave(chave.trim());
    } catch (e) {
      setEstado({
        carregando: false,
        sucesso: '',
        erro: 'Não conectou: ' + e.message + '. Confira se a chave foi copiada inteira e se ela está ativa no AI Studio.',
      });
    }
  }

  function esquecer() {
    esquecerChave();
    setChave('');
    setLembrar(false);
    setEstado({ carregando: false, sucesso: '', erro: '' });
  }

  return (
    <div className="conectar">
      <h2>Conectar uma IA para gerar com IA</h2>
      <p>
        Com a IA conectada, você digita só o <strong>tema</strong> e o painel cria as perguntas, pares e passos.
        Sem a IA, você continua criando tudo manualmente.
      </p>

      <div className="aviso">
        <strong>Sua chave é sua.</strong>
        <ul>
          <li>Ela é usada só no seu navegador e vai direto para o Google.</li>
          <li>Não enviamos a chave para nenhum servidor.</li>
          <li>Nunca compartilhe a chave com outras pessoas.</li>
        </ul>
      </div>

      <h3>Como conseguir a chave (gratuita)</h3>
      <ol className="passos">
        <li>Entre com sua conta Google em <strong>aistudio.google.com</strong>.</li>
        <li>Clique em <strong>"Get API key"</strong> (ou "Criar chave de API") e depois em criar a chave.</li>
        <li>Copie a chave (ela começa com <code>AIza</code>) e cole abaixo.</li>
      </ol>
      <p className="dica">
        O plano gratuito tem limite de uso por minuto e por dia, e esses limites podem mudar.
        Cada geração usa uma parte desse limite. Se aparecer erro de limite, espere um pouco e tente de novo.
      </p>

      <label className="campo">
        <span className="rotulo">Sua chave de API</span>
        <input type="password" value={chave} onChange={(e) => setChave(e.target.value)} placeholder="AIza..." autoComplete="off" />
      </label>

      <label className="marcar">
        <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
        Lembrar neste navegador (não recomendado em computador compartilhado)
      </label>

      <div className="acoes">
        <button type="button" className="principal" onClick={testar} disabled={estado.carregando}>
          {estado.carregando ? 'Testando…' : 'Testar conexão'}
        </button>
        <button type="button" className="sutil" onClick={esquecer}>Esquecer chave</button>
      </div>

      {estado.sucesso && <p className="aviso ok" role="status">{estado.sucesso}</p>}
      {estado.erro && <p className="aviso" role="alert">{estado.erro}</p>}
    </div>
  );
}
