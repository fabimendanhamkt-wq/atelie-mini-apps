import React from 'react';

/* Painel inicial: resumo e atalhos, no estilo de dashboard. */
export default function Inicio({ apps, chave, restantes, irPara }) {
  const livres = apps.filter((a) => a.tipo === 'livre').length;
  const paginas = apps.filter((a) => a.pagina).length;
  const comChave = !!(chave && chave.trim());
  return (
    <div className="inicio">
      <div className="cards-resumo">
        <div className="card-resumo">
          <span className="rotulo-card">Apps criados</span>
          <strong>{apps.length}</strong>
          <span className="sub">{livres} completo(s) com IA</span>
        </div>
        <div className="card-resumo">
          <span className="rotulo-card">Páginas de vendas</span>
          <strong>{paginas}</strong>
          <span className="sub">de {apps.length} app(s)</span>
        </div>
        <div className="card-resumo">
          <span className="rotulo-card">Geração com IA</span>
          <strong>{comChave ? 'Ilimitada' : restantes}</strong>
          <span className="sub">{comChave ? 'usando sua chave' : 'gerações de teste restantes'}</span>
        </div>
      </div>

      <div className="atalhos">
        <button type="button" className="principal" onClick={() => irPara('criar')}>+ Criar app com IA</button>
        <button type="button" className="secundario" onClick={() => irPara('meus')}>Ver meus apps</button>
        <button type="button" className="secundario" onClick={() => irPara('pagina')}>Página de vendas</button>
        {!comChave && <button type="button" className="secundario" onClick={() => irPara('ia')}>Conectar minha chave</button>}
      </div>

      <div className="painel-caixa">
        <h3>Como começar</h3>
        <ol className="passos">
          <li>Em <strong>Criar app</strong>, descreva o que você quer, do jeito que quiser: o tema, o público e como o app deve funcionar.</li>
          <li>Confira a prévia e ajuste o código, se quiser.</li>
          <li>Baixe o arquivo <code>.html</code> ou salve no painel.</li>
          <li>Crie a <strong>página de vendas</strong> do app, e depois publique no Netlify.</li>
        </ol>
      </div>
    </div>
  );
}
