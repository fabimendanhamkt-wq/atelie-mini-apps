/* Geração de conteúdo com a chave da própria aluna.
   A chave vai direto do navegador para o Google. Nada passa por servidor nosso. */
import { CORES, nomeCorNormalizado } from './cores.js';

const MODELO = 'gemini-3.8-flash';

const ESQUEMA_QUIZ = {
  type: 'OBJECT',
  properties: {
    titulo: { type: 'STRING' },
    instrucao: { type: 'STRING' },
    itens: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          pergunta: { type: 'STRING' },
          opcoes: { type: 'ARRAY', items: { type: 'STRING' } },
          correta: { type: 'INTEGER' },
        },
        required: ['pergunta', 'opcoes', 'correta'],
      },
    },
  },
  required: ['titulo', 'instrucao', 'itens'],
};

const ESQUEMA_PARES = {
  type: 'OBJECT',
  properties: {
    titulo: { type: 'STRING' },
    instrucao: { type: 'STRING' },
    itens: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          esquerda: { type: 'STRING' },
          direita: { type: 'STRING' },
        },
        required: ['esquerda', 'direita'],
      },
    },
  },
  required: ['titulo', 'instrucao', 'itens'],
};

const REGRAS = {
  quiz: 'Cada item é uma pergunta com 3 opções curtas, uma correta. "correta" é o índice (0, 1 ou 2) da opção certa.',
  relacionar: 'Cada item é um par relacionado (ex.: um animal e o som que ele faz). "esquerda" e "direita" são textos curtos.',
  memoria: 'Cada item é um par para jogo da memória: duas cartas que combinam (ex.: uma palavra e a figura que ela descreve). Textos curtos.',
  encaixe: '"esquerda" é o nome de algo curto. "direita" é um único emoji que representa esse nome.',
  ordenar: 'Cada item é uma frase curta e correta, na ordem natural da língua, sem ponto final. Use "direita" vazio.',
  rotina: 'Cada item é um passo de uma rotina do dia, na ordem em que acontece. "esquerda" é o passo curto e "direita" é um emoji.',
  colorir: '"esquerda" é um número em ordem (1, 2, 3...). "direita" é o nome de uma cor, usando somente: vermelho, azul, amarelo, verde, laranja, roxo, rosa, marrom, preto, cinza.',
  receita: '"esquerda" é um ingrediente com quantidade (ex.: 2 ovos). "direita" é um passo do modo de preparo, na ordem de execução.',
};

const NOMES = {
  quiz: 'Quiz', relacionar: 'Relacionar pares', memoria: 'Jogo da memória', encaixe: 'Encaixe',
  ordenar: 'Montar frase', rotina: 'Rotina visual', colorir: 'Pintar por número', receita: 'Receita',
};

function montarPrompt(tipo, tema, ano, quantidade) {
  const publico = ano ? `Público: ${ano}.` : 'Público: crianças.';
  return [
    'Você é uma professora criativa que cria atividades pedagógicas em português do Brasil.',
    `Tema pedido pela professora: "${tema}". ${publico}`,
    `Crie exatamente ${quantidade} itens para a atividade "${NOMES[tipo]}".`,
    REGRAS[tipo],
    'Seja criativa e variada: use situações do dia a dia, histórias curtas, personagens e exemplos diferentes entre si. Evite itens repetidos ou muito parecidos.',
    'Linguagem clara e alegre, adequada ao público. Título e instrução curtos e convidativos.',
    'Se o tema pedir algo que não seja um fato real (uma história, um personagem), pode criar à vontade. Não apresente como fato científico, número ou data algo que você não tenha certeza.',
  ].join(' ');
}

