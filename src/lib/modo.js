/* Versão para alunas: o painel é só um site estático (sem função de servidor).
   Quando VITE_SEM_SERVIDOR=true no build, o teste gratuito some e cada aluna usa a própria chave. */
export const SEM_SERVIDOR = import.meta.env.VITE_SEM_SERVIDOR === 'true';
