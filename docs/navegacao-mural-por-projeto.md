# FEAT-63 — Remover Notas pessoais da navegação principal

## Mudança visual
- A entrada **Notas** desaparece do menu lateral (desktop e mobile).
- A URL antiga `/notes` redireciona para `/projects`, sem erro 404.
- A rota `/projects/:id/mural` segue ativa e exibe o mural **compartilhado** de cada projeto, com título adequado no cabeçalho.
- **Nenhuma nota foi apagada**: o backend e os dados armazenados permanecem intactos.

## Sincronização com a equipe
`git fetch` atualiza as referências remotas, **não o conteúdo da branch local**. Para quem já usa FEAT-60:

```sh
git switch FEAT-60
git pull --ff-only origin FEAT-60
npm install
npm run dev
```

Quem tem alterações locais não commitadas deve fazer commit/stash antes do pull. Verificar `git rev-parse --short HEAD` e comparar com `git rev-parse --short origin/FEAT-60`. A confirmação da versão depende de os hashes serem iguais após o pull.

Se não atualizar o navegador, tentar recarregar sem cache e reiniciar o Vite; não eliminar os dados do usuário do navegador sem necessidade.
