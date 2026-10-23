import { ref } from 'vue'
import { defineStore } from 'pinia'
import projectApi from '@/api/projectApi'

// Seus componentes usam status em inglês.
// O backend recebe e retorna status em português.
const statusParaBackend = {
  planned: 'planejado',
  in_progress: 'em_andamento',
  completed: 'concluido',
}

const statusParaFrontend = {
  planejado: 'planned',
  em_andamento: 'in_progress',
  concluido: 'completed',
}

// Converte a resposta da API para o formato das telas.
function adaptarProjeto(dados) {
  const participantes = Array.isArray(dados.participantes)
    ? dados.participantes
    : []

  const cargos = {
    owner: 'Proprietário',
    admin: 'Administrador',
    member: 'Membro',
  }

  return {
    ...dados,
    name: dados.nome,
    description: dados.descricao || '',
    status: statusParaFrontend[dados.status] || dados.status,
    created_at: dados.data_criacao,

    members: participantes.map((membro) => {
      const usuario = membro.usuario_detalhes || {}

      return {
        id: membro.id,
        name: usuario.name || usuario.username || 'Membro',
        role: cargos[membro.cargo] || membro.cargo,
      }
    }),
  }
}

// Converte os campos do formulário para os nomes do backend.
function prepararDados(dados) {
  const nome = String(dados.name ?? '').trim()
  const status = statusParaBackend[dados.status || 'planned']

  if (!nome) {
    throw new Error('Informe o nome do projeto.')
  }

  if (nome.length > 100) {
    throw new Error('O nome deve ter no máximo 100 caracteres.')
  }

  if (!status) {
    throw new Error('Selecione um status válido.')
  }

  return {
    nome,
    descricao: String(dados.description ?? '').trim(),
    status,
  }
}

// Obtém a mensagem enviada pelo backend.
function obterMensagemErro(erro) {
  const dados = erro.response?.data

  if (typeof dados?.detail === 'string') {
    return dados.detail
  }

  if (dados && typeof dados === 'object') {
    const campos = {
      nome: 'Nome',
      descricao: 'Descrição',
      status: 'Status',
      non_field_errors: 'Erro',
    }

    const mensagens = Object.entries(dados).flatMap(
      ([campo, valor]) => {
        const lista = Array.isArray(valor) ? valor : [valor]

        return lista
          .filter((mensagem) => typeof mensagem === 'string')
          .map((mensagem) => {
            return `${campos[campo] || campo}: ${mensagem}`
          })
      },
    )

    if (mensagens.length) {
      return mensagens.join(' ')
    }
  }

  if (erro.request && !erro.response) {
    return 'Não foi possível acessar o servidor. Confira sua conexão e a configuração da API.'
  }

  return erro.message || 'Não foi possível concluir a operação.'
}

export const useProjectStore = defineStore('projects', () => {
  const projects = ref([])
  const currentProject = ref(null)
  const loading = ref(false)
  const errorMessage = ref('')

  // Centraliza o tratamento dos erros.
  async function executar(operacao) {
    errorMessage.value = ''

    try {
      return await operacao()
    } catch (erro) {
      errorMessage.value = obterMensagemErro(erro)

      // As views recebem o erro e mantêm o modal aberto.
      throw new Error(errorMessage.value)
    }
  }

  // Lista os projetos do usuário autenticado.
  async function fetchProjects() {
    loading.value = true
    projects.value = []

    try {
      return await executar(async () => {
        const encontrados = []
        let pagina = 1

        // O backend pode responder com array simples ou lista paginada.
        while (true) {
          const { data } = await projectApi.listar({ page: pagina })

          if (Array.isArray(data)) {
            encontrados.push(...data)
            break
          }

          encontrados.push(...(Array.isArray(data?.results) ? data.results : []))

          if (data?.total_pages != null ? pagina >= data.total_pages : !data?.next) break
          pagina += 1
        }

        projects.value = encontrados.map(adaptarProjeto)

        return projects.value
      })
    } finally {
      loading.value = false
    }
  }

  // Carrega os detalhes de um projeto.
  async function fetchProject(id) {
    loading.value = true
    currentProject.value = null

    try {
      return await executar(async () => {
        let resposta

        try {
          resposta = await projectApi.buscar(id)
        } catch (erro) {
          if (erro.response?.status === 404) {
            return null
          }

          throw erro
        }

        currentProject.value = adaptarProjeto(resposta.data)

        return currentProject.value
      })
    } finally {
      loading.value = false
    }
  }

  // Cria o projeto no backend.
  async function createProject(dados) {
    return executar(async () => {
      const payload = prepararDados(dados)

      const { data } = await projectApi.criar(payload)

      const projetoCriado = adaptarProjeto(data)

      projects.value = [projetoCriado, ...projects.value]

      return projetoCriado
    })
  }

  // Atualiza o projeto no backend.
  async function updateProject(id, dados) {
    return executar(async () => {
      const payload = prepararDados(dados)

      const { data } = await projectApi.atualizar(id, payload)

      const projetoAtualizado = adaptarProjeto(data)

      projects.value = projects.value.map((projeto) => {
        return String(projeto.id) === String(id)
          ? projetoAtualizado
          : projeto
      })

      if (
        currentProject.value &&
        String(currentProject.value.id) === String(id)
      ) {
        currentProject.value = projetoAtualizado
      }

      return projetoAtualizado
    })
  }

  // Exclui no backend e depois atualiza a lista.
  async function deleteProject(id) {
    return executar(async () => {
      await projectApi.excluir(id)

      projects.value = projects.value.filter((projeto) => {
        return String(projeto.id) !== String(id)
      })

      if (
        currentProject.value &&
        String(currentProject.value.id) === String(id)
      ) {
        currentProject.value = null
      }
    })
  }

  return {
    projects,
    currentProject,
    loading,
    errorMessage,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
  }
})
