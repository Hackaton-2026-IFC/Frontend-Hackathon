# Conectar Momentum frontend ao backend atualizado

O frontend usa `VITE_URL_BACKEND`, ou, quando a variável não existe, a URL pública padrão do Fabroku. Se o servidor publicado não estiver na branch DEV atualizada, páginas novas como /notes receberão 404.

## Testar com Django local

No Backend-Hackathon:

```bash
git switch DEV
git pull origin DEV
pdm install
pdm run python manage.py migrate
pdm run python manage.py runserver
```

No Frontend-Hackathon, crie um arquivo `.env.local` (não envie ao Git):

```dotenv
VITE_URL_BACKEND=http://127.0.0.1:8000/api/
```

Reinicie o Vite (`npm run dev`). Confira se o backend responde à rota `/api/notas/`: sem autenticação a resposta esperada é 401/403, **não 404**. Faça login e tente criar uma nota.

Se for usar o Fabroku no frontend, é necessário atualizar **a implantação do backend no Fabroku** para conter FEAT-55 e as migrações de notas. Mudar apenas a branch no GitHub não atualiza necessariamente o deployment.

> Cuidado: tokens e dados de um servidor diferente podem exigir novo login. Não coloque segredos no arquivo Vite.
