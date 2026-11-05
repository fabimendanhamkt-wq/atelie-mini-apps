/* Cores usadas no "Colorir por número". Os nomes são os que a aluna digita. */
export const CORES = {
  vermelho: '#e53935',
  azul: '#1e88e5',
  amarelo: '#fdd835',
  verde: '#43a047',
  laranja: '#fb8c00',
  roxo: '#8e24aa',
  rosa: '#ec407a',
  marrom: '#6d4c41',
  preto: '#212121',
  cinza: '#9e9e9e',
};

export function nomeCorNormalizado(nome) {
  return String(nome || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim();
}
