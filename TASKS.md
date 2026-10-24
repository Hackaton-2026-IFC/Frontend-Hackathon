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