async function chamarGemini(chave, prompt, esquema) {
  const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave.trim() },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: esquema, maxOutputTokens: esquema === ESQUEMA_LIVRE_CLIENTE ? 32768 : 8192 },
    }),
  });
  let dados = {};
  try { dados = await resposta.json(); } catch (e) { /* sem JSON */ }
  if (resposta.status === 429) {
    throw new Error('Limite de uso da sua chave atingido. Espere um minuto ou tente amanhã (o plano gratuito tem cota diária).');
  }
  if (!resposta.ok) {
    throw new Error(dados?.error?.message || 'Erro ' + resposta.status + ' ao falar com a IA.');
  }
  const texto = dados?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new Error('A IA respondeu sem conteúdo. Tente gerar de novo.');
  try {
    return JSON.parse(texto);
  } catch (e) {
    throw new Error('A resposta da IA não veio no formato esperado. Tente gerar de novo.');
  }
}

/* Confere o que a IA devolveu e converte para o formato do editor.
   Itens inválidos são descartados; se sobrar pouco, avisa. */
export function conferirConteudo(tipo, bruto, quantidade) {
  if (!bruto || !Array.isArray(bruto.itens)) throw new Error('A IA não devolveu itens. Tente gerar de novo.');
  const titulo = String(bruto.titulo || '').trim();
  const instrucao = String(bruto.instrucao || '').trim();
  let itens;
  if (tipo === 'quiz') {
    itens = bruto.itens
      .map((it) => {
        const opcoes = (Array.isArray(it.opcoes) ? it.opcoes : []).map((o) => String(o).trim()).filter(Boolean).slice(0, 4);
        const correta = Number.isInteger(it.correta) && it.correta >= 0 && it.correta < opcoes.length ? it.correta : 0;
        return { pergunta: String(it.pergunta || '').trim(), opcoes, correta };
      })
      .filter((it) => it.pergunta && it.opcoes.length >= 2);
  } else {
    itens = bruto.itens
      .map((it) => ({ esquerda: String(it.esquerda || '').trim(), direita: String(it.direita || '').trim() }))
      .filter((it) => it.esquerda && (tipo === 'ordenar' || it.direita))
      .filter((it) => tipo !== 'colorir' || CORES[nomeCorNormalizado(it.direita)])
      .filter((it) => tipo !== 'encaixe' || it.direita.length <= 8);
  }
  itens = itens.slice(0, quantidade);
  if (itens.length < 2) throw new Error('A IA gerou poucos itens válidos. Tente gerar de novo ou mude o tema.');
  return { titulo, instrucao, itens };
}

/* Gerações de teste (sem chave própria) feitas por este navegador. */
export const LIMITE_TESTE = 3;
const CHAVE_TESTE = 'dashboard-apps:geracoes-teste';

export function geracoesTesteUsadas() {
  try { return Number(window.localStorage.getItem(CHAVE_TESTE)) || 0; } catch (e) { return 0; }
}

function registrarGeracaoTeste() {
  try { window.localStorage.setItem(CHAVE_TESTE, String(geracoesTesteUsadas() + 1)); } catch (e) { /* sem armazenamento */ }
}

export function geracoesTesteRestantes() {
  return Math.max(0, LIMITE_TESTE - geracoesTesteUsadas());
}

/* Com chave própria: chamada direta ao Google, sem limite do painel.
   Sem chave: usa o teste gratuito pela função do servidor, até LIMITE_TESTE vezes. */
export async function gerarConteudo({ chave, tipo, tema, ano, quantidade }) {
  if (!tema || !tema.trim()) throw new Error('Digite o tema.');
  const temTema = tema.trim();
  if (chave && chave.trim()) {
    const esquema = tipo === 'quiz' ? ESQUEMA_QUIZ : ESQUEMA_PARES;
    const bruto = await chamarGemini(chave, montarPrompt(tipo, temTema, ano, quantidade), esquema);
    return conferirConteudo(tipo, bruto, quantidade);
  }
  if (geracoesTesteRestantes() <= 0) {
    throw new Error('Você usou as ' + LIMITE_TESTE + ' gerações de teste. Cole sua chave em "Conectar IA" para continuar gerando.');
  }
  const r = await fetch('/.netlify/functions/gerar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, tema: temTema, ano, quantidade }),
  });
  let dados = {};
  try { dados = await r.json(); } catch (e) { /* sem JSON */ }
  if (!r.ok) throw new Error(dados.erro || 'Não consegui gerar agora. Tente de novo.');
  let bruto;
  try { bruto = JSON.parse(dados.conteudo); } catch (e) { throw new Error('A resposta não veio no formato esperado. Tente de novo.'); }
  const resultado = conferirConteudo(tipo, bruto, quantidade);
  registrarGeracaoTeste();
  return resultado;
}

