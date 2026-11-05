/* Função de servidor: gera o conteúdo com a chave da Fabi (variável GEMINI_API_KEY no Netlify).
   A chave nunca aparece no painel nem no código. Usada só nas gerações de teste da aluna. */

const MODELO = 'gemini-3.8-flash';
const LIMITE_DIARIO_GLOBAL = Number(process.env.LIMITE_DIARIO || 300);

let contagem = { dia: '', total: 0 }; // zera quando a função "acorda" de novo (limite de segurança extra)

const TIPOS_VALIDOS = ['quiz', 'relacionar', 'memoria', 'encaixe', 'ordenar', 'rotina', 'colorir', 'receita', 'vendas'];

const ESQUEMA_VENDAS = {
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
const NOMES = {
  quiz: 'Quiz', relacionar: 'Relacionar pares', memoria: 'Jogo da memória', encaixe: 'Encaixe',
  ordenar: 'Montar frase', rotina: 'Rotina visual', colorir: 'Pintar por número', receita: 'Receita',
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
const ESQUEMA_QUIZ = {
  type: 'OBJECT',
  properties: {
    titulo: { type: 'STRING' },
    instrucao: { type: 'STRING' },
    itens: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      pergunta: { type: 'STRING' },
      opcoes: { type: 'ARRAY', items: { type: 'STRING' } },
      correta: { type: 'INTEGER' },
    }, required: ['pergunta', 'opcoes', 'correta'] } },
  },
  required: ['titulo', 'instrucao', 'itens'],
};
const ESQUEMA_PARES = {
  type: 'OBJECT',
  properties: {
    titulo: { type: 'STRING' },
    instrucao: { type: 'STRING' },
    itens: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      esquerda: { type: 'STRING' },
      direita: { type: 'STRING' },
    }, required: ['esquerda', 'direita'] } },
  },
  required: ['titulo', 'instrucao', 'itens'],
};

function resposta(status, corpo) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify(corpo),
  };
}

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

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return resposta(405, { erro: 'Use POST.' });
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) return resposta(500, { erro: 'Servidor sem chave configurada.' });

  let dados;
  try { dados = JSON.parse(event.body || '{}'); } catch (e) { return resposta(400, { erro: 'Pedido inválido.' }); }
  const tipo = TIPOS_VALIDOS.includes(dados.tipo) ? dados.tipo : null;
  const tema = String(dados.tema || '').trim().slice(0, 120);
  const ano = String(dados.ano || '').slice(0, 40);
  const quantidade = Math.min(15, Math.max(3, Number(dados.quantidade) || 8));
  const resumo = String(dados.resumo || '').trim().slice(0, 300);
  if (!tipo || !tema) return resposta(400, { erro: 'Informe o tipo e o tema.' });

  const hoje = new Date().toISOString().slice(0, 10);
  // (contagem diária abaixo vale para todas as gerações)
  if (contagem.dia !== hoje) contagem = { dia: hoje, total: 0 };
  if (contagem.total >= LIMITE_DIARIO_GLOBAL) {
    return resposta(429, { erro: 'O teste gratuito atingiu o limite de hoje. Cole sua chave em "Conectar IA" para continuar.' });
  }

  const esquema = tipo === 'vendas' ? ESQUEMA_VENDAS : tipo === 'quiz' ? ESQUEMA_QUIZ : ESQUEMA_PARES;
  const texto_prompt = tipo === 'vendas' ? promptVendas(tema, resumo || 'material pedagógico') : montarPrompt(tipo, tema, ano, quantidade);
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
    body: JSON.stringify({
      contents: [{ parts: [{ text: texto_prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: esquema, maxOutputTokens: 8192 },
    }),
  });
  contagem.total += 1;
  let corpo = {};
  try { corpo = await r.json(); } catch (e) { /* sem JSON */ }
  if (r.status === 429) return resposta(429, { erro: 'Limite de uso atingido. Tente de novo em instantes.' });
  if (!r.ok) return resposta(502, { erro: 'A IA não respondeu. Tente de novo.' });
  const texto = corpo?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) return resposta(502, { erro: 'A IA respondeu sem conteúdo. Tente de novo.' });
  return resposta(200, { conteudo: texto });
};
