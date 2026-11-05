/* Teste de conexão com a chave da própria aluna.
   A chave vai direto do navegador dela para o Google.
   Nada passa por servidor nosso. */
const MODELO = 'gemini-2.5-flash';

export async function testarChave(chave) {
  const resposta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': chave.trim(),
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Responda apenas com a palavra: ok' }] }],
      }),
    }
  );
  let dados = {};
  try {
    dados = await resposta.json();
  } catch (e) { /* resposta sem JSON */ }
  if (!resposta.ok) {
    const msg = dados?.error?.message || 'Erro ' + resposta.status;
    throw new Error(msg);
  }
  return dados?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Conectou, mas a resposta veio vazia.';
}