/* Textos da página de vendas, a partir do nome e do que o app faz. */
const ESQUEMA_VENDAS_CLIENTE = {
  type: 'OBJECT',
  properties: {
    promessa: { type: 'STRING' },
    paraQuem: { type: 'STRING' },
    beneficios: { type: 'ARRAY', items: { type: 'STRING' } },
    textoBotao: { type: 'STRING' },
  },
  required: ['promessa', 'paraQuem', 'beneficios', 'textoBotao'],
};

function promptVendas(produto, resumo) {
  return [
    'Você escreve textos de página de vendas em português do Brasil para um material pedagógico.',
    `Produto: "${produto}". O que ele faz: ${resumo}.`,
    'Escreva: uma promessa curta e clara (até 12 palavras); para quem é (uma frase);',
    'de 3 a 5 benefícios curtos, cada um começando com verbo (ex.: "Ensina...", "Economiza..."); e um texto curto para o botão.',
    'Use somente o que está informado acima. Não invente preço, números, porcentagens, depoimentos, garantias, resultados ou prazos.',
  ].join(' ');
}

export async function gerarTextosVenda({ chave, produto, resumo }) {
  if (!produto || !produto.trim()) throw new Error('Informe o nome do produto.');
  const resumoFinal = (resumo || '').trim() || 'material pedagógico';
  if (chave && chave.trim()) {
    const bruto = await chamarGemini(chave, promptVendas(produto.trim(), resumoFinal), ESQUEMA_VENDAS_CLIENTE);
    return conferirVendas(bruto);
  }
  if (geracoesTesteRestantes() <= 0) {
    throw new Error('Você usou as ' + LIMITE_TESTE + ' gerações de teste. Cole sua chave em "Conectar IA" para continuar.');
  }
  const r = await fetch('/.netlify/functions/gerar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: 'vendas', tema: produto.trim(), resumo: resumoFinal }),
  });
  let dados = {};
  try { dados = await r.json(); } catch (e) { /* sem JSON */ }
  if (!r.ok) throw new Error(dados.erro || 'Não consegui gerar agora. Tente de novo.');
  let bruto;
  try { bruto = JSON.parse(dados.conteudo); } catch (e) { throw new Error('A resposta não veio no formato esperado. Tente de novo.'); }
  const resultado = conferirVendas(bruto);
  registrarGeracaoTeste();
  return resultado;
}

function conferirVendas(bruto) {
  const beneficios = (Array.isArray(bruto?.beneficios) ? bruto.beneficios : [])
    .map((b) => String(b).trim()).filter(Boolean).slice(0, 5);
  if (!bruto?.promessa || beneficios.length < 2) throw new Error('A IA não gerou textos suficientes. Tente de novo.');
  return {
    promessa: String(bruto.promessa).trim(),
    paraQuem: String(bruto.paraQuem || '').trim(),
    beneficios: beneficios.join('\n'),
    textoBotao: String(bruto.textoBotao || 'Quero começar agora').trim(),
  };
}


/* App completo: a IA escreve o HTML inteiro a partir do tema livre. */
const ESQUEMA_LIVRE_CLIENTE = {
  type: 'OBJECT',
  properties: { titulo: { type: 'STRING' }, html: { type: 'STRING' } },
  required: ['titulo', 'html'],
};

