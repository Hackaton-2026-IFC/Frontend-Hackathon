# Tela de tarefas — Momentum

- `/tasks`: todas as tarefas dos projetos acessíveis ao usuário, com filtro por projeto.
- `/projects/:projectId/tasks`: tarefas de um projeto específico.
- Acesso pelo item **Tarefas** no menu lateral, protegido pelo guard existente.

## Arquivos

- `src/views/TasksView.vue`: filtros, progresso e controle dos modais.
- `src/components/tasks/TaskBoard.vue`: três colunas e movimentação por arraste.
- `src/components/tasks/TaskCard.vue`: resumo e seletor de situação, também utilizável no celular/teclado.
- `src/components/tasks/TaskForm.vue`: criação e edição.
- `src/components/tasks/TaskDetails.vue`: detalhes, exclusão confirmada, checklist e links.
- `src/stores/taskStore.js`: estado, carregamento, erros e operações de tarefas, checklist e materiais.
- `src/api/taskApi.js`: contrato HTTP e funções auxiliares.
- `src/assets/css/tasks.css`: estilos compartilhados e responsividade.

## API e comportamento

Utiliza a instância Axios existente e `VITE_URL_BACKEND`. Todas as operações são persistidas pelo backend; não há dados fictícios nem gravação de tarefas no localStorage.

A listagem usa `tarefas/kanban/`, que já retorna todos os projetos autorizados. Projetos são carregados com a paginação `page`/`total_pages` do backend. Os filtros são aplicados sobre todas as tarefas retornadas. O progresso considera o projeto selecionado (ou todos os projetos), sem ser alterado por busca, prioridade ou responsável.

Criação/edição usam os campos reais `projeto`, `titulo`, `descricao`, `prioridade`, `status`, `responsavel`, `data_limite`. As prioridades são muito baixa, baixa, neutra, alta e muito alta; `planejado` é apresentado como “A fazer”. A edição preserva os campos avançados não expostos no formulário através de PATCH.

Microtarefas seguem a ordem e as dependências validadas pelo servidor. Depois de alterá-las, o frontend relê a tarefa, pois o servidor pode recalcular sua situação. Links são carregados e criados em `tarefas/:id/recursos/` exclusivamente por ações da store; nenhum componente ou view faz requisições HTTP. URLs exibidas são limitadas a HTTP/HTTPS.

## Pendências do backend

Na revisão `f2c32006c49f3713a5414903b9754708fe9b8e2b`, não há endpoint de comentários nem campo de data de conclusão. Esses recursos não foram simulados. A integração deles depende de ampliar o backend. A autenticação e as permissões são as existentes no projeto.

## Validação

```bash
npm ci
node --test tests/tasks.test.mjs
npm run build
```

Os testes usam respostas HTTP simuladas para verificar paginação, CRUD, erros de validação, recálculo após checklist, carregamento e criação de materiais pela store, prazos e links seguros. Não substituem testes com backend autenticado.

Roteiro manual: entrar em `/tasks`, criar tarefa em um projeto, abrir detalhes, editar, movimentar com seletor ou arraste, concluir etapas em ordem, adicionar link e excluir com confirmação. Conferir filtros combinados e layout no celular. O build apresenta avisos existentes sobre Tailwind e `:deep` no CSS global/home; esses estilos não foram alterados nesta funcionalidade.
