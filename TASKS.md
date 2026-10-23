# Tarefas — cards, atrasos e formulário em modal

## Tela

- `/tasks`: exibe as tarefas acessíveis, com separação entre **Tarefas atrasadas** e **Demais tarefas**.
- `/projects/:projectId/tasks`: exibe somente as tarefas do projeto informado.
- Cada card mostra título, responsável, prioridade automática, prazo ou data de conclusão e botão **Editar**.
- **+ Nova tarefa** abre o mesmo formulário em modo criação. **Editar** no card abre em modo edição.
- O formulário é um diálogo acessível com `<dialog>`, com fechamento pelo X, por **Cancelar** ou **Esc**, sem fechar enquanto uma operação está em andamento.
- O formulário de tarefas mantém os campos projeto, título, responsável, prazo, descrição e situação; a prioridade é informativa e calculada automaticamente.

## Regra automática

A prioridade *mostrada na interface* segue a mesma escala de urgência temporal do backend:

| Prazo restante | Prioridade |
| --- | --- |
| Vencido ou vence hoje | Muito alta |
| 1–2 dias | Alta |
| 3–7 dias | Neutra |
| 8–14 dias | Baixa |
| 15+ dias | Muito baixa |
| Sem prazo | Neutra |
| Concluída | Sem urgência |

O cálculo considera o prazo antecipado quando presente. A prioridade visual é dinâmica; o campo legado `prioridade` do backend não é sobrescrito. A interface não mostra um seletor de prioridade manual. O backend também fornece `urgencia` com a mesma escala. Novas solicitações passam somente pela `taskStore.js` / `taskApi.js`.

## Conclusão

A data `data_conclusao` precisa vir da API do backend com a migração aplicada; não é estimada pelo frontend. Tarefas antigas sem essa data exibem **Data não registrada**.
