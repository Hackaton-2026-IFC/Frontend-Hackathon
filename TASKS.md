# Página de tarefas e roadmap — FEAT-9

A implementação atual mantém a interface de **criar/editar** em
`src/components/tasks/TaskForm.vue` como modal nativo. A regra de
prioridade automática em `src/utils/taskPresentation.js` foi preservada.

## Organização do frontend

- `src/views/TasksView.vue`: página principal, lista pesquisável e filtros por projeto, atraso, pendências e concluídas. Mantém seleção da tarefa em `?task=ID`, com layout mobile first.
- `src/components/tasks/TaskWorkspace.vue`: painel detalhado da tarefa selecionada. Mostra descrição, responsável principal e adicionais, status, prioridade, prazos, data de criação, conclusão (se disponível), criador, dependências, planejamento climático e materiais de apoio. Oferece editar e exclusão com confirmação.
- `src/components/tasks/TaskRoadmap.vue`: roadmap vertical das microtarefas, barra de progresso e inclusão/conclusão sequencial.
- `src/utils/taskRoadmap.js`: ordenação, progresso e regras de habilitação das etapas. O backend continua sendo a fonte de verdade e valida os pré-requisitos.
- `src/stores/taskStore.js` e `src/api/taskApi.js`: chamadas à API continuam fora de views e componentes de apresentação.
- `src/assets/css/tasks.css`: estilos da tela e dos modais.

## Sobre os dados

- Os passos do roadmap usam os campos `microtarefas` e `ordem` fornecidos pela API. Não são apenas um desenho: adicionar e marcar etapa altera o servidor pela store.
- A API aceita somente um `responsavel` por tarefa. Fotos dos participantes são obtidas do projeto. Seleções adicionais salvas no navegador são exibidas na página, identificadas como locais, sem sincronização com o resto da equipe.
- A prioridade visual segue o prazo e não altera o campo manual legado.
- A data de conclusão não é inferida. Se a API não fornece `data_conclusao`, a interface mostra **Data não registrada**.
- Links de apoio são listados e adicionados pelos endpoints já existentes. Apenas links HTTP ou HTTPS podem ser abertos.
- Nenhuma alteração é necessária ou realizada no repositório do backend.

## Validação

Executar `node --test tests/task-roadmap.test.mjs tests/task-presentation.test.mjs tests/tasks.test.mjs`
e `npm run build` no repositório local.

## Rotas após a integração da DEV

- `/tasks/:id` (rota `task-view`, usada pelos cards dentro dos projetos) renderiza **a mesma** `TasksView.vue` que contém o painel com roadmap. O parâmetro `id` seleciona a tarefa correta, e a troca de seleção atualiza o endereço sem perder o link direto.
- `/tasks` e `/projects/:projectId/tasks` continuam disponíveis, mas o item `Tarefas` foi removido da sidebar. O acesso permanece pelos projetos e seus cards.
- A antiga `src/views/TaskView.vue` foi removida. O módulo `src/api/tasksApi.js` foi mantido porque a página de projetos ainda o utiliza.
- Nada foi alterado no backend, e a DEV não é modificada por esta mudança.


## FEAT-17 — experiência mobile first

- Em celulares e tablets estreitos (abaixo de 980px), a página abre com **lista em cards** inspirados na seção de tarefas dos projetos: título, prioridade, status, prazo e progresso das etapas.
- Ao tocar num card, a URL recebe `?task=ID` (ou preserva `/tasks/:id`) e a mesma página passa a mostrar apenas os detalhes completos e o roadmap, com botão **Voltar às tarefas**.
- O link direto `/tasks/:id`, usado pelos cards dos projetos, abre o detalhe da tarefa certa mesmo no celular.
- Em telas maiores, lista e detalhes aparecem lado a lado, mantendo a experiência anterior.
- Os filtros, cards e formulários são responsivos desde telas pequenas; o conteúdo reserva espaço para a navegação inferior do app no celular.
- Modal de criar/editar, prioridade dinâmica, checklist sequencial e fotos de responsáveis permanecem iguais. O backend não é alterado.


## FEAT-17 — lista e detalhes empilhados no desktop + comentários

- No desktop (a partir de 980px), **Tarefas** fica no painel superior, com os cards organizados em duas colunas (três nas telas maiores), e o painel completo da tarefa selecionada fica abaixo. A lista não tem rolagem interna.
- No celular, continua o fluxo lista → detalhes, para não sobrepor painéis.
- A área de ações da tarefa inclui **Comentários**, que abre `TaskCommentsModal.vue`.
- O modal carrega comentários pela API existente, permite publicar, editar e excluir os próprios comentários, pagina os resultados e mostra erros sem perder o texto digitado.
- As requisições ficam em `src/api/taskApi.js`, coordenadas pela `src/stores/taskStore.js`. Os endpoints existentes são `GET/POST /api/tarefas/:id/comentarios/` e `PATCH/DELETE /api/tarefas/:id/comentarios/:comentarioId/`.
- Nenhum arquivo do backend foi alterado.
