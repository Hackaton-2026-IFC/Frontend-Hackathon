# FEAT-62 — Mural compartilhado por projeto

Esta branch nasceu de FEAT-60. A rota `/projects/:id/mural` exibe as ideias do projeto indicado, feitas por qualquer participante, utilizando `GET /api/notas/?projeto=:id&arquivada=false`.

O acesso está na tela de detalhes de cada projeto, através do botão **Mural de ideias**. Antes de exibir o formulário, o frontend consulta `GET /api/projetos/{id}/` para conferir autorização. A API de notas também faz o isolamento no servidor.

Cada membro pode publicar texto, link ou foto (formato multipart em upload), sem escolher outro projeto por engano. Cada cartão mostra o nome de quem publicou; opções de fixar, editar, arquivar e excluir só aparecem para o autor, e são validadas também pelo backend FEAT-73.

A rota `/notes` continua funcionando para notas do próprio usuário, inclusive aquelas que o próprio usuário publicou em projetos, sem misturar notas de colegas. Para ver todas as ideias da equipe, entre no mural pelo projeto.

A sincronização não é em tempo real: atualizar a página recupera novas publicações.

**Implantação:** exige FEAT-73 no backend em produção, além das migrações de foto da FEAT-72. A FEAT-73 não inclui nova migração.
