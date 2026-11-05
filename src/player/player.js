/* Player do mini app. Roda sozinho no celular/computador do aluno.
   Recebe os dados em window.APP (injetado pelo gerador). */
(function () {
  var app = window.APP || { titulo: 'Mini app', itens: [], tipo: 'quiz' };
  var raiz = document.getElementById('app');
  var temVoz = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  var audio = null;

  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }

  function botao(texto, classe, aoClicar) {
    var b = el('button', 'btn ' + (classe || ''), texto);
    b.type = 'button';
    b.addEventListener('click', aoClicar);
    return b;
  }

  function som(tipo) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      var osc = audio.createOscillator();
      var ganho = audio.createGain();
      osc.connect(ganho);
      ganho.connect(audio.destination);
      osc.type = 'sine';
      if (tipo === 'acerto') {
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.setValueAtTime(880, t + 0.12);
      } else {
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.setValueAtTime(180, t + 0.15);
      }
      ganho.gain.setValueAtTime(0.0001, t);
      ganho.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.32);
    } catch (e) { /* sem som: o app continua funcionando */ }
  }

  function falar(texto) {
    if (!temVoz || !texto) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR';
      u.rate = 0.9;
      var vozes = window.speechSynthesis.getVoices().filter(function (v) {
        return /pt[-_]BR/i.test(v.lang);
      });
      if (vozes[0]) u.voice = vozes[0];
      window.speechSynthesis.speak(u);
    } catch (e) { /* sem voz: o app continua funcionando */ }
  }

  function embaralhar(lista) {
    var copia = lista.slice();
    for (var i = copia.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copia[i]; copia[i] = copia[j]; copia[j] = t;
    }
    return copia;
  }

  function cabecalho() {
    var topo = el('header', 'topo');
    topo.appendChild(el('h1', '', app.titulo));
    if (app.instrucao) topo.appendChild(el('p', 'instrucao', app.instrucao));
    var ouvirTudo = botao('🔊 Ouvir instrução', 'pequeno', function () {
      falar(app.titulo + '. ' + (app.instrucao || ''));
    });
    topo.appendChild(ouvirTudo);
    return topo;
  }

  function tela(conteudo) {
    raiz.innerHTML = '';
    raiz.appendChild(cabecalho());
    raiz.appendChild(conteudo);
  }

  /* ---------- Tela inicial ---------- */
  function inicio() {
    var c = el('section', 'cartao');
    var nomes = { quiz: 'Quiz de perguntas', relacionar: 'Relacione os pares', memoria: 'Jogo da memória', encaixe: 'Encaixe', ordenar: 'Monte a frase', rotina: 'Rotina visual', colorir: 'Pintar por número', receita: 'Receita' };
    c.appendChild(el('p', 'destaque', nomes[app.tipo] || 'Atividade'));
    c.appendChild(el('p', '', 'Total de ' + app.itens.length + (app.itens.length === 1 ? ' item' : ' itens') + '.'));
    c.appendChild(botao('Começar', 'principal', function () {
      rotas();
    }));
    tela(c);
  }

  function rotas() {
    if (app.tipo === 'quiz') quiz(0, 0);
    else if (app.tipo === 'memoria') memoria();
    else if (app.tipo === 'colorir') colorir();
    else if (app.tipo === 'receita') receita();
    else if (app.tipo === 'ordenar') sequencia(app.itens.map(function (it) {
      return { frase: it.esquerda, tokens: it.esquerda.split(/\s+/).filter(Boolean).map(function (w) { return { rotulo: w }; }) };
    }), false);
    else if (app.tipo === 'rotina') sequencia([{
      frase: app.itens.map(function (it) { return it.esquerda; }).join('. '),
      tokens: app.itens.map(function (it) { return { rotulo: it.esquerda, emoji: it.direita }; })
    }], true);
    else relacionar();
  }

  /* ---------- Quiz ---------- */
  function quiz(i, acertos) {
    if (i >= app.itens.length) return fim(acertos, app.itens.length);
    var item = app.itens[i];
    var c = el('section', 'cartao');
    c.appendChild(el('p', 'progresso', 'Pergunta ' + (i + 1) + ' de ' + app.itens.length));
    var pergunta = el('h2', 'pergunta', item.pergunta);
    c.appendChild(pergunta);
    var textoOpcoes = item.opcoes.map(function (o, k) { return (k + 1) + ') ' + o; }).join('. ');
    c.appendChild(botao('🔊 Ouvir pergunta', 'pequeno', function () {
      falar(item.pergunta + '. Opções: ' + textoOpcoes);
    }));
    var lista = el('div', 'opcoes');
    var feedback = el('p', 'feedback');
    var proximo = botao('Próxima', 'principal', function () { quiz(i + 1, acertos + (ganhou ? 1 : 0)); });
    proximo.style.display = 'none';
    var respondeu = false;
    var ganhou = false;
    item.opcoes.forEach(function (texto, k) {
      var b = botao(texto, 'opcao', function () {
        if (respondeu) return;
        respondeu = true;
        ganhou = k === item.correta;
        Array.prototype.forEach.call(lista.children, function (filho, n) {
          filho.disabled = true;
          if (n === item.correta) filho.classList.add('certa');
        });
        if (ganhou) {
          b.classList.add('acertou');
          feedback.textContent = 'Muito bem! 🎉';
          som('acerto');
          falar('Muito bem!');
        } else {
          b.classList.add('errou');
          var correta = item.opcoes[item.correta];
          feedback.textContent = 'Quase! A resposta certa é: ' + correta;
          som('erro');
          falar('Quase! A resposta certa é: ' + correta);
        }
        proximo.style.display = 'inline-block';
      });
      lista.appendChild(b);
    });
    c.appendChild(lista);
    c.appendChild(feedback);
    c.appendChild(proximo);
    tela(c);
  }

  /* ---------- Relacionar ---------- */
  function relacionar() {
    var esquerda = app.itens.map(function (p, k) { return { texto: p.esquerda, id: k }; });
    var direita = embaralhar(app.itens.map(function (p, k) { return { texto: p.direita, id: k }; }));
    var escolhido = null;
    var feitos = {};
    var erros = 0;
    var c = el('section', 'cartao');
    var status = el('p', 'feedback', 'Toque em um item da esquerda e depois no par da direita.');
    var grade = el('div', 'pares');
    var colE = el('div', 'coluna');
    var colD = el('div', 'coluna');

    function marcar(b, id) { b.classList.add('feito'); b.disabled = true; feitos[id] = true; }

    var sombra = app.tipo === 'encaixe';
    esquerda.forEach(function (item) {
      var b = botao(item.texto, 'par', function () {
        if (feitos['e' + item.id]) return;
        Array.prototype.forEach.call(colE.children, function (x) { x.classList.remove('selecionado'); });
        b.classList.add('selecionado');
        escolhido = { b: b, id: item.id };
        falar(item.texto);
      });
      item.botao = b;
      colE.appendChild(b);
    });

    direita.forEach(function (item) {
      var b = botao(item.texto, 'par' + (sombra ? ' sombra' : ''), function () {
        if (!escolhido) { status.textContent = 'Primeiro toque em um item da esquerda.'; falar(item.texto); return; }
        if (escolhido.id === item.id) {
          som('acerto');
          marcar(escolhido.b, 'e' + escolhido.id);
          marcar(b, 'd' + item.id);
          escolhido.b.classList.add('certo');
          b.classList.add('certo');
          if (sombra) { b.classList.remove('sombra'); b.textContent = item.texto; }
          status.textContent = sombra ? 'Encaixou! ' + escolhido.b.textContent : 'Isso! Par certo. 🎉';
          falar('Isso!');
          escolhido = null;
          if (Object.keys(feitos).length === app.itens.length * 2) {
            setTimeout(function () { fim(app.itens.length - erros, app.itens.length, erros); }, 900);
          }
        } else {
          som('erro');
          erros++;
          b.classList.add('errou');
          setTimeout(function () { b.classList.remove('errou'); }, 600);
          escolhido.b.classList.remove('selecionado');
          escolhido = null;
          status.textContent = 'Tente outro par. Não desanime!';
          falar('Tente outro par');
        }
      });
      if (sombra) b.setAttribute('aria-label', 'Sombra');
      item.botao = b;
      colD.appendChild(b);
    });

    grade.appendChild(colE);
    grade.appendChild(colD);
    c.appendChild(grade);
    c.appendChild(status);
    tela(c);
  }

  /* ---------- Jogo da memória ---------- */
  function memoria() {
    var cartas = embaralhar(app.itens.reduce(function (lista, p, k) {
      return lista.concat([{ texto: p.esquerda, id: k }, { texto: p.direita, id: k }]);
    }, []));
    var viradas = [];
    var achadas = 0;
    var tentativas = 0;
    var travado = false;
    var c = el('section', 'cartao');
    var status = el('p', 'feedback', 'Vire duas cartas e encontre os pares.');
    var grade = el('div', 'memoria');
    cartas.forEach(function (carta, idx) {
      var b = botao('?', 'carta', function () {
        if (travado || b.classList.contains('virada') || b.disabled) return;
        b.classList.add('virada');
        b.textContent = carta.texto;
        falar(carta.texto);
        viradas.push({ b: b, id: carta.id });
        if (viradas.length < 2) return;
        tentativas++;
        var primeira = viradas[0], segunda = viradas[1];
        viradas = [];
        if (primeira.id === segunda.id) {
          som('acerto');
          primeira.b.classList.add('certo'); segunda.b.classList.add('certo');
          primeira.b.disabled = true; segunda.b.disabled = true;
          achadas++;
          status.textContent = 'Isso! Par encontrado. 🎉';
          if (achadas === app.itens.length) {
            setTimeout(function () { fim(achadas, app.itens.length, tentativas - achadas); }, 900);
          }
        } else {
          som('erro');
          travado = true;
          status.textContent = 'Quase! Tente de novo.';
          setTimeout(function () {
            [primeira.b, segunda.b].forEach(function (x) { x.classList.remove('virada'); x.textContent = '?'; });
            travado = false;
          }, 1000);
        }
      });
      grade.appendChild(b);
    });
    c.appendChild(grade);
    c.appendChild(status);
    tela(c);
  }

  /* ---------- Ordenar palavras e montar rotina ---------- */
  function sequencia(rodadas, rotina) {
    var r = 0, erros = 0, concluidas = 0;

    function rodada() {
      if (r >= rodadas.length) return fim(concluidas, rodadas.length, erros);
      var R = rodadas[r];
      var tiles = embaralhar(R.tokens.map(function (t, k) { return { t: t, k: k }; }));
      var posicao = 0;
      var c = el('section', 'cartao');
      c.appendChild(el('p', 'progresso', rotina ? 'Monte a rotina' : 'Rodada ' + (r + 1) + ' de ' + rodadas.length));
      var montagem = el('div', 'montagem');
      var status = el('p', 'feedback', rotina ? 'Toque os passos na ordem certa do dia.' : 'Toque as palavras na ordem certa.');
      var grade = el('div', 'opcoes');
      tiles.forEach(function (tile) {
        var texto = (tile.t.emoji ? tile.t.emoji + ' ' : '') + tile.t.rotulo;
        var b = botao(texto, 'opcao', function () {
          if (b.disabled) return;
          if (tile.k === posicao) {
            b.disabled = true;
            b.classList.add('certo');
            falar(tile.t.rotulo);
            som('acerto');
            var item = el('span', 'montado', (rotina ? (posicao + 1) + '. ' : '') + tile.t.rotulo);
            montagem.appendChild(item);
            posicao++;
            if (posicao === R.tokens.length) {
              concluidas++;
              status.textContent = 'Muito bem! 🎉';
              falar(R.frase);
              setTimeout(function () { r++; rodada(); }, 1600);
            }
          } else {
            erros++;
            som('erro');
            b.classList.add('errou');
            status.textContent = 'Quase! Essa vem depois. Tente de novo.';
            setTimeout(function () { b.classList.remove('errou'); }, 600);
          }
        });
        grade.appendChild(b);
      });
      c.appendChild(montagem);
      c.appendChild(status);
      c.appendChild(grade);
      tela(c);
    }
    rodada();
  }

  /* ---------- Colorir por número ---------- */
  function normCor(n) {
    return String(n || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function colorir() {
    var cores = window.CORES || {};
    var quadros = [];
    app.itens.forEach(function (it) {
      for (var j = 0; j < 3; j++) quadros.push({ num: String(it.esquerda).trim(), cor: cores[normCor(it.direita)] || '#ffffff', nome: it.direita });
    });
    quadros = embaralhar(quadros);
    var escolhida = null;
    var pintadas = 0, erros = 0;
    var c = el('section', 'cartao');
    var status = el('p', 'feedback', 'Escolha uma cor e depois toque nos quadrinhos com o mesmo número.');
    var paleta = el('div', 'paleta');
    var grade = el('div', 'quadros');
    var botoesPaleta = [];

    app.itens.forEach(function (it) {
      var b = botao(String(it.esquerda).trim() + ' = ' + it.direita, 'paleta-botao', function () {
        escolhida = it;
        botoesPaleta.forEach(function (x) { x.classList.remove('selecionado'); });
        b.classList.add('selecionado');
        falar('Número ' + it.esquerda + ', ' + it.direita);
        status.textContent = 'Agora toque nos quadrinhos com o número ' + it.esquerda + '.';
      });
      b.style.borderLeft = '18px solid ' + (cores[normCor(it.direita)] || '#ffffff');
      botoesPaleta.push(b);
      paleta.appendChild(b);
    });

    quadros.forEach(function (q) {
      var b = botao(q.num, 'quadro', function () {
        if (b.disabled) return;
        if (!escolhida) { status.textContent = 'Primeiro escolha uma cor na paleta.'; return; }
        if (String(escolhida.esquerda).trim() === q.num) {
          b.style.background = q.cor;
          b.textContent = '';
          b.disabled = true;
          pintadas++;
          som('acerto');
          if (pintadas === quadros.length) {
            status.textContent = 'Desenho completo! 🎨';
            setTimeout(function () { fim(pintadas, quadros.length, erros); }, 900);
          } else {
            status.textContent = 'Isso! Continue.';
          }
        } else {
          erros++;
          som('erro');
          status.textContent = 'Esse número pede outra cor. Procure o ' + q.num + '.';
          b.classList.add('errou');
          setTimeout(function () { b.classList.remove('errou'); }, 500);
        }
      });
      grade.appendChild(b);
    });

    c.appendChild(paleta);
    c.appendChild(grade);
    c.appendChild(status);
    tela(c);
  }

  /* ---------- Receita ---------- */
  function receita() {
    var marcados = {};
    var c = el('section', 'cartao');
    c.appendChild(el('h2', 'pergunta', 'Ingredientes'));
    var lista = el('div', 'opcoes');
    app.itens.forEach(function (it, k) {
      var b = botao(it.esquerda, 'opcao', function () {
        marcados[k] = !marcados[k];
        b.classList.toggle('certo', !!marcados[k]);
        falar(it.esquerda);
      });
      lista.appendChild(b);
    });
    c.appendChild(el('p', 'dica', 'Toque em cada ingrediente que você já separou.'));
    c.appendChild(lista);
    c.appendChild(botao('🔊 Ouvir ingredientes', 'pequeno', function () {
      falar('Ingredientes: ' + app.itens.map(function (it) { return it.esquerda; }).join('. '));
    }));
    c.appendChild(botao('Começar o preparo', 'principal', function () { passo(0); }));
    tela(c);
  }

  function passo(i) {
    if (i >= app.itens.length) return fim(app.itens.length, app.itens.length, 0);
    var it = app.itens[i];
    var ultimo = i === app.itens.length - 1;
    var c = el('section', 'cartao');
    c.appendChild(el('p', 'progresso', 'Passo ' + (i + 1) + ' de ' + app.itens.length));
    c.appendChild(el('h2', 'pergunta', it.direita || it.esquerda));
    c.appendChild(botao('🔊 Ouvir passo', 'pequeno', function () { falar(it.direita || it.esquerda); }));
    c.appendChild(botao(ultimo ? 'Terminei!' : 'Próximo passo', 'principal', function () { passo(i + 1); }));
    tela(c);
    falar(it.direita || it.esquerda);
  }

  /* ---------- Fim ---------- */
  function fim(acertos, total, erros) {
    var c = el('section', 'cartao');
    var texto;
    if (app.tipo === 'quiz') {
      texto = 'Você acertou ' + acertos + ' de ' + total + '.';
    } else if (app.tipo === 'encaixe') {
      texto = 'Você encaixou todas as ' + total + ' peças' + (erros ? ' com ' + erros + (erros === 1 ? ' tentativa errada' : ' tentativas erradas') : ' de primeira') + '.';
    } else if (app.tipo === 'colorir') {
      texto = 'Você pintou ' + acertos + ' quadrinho(s)' + (erros ? ' com ' + erros + (erros === 1 ? ' erro' : ' erros') : ' sem erros') + '.';
    } else if (app.tipo === 'receita') {
      texto = 'Receita pronta! Bom apetite 🍽️';
    } else if (app.tipo === 'ordenar') {
      texto = 'Você montou ' + acertos + ' de ' + total + ' frase(s)' + (erros ? ' com ' + erros + (erros === 1 ? ' erro' : ' erros') : ' de primeira') + '.';
    } else if (app.tipo === 'rotina') {
      texto = 'Rotina montada' + (erros ? ' com ' + erros + (erros === 1 ? ' erro' : ' erros') : ' de primeira') + '.';
    } else if (app.tipo === 'memoria') {
      texto = 'Você encontrou todos os ' + total + ' pares' + (erros ? ' com ' + erros + ' erro(s) a mais' : ' de primeira') + '.';
    } else {
      texto = 'Você ligou todos os pares' + (erros ? ' com ' + erros + (erros === 1 ? ' tentativa errada' : ' tentativas erradas') : ' de primeira') + '.';
    }
    c.appendChild(el('h2', 'pergunta', 'Fim! 🏁'));
    c.appendChild(el('p', 'resultado', texto));
    c.appendChild(botao('🔊 Ouvir resultado', 'pequeno', function () { falar(texto); }));
    c.appendChild(botao('Jogar de novo', 'principal', rotas));
    tela(c);
    falar(texto);
  }

  inicio();
})();