function promptLivreCliente(tema, ano) {
  return [
    'Você é uma desenvolvedora web experiente e uma professora. Crie um APLICATIVO WEB COMPLETO, funcional e bem acabado, em português do Brasil, sobre o pedido abaixo.',
    `Pedido: "${tema}". ${ano ? 'Público: ' + ano + '.' : 'Público: adultos ou crianças, conforme o pedido.'}`,
    'Entregue um único arquivo HTML em "html", começando com <!doctype html>, com CSS e JavaScript embutidos. Sem nenhum recurso externo (sem CDN, imagens externas ou fontes externas).',
    'Siga a ideia e o pensamento de quem pediu, em todos os detalhes que ela descrever. Os itens abaixo são apenas um padrão mínimo de qualidade, não um modelo fixo: adapte ao que foi pedido e não force telas ou funções que não façam sentido para o tema.',
    'Padrão mínimo de qualidade:',
    '- Organização clara, com seções ou telas navegáveis quando o tema pedir.',
    '- Funcionalidade real: cadastro ou entrada de dados, cálculos ou lógica de acordo com o pedido, listas que podem ser adicionadas, editadas e removidas, e totais ou resumos.',
    '- Validação de campos, mensagens de erro e de sucesso, estados vazios com orientação e botão para reiniciar.',
    '- Dados salvos em localStorage dentro de try/catch, para o app continuar funcionando se o armazenamento estiver bloqueado.',
    '- Um botão para exportar ou imprimir o resultado (window.print com CSS de impressão).',
    '- Acessibilidade e celular: botões grandes, textos legíveis, layout responsivo, contraste bom, e um visual limpo e agradável.',
    '- Voz e som: um botão 🔊 que lê em voz alta (speechSynthesis, lang pt-BR) os textos principais, e sons simples de sucesso e erro (Web Audio API). Não use alert().',
    'Conteúdo: adapte o app ao pedido com exemplos reais e úteis. Se o pedido for educativo, use linguagem adequada ao público e atividades que realmente ensinem. Não invente dados científicos, números oficiais ou fatos incertos; em exemplos numéricos ou financeiros, use valores ilustrativos e deixe isso claro no próprio app.',
    'Antes de responder, revise o código mentalmente: confira que o JavaScript não tem erros de sintaxe e que todos os botões têm uma função.',
    'Título curto em "titulo".',
  ].join(' ');
}

function conferirLivre(bruto) {
  const html = String(bruto?.html || '').trim();
  if (!/^<!doctype html|^<html/i.test(html) || html.length < 1500) {
    throw new Error('A IA não gerou o aplicativo completo. Tente de novo, com um tema um pouco mais específico.');
  }
  return { titulo: String(bruto.titulo || 'Aplicativo').trim(), html };
}

export async function gerarAppLivre({ chave, tema, ano }) {
  if (!tema || !tema.trim()) throw new Error('Digite o tema do aplicativo.');
  const temaFinal = tema.trim();
  if (chave && chave.trim()) {
    const bruto = await chamarGemini(chave, promptLivreCliente(temaFinal, ano), ESQUEMA_LIVRE_CLIENTE);
    return conferirLivre(bruto);
  }
  if (geracoesTesteRestantes() <= 0) {
    throw new Error('Você usou as ' + LIMITE_TESTE + ' gerações de teste. Cole sua chave em "Conectar IA" para continuar.');
  }
  const r = await fetch('/.netlify/functions/gerar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: 'livre', tema: temaFinal, ano }),
  });
  let dados = {};
  try { dados = await r.json(); } catch (e) { /* sem JSON */ }
  if (!r.ok) throw new Error(dados.erro || 'Não consegui gerar agora. Tente de novo.');
  let bruto;
  try { bruto = JSON.parse(dados.conteudo); } catch (e) { throw new Error('A resposta não veio no formato esperado. Tente de novo.'); }
  const resultado = conferirLivre(bruto);
  registrarGeracaoTeste();
  return resultado;
}
