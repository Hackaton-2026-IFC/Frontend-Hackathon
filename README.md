# Frontend Hackathon 2026

Frontend da maratona de programação (Hackathon) do Instituto Federal Catarinense - Campus Araquari, englobando os alunos do 3° ano do curso Técnico em Informática para Internet integrado ao ensino médio.

## Stack Tecnológica

* **Framework Frontend:** Vue.js (v3)
* **Roteamento:** Vue Router
* **Gerenciamento de Estado:** Pinia
* **Requisições HTTP:** Axios
* **Suporte PWA:** Vite PWA / Service Workers
* **Deploy:** Vercel

## Arquitetura do Projeto

O projeto adota uma **arquitetura em camadas simples e modularizada**, separando responsabilidades de UI (Views e Componentes), Regra de Negócio/Estado (Pinia), Comunicação com API (Axios) e Recursos Estáticos.

```text
Frontend-Hackathon/
├── .vscode/                 # Configurações do ambiente de desenvolvimento (VS Code)
├── dev-dist/                # Arquivos de saída/build temporários de PWA em desenvolvimento
├── public/                  # Arquivos estáticos servidos diretamente
│   ├── icons/               # Ícones do aplicativo e PWA
│   ├── images/
│   │   └── logo/            # Logotipos da aplicação
│   └── favicon.ico          # Ícone da aba do navegador
├── src/                     # Código-fonte principal da aplicação
│   ├── api/                 # Configurações e chamadas HTTP com Axios
│   ├── assets/
│   │   └── css/             # Arquivos de estilização global e temas CSS
│   ├── components/          # Componentes reutilizáveis da interface
│   ├── router/              # Configurações de rotas com Vue Router
│   ├── stores/              # Gerenciamento de estado global com Pinia
│   ├── views/               # Páginas principais/telas da aplicação
│   ├── App.vue              # Componente raiz da aplicação
│   └── main.js              # Ponto de entrada JavaScript
├── .editorconfig            # Padronização de formatação do editor
├── .env.example             # Exemplo de variáveis de ambiente
├── .gitattributes           # Configurações de atributos do Git
├── .gitignore               # Arquivos e pastas ignorados pelo Git
├── .oxlintrc.json           # Configurações de linter (Oxlint)
├── .prettierrc.json         # Configurações de formatação (Prettier)
├── eslint.config.js         # Configurações de linting (ESLint)
├── index.html               # Documento HTML principal
├── jsconfig.json            # Configurações de caminhos/autocompletion JS
├── package.json             # Dependências e scripts do projeto
├── package-lock.json        # Trava de versões das dependências
├── vercel.json              # Configurações de deploy na Vercel
└── vite.config.js           # Configurações do Vite e plugins (PWA, etc.)
```

## 📂 Descrição Detalhada das Camadas (`src/`)

1. **`api/`** (Camada de Integração):
   * Concentra as configurações do Axios e as funções responsáveis por consumir a API backend.
2. **`assets/css/`** (Camada de Estilo):
   * Armazena estilos globais, variáveis CSS e resets de layout.
3. **`components/`** (Camada de Componentes):
   * Guarda componentes reutilizáveis (botões, cards, formulários de login/cadastro, modais, etc.).
4. **`router/`** (Camada de Roteamento):
   * Define as rotas do app, controle de acesso e navegação entre as views.
5. **`stores/`** (Camada de Estado):
   * Concentra as stores do Pinia para gerenciamento centralizado do estado da aplicação (autenticação, dados do usuário, dados do hackathon).
6. **`views/`** (Camada de Páginas):
   * Telas completas da aplicação renderizadas pelo Vue Router (Home, Login, Cadastro, 404 Not Found, etc.).

---

## 🚀 Como Rodar o Projeto Localmente

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento do Frontend do Hackathon:

### Pré-requisitos
Certifique-se de ter instalado em sua máquina:
* **Node.js** (versão 18 ou superior recomendada)
* **Git** instalado e configurado

---

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Hackaton-2026-IFC/Frontend-Hackathon.git
   ```

2. **Entre na pasta do projeto**
   ```bash
   cd Frontend-Hackathon
   ```

3. **Instale as dependências**
   ```bash
   npm install
   ```

4. **Configure as variáveis de ambiente**
   Duplique o arquivo de exemplo `.env.example` e renomeie-o para `.env` (ou `.env.local`):
   ```bash
   cp .env.example .env
   ```
   *Abra o arquivo `.env` gerado e preencha as variáveis conforme necessário (como a URL base da API do backend).*

5. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

6. **Acesse no navegador**
   O terminal exibirá um endereço local (geralmente `http://localhost:5173`). Abra o endereço no navegador para visualizar a aplicação.

---

### 🛠️ Scripts Úteis (`package.json`)
* `npm run dev`: Inicia o servidor local de desenvolvimento.
* `npm run build`: Gera os arquivos otimizados de produção na pasta de build.
* `npm run preview`: Permite visualizar localmente o build de produção.
