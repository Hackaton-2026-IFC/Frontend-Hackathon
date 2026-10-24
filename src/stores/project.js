import { ref } from 'vue'
import { defineStore } from 'pinia'
import projectApi from '@/api/projectApi'

const statusParaBackend = {
  planned: 'planejado',
  in_progress: 'em_andamento',
  completed: 'concluido',
  planejado: 'planejado',
  em_andamento: 'em_andamento',
  concluido: 'concluido',
}

const statusParaFrontend = {
  planejado: 'planned',
  em_andamento: 'in_progress',
  concluido: 'completed',
}

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
    icone: dados.icone ?? '',
    cor: dados.cor ?? '',
    data_limite: dados.data_limite ?? null,

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

  const payload = {
    nome,
    descricao: String(dados.description ?? '').trim(),
    status,
  }

  if (dados.icone !== undefined) {
    payload.icone = dados.icone
  }

  if (dados.cor !== undefined) {
    payload.cor = dados.cor
  }

  if (dados.data_limite !== undefined) {
    payload.data_limite = dados.data_limite || null
  }

  return payload
}

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
      icone: 'Ícone',
      cor: 'Cor',
      data_limite: 'Data de prazo',
      non_field_errors: 'Erro',
    }

    const mensagens = Object.entries(dados).flatMap(([campo, valor]) => {
      const lista = Array.isArray(valor) ? valor : [valor]

      return lista
        .filter((mensagem) => typeof mensagem === 'string')
        .map((mensagem) => `${campos[campo] || campo}: ${mensagem}`)
    })

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

  async function executar(operacao) {
    errorMessage.value = ''

    try {
      return await operacao()
    } catch (erro) {
      errorMessage.value = obterMensagemErro(erro)

      throw new Error(errorMessage.value, {
        cause: erro,
      })
    }
  }

  async function fetchProjects() {
    loading.value = true

    try {
      return await executar(async () => {
        const encontrados = []
        const idsEncontrados = new Set()
        let pagina = 1

        while (true) {
          const { data } = await projectApi.listar({
            page: pagina,
          })

          const lista = Array.isArray(data)
            ? data
            : data?.results

          if (!Array.isArray(lista)) {
            throw new Error(
              'O servidor retornou uma lista de projetos inválida.',
            )
          }

          let novosProjetos = 0

          for (const projeto of lista) {
            const id = String(projeto.id)

            if (!idsEncontrados.has(id)) {
              idsEncontrados.add(id)
              encontrados.push(projeto)
              novosProjetos += 1
            }
          }

          if (Array.isArray(data)) {
            break
          }

          const temProximaPagina =
            data.total_pages != null
              ? pagina < Number(data.total_pages)
              : Boolean(data.next)

          if (!temProximaPagina) {
            break
          }

          if (novosProjetos === 0) {
            throw new Error(
              'Não foi possível avançar na paginação dos projetos. Confira se projectApi.listar envia o parâmetro page.',
            )
          }

          pagina += 1
        }

        projects.value = encontrados.map(adaptarProjeto)

        return projects.value
      })
    } finally {
      loading.value = false
    }
  }

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

  async function createProject(dados) {
    return executar(async () => {
      const payload = prepararDados(dados)
      const { data } = await projectApi.criar(payload)
      const projetoCriado = adaptarProjeto(data)

      projects.value = [
        projetoCriado,
        ...projects.value,
      ]

      return projetoCriado
    })
  }

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
