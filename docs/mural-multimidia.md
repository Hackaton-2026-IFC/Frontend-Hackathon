# FEAT-61 — Mural de ideias multimídia

Esta branch nasce da **FEAT-60**, conforme combinado, e não modifica a master ou DEV do frontend.

Na rota `/notes`, o usuário pode criar e editar ideias contendo:
- Título e texto, tags, cor, projeto opcional e fixação (já existentes);
- Link HTTP(S) clicável e seguro (`target=_blank` com `rel=noopener noreferrer`);
- Foto JPG/PNG/WEBP/GIF (até 5 MB), com seleção, pré-visualização, remoção e substituição.

As ideias podem conter apenas foto, apenas link, apenas texto ou combinações. O mural mostra a imagem acima do texto e inclui os links na busca local.

## Integração backend
Requer backend **FEAT-72** (após merge em DEV/main e migração `0027_nota_multimidia`). Continua usando `/api/notas/`, no mesmo endpoint, com JSON sem fotos e `FormData` com foto no campo `imagem`. A API retorna `imagem_url`.

## Validação
Build `npm run build`, testes `npm test` conforme package.json e teste manual autenticado no servidor atualizado. Nunca mande `VITE_URL_BACKEND` com segredo. Não publicar essa branch diretamente na master sem resolver o estado divergente FEAT-60/DEV.
