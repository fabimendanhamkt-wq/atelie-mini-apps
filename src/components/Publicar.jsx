import React from 'react';

export default function Publicar() {
  return (
    <div className="publicar">
      <h2>Como colocar seu mini app no ar</h2>
      <p>Você não precisa de programação nem de hospedagem paga. O Netlify tem um plano gratuito e sem cartão.</p>

      <ol className="passos">
        <li>No painel, vá em <strong>"Meus apps"</strong> e clique em <strong>"Baixar (.html)"</strong> no app que quer publicar.</li>
        <li>No computador, crie uma pasta com um nome simples (ex.: <code>meu-app-quiz</code>) e coloque dentro dela o arquivo baixado, <strong>renomeado para <code>index.html</code></strong>.</li>
        <li>Acesse <strong>app.netlify.com/drop</strong>, crie uma conta gratuita e arraste a <strong>pasta</strong> (não o arquivo solto) para a área indicada.</li>
        <li>Em alguns segundos aparece um link do tipo <code>https://nome-aleatorio.netlify.app</code>. Esse é o seu app no ar.</li>
        <li>Para trocar o nome do link: em <strong>Site settings → Change site name</strong>.</li>
      </ol>

      <h3>Antes de divulgar</h3>
      <ul>
        <li>Abra o link no celular e teste: toque, ouça a voz, confira o som de acerto e erro.</li>
        <li>Para atualizar um app depois, edite no painel, baixe de novo e arraste a pasta nova no Netlify.</li>
        <li>Quem recebe o link não precisa instalar nada nem criar conta.</li>
      </ul>

      <p className="dica">Os passos do Netlify podem mudar de aparência com o tempo. A ideia continua a mesma: arrastar a pasta com o <code>index.html</code>.</p>
    </div>
  );
}
