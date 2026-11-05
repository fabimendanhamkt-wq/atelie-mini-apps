/* Guarda os apps criados neste navegador. Sempre com try/catch:
   se o navegador bloquear o armazenamento, o painel continua funcionando. */
const CHAVE_APPS = 'dashboard-apps:lista';
const CHAVE_IA = 'dashboard-apps:chave-ia';

export function carregarApps() {
  try {
    const bruto = window.localStorage.getItem(CHAVE_APPS);
    return bruto ? JSON.parse(bruto) : [];
  } catch (e) {
    return [];
  }
}

export function salvarApps(lista) {
  try {
    window.localStorage.setItem(CHAVE_APPS, JSON.stringify(lista));
    return true;
  } catch (e) {
    return false;
  }
}

export function carregarChaveSalva() {
  try {
    return window.localStorage.getItem(CHAVE_IA) || '';
  } catch (e) {
    return '';
  }
}

export function salvarChave(chave) {
  try {
    window.localStorage.setItem(CHAVE_IA, chave);
    return true;
  } catch (e) {
    return false;
  }
}

export function esquecerChave() {
  try {
    window.localStorage.removeItem(CHAVE_IA);
  } catch (e) { /* nada a fazer */ }
}

export function novoId() {
  return 'app-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

export function baixarArquivo(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function nomeArquivo(texto) {
  return (texto || 'mini-app')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mini-app';
}
