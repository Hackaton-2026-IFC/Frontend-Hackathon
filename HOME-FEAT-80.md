# FEAT-80 — Home inteligente (base DEV)

Branch criada a partir de `DEV` em `ab93a836946d95ee6c78ba62bc0e0a93c4c9783f`. Nenhum merge ou PR.

## Funcionalidades

1. **Principais tarefas:** a Home consulta `GET /api/tarefas/kanban/`, ignora as concluídas e seleciona as quatro de maior urgência, dando prioridade para tarefas atrasadas e com vencimento próximo. Usa `urgencia`, `prioridade` e os campos calculados pelo backend. Cada tarefa abre a tela de detalhes que já existia na DEV.
2. **Meu dia inteligente:** consulta `GET /api/meu-dia/?limite=6`, usa diretamente as recomendações ordenadas, pontuações, justificativas e bloqueios produzidos pelo backend (FEAT-67). Sem duplicar o algoritmo na view.
3. **Mural do projeto mais movimentado:** consulta `GET /api/projetos/meus-projetos/` via store já existente, e a última entrada de `GET /api/projetos/{id}/atividades/?page_size=1` para identificar o projeto com a movimentação mais recente. Exibe prévia de até três notas não arquivadas, usando `GET /api/notas/?projeto={id}&arquivada=false`, e inclui acesso a `/projects/{id}/mural` com mural completo.
4. **Notas pessoais:** `/notes` também foi habilitado. A `NotesView.vue` existente na FEAT-78 foi aproveitada, junto às funções `pinForMe` e `saveOrder`, porque a DEV ainda não tinha a view/rotas. O código base de autenticação e inicialização da DEV foi preservado.

## Limitações conhecidas

- **Última modificação de projeto:** o modelo `Projeto` do backend não possui `atualizada_em`. A referência usada é a **última atividade registrada no projeto**, que é principalmente relacionada às tarefas. Modificar somente informações gerais do projeto ou um card do mural pode não gerar atividade. Quando não há registros, a Home usa a data de criação; se o histórico falhar para algum projeto, avisa que a comparação é incompleta.
- O mural é uma implementação **inspirada no Google Keep**, com notas do próprio backend. **Não** acessa o serviço externo Google Keep ou a conta Google do usuário.
- O endpoint `/api/meu-dia/` traz por padrão tarefas atribuídas ao usuário ou sem responsável. A listagem das tarefas principais usa as tarefas acessíveis ao usuário, sem exigir atribuição pessoal.
- As três seções têm loading/erro isolados; falhas no mural ou na recomendação não impedem o resto da Home.
- Requisições HTTP são feitas pela API e coordenadas pela `homeStore.js`, sem chamadas à rede diretamente na view. As leituras das atividades têm concorrência limitada a 4 requisições.

## Teste

```bash
git fetch origin
git switch FEAT-80
git pull origin FEAT-80
npm install
npm run dev
```

Abra `/home`, teste as tarefas urgentes e sugestões, e clique em **Abrir mural**. Rode `node --test tests/home-presentation.test.mjs` para verificar a ordenação, os prazos e a seleção de projeto.
