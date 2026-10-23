# Tarefas — formulário em página

A rota `/tasks` apresenta somente o formulário de criação/edição de tarefa e um seletor para escolher qual tarefa editar.

A rota `/projects/:projectId/tasks` usa o mesmo formulário, com o projeto definido a partir da URL.

O componente `src/components/tasks/TaskForm.vue` contém os campos de projeto, título, responsável, prioridade, prazo, descrição e situação. O componente não é modal.

A tela `src/views/TasksView.vue` carrega os dados pela `taskStore.js`, mantém a seleção para edição e mostra o retorno das operações. A `taskStore.js` é responsável pelas requisições, através do `taskApi.js`.

O Kanban, cards, filtros e modal de detalhes foram retirados da interface. As tarefas registradas no servidor **não são excluídas**.
