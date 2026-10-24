import { ref } from 'vue'
import { defineStore } from 'pinia'
import projectApi from '@/api/projectApi'

// ==========================================
// CONVERSÃO DE STATUS
// ==========================================

// Frontend → Backend
const statusParaBackend = {
  planned: 'planejado',
  in_progress: 'em_andamento',
  completed: 'concluido',
}

// Backend → Frontend
const statusParaFrontend = {
  planejado: 'planned',
  em_andamento: 'in_progress',
  concluido: 'completed',
}

// ==========================================
// ADAPTAR DADOS DO BACKEND
// ==========================================

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

    // Campos utilizados pelo frontend
    name: dados.nome,
    description: dados.descricao || '',
    status: statusParaFrontend[dados.status] || dados.status,
    created_at: dados.data_criacao,

    // Personalização do projeto
    icone: dados.icone ?? '',
    cor: dados.cor ?? '',

    // Data de prazo
    data_limite: dados.data_limite ?? null,

    // Participantes
    members: participantes.map((membro) => {
      const usuario = membro.usuario_detalhes || {}

      return {
        id: membro.id,
        name:
          usuario.name ||
          usuario.username ||
          'Membro',
        role: cargos[membro.cargo] || membro.cargo,
      }
    }),
  }
}

// ==========================================
// PREPARAR DADOS PARA O BACKEND
// ==========================================

function prepararDados(dados) {
  const nome = String(dados.name ?? '').trim()

  const status =
    statusParaBackend[dados.status || 'planned']

  if (!nome) {
    throw new Error('Informe o nome do projeto.')
  }

  if (nome.length > 100) {
    throw new Error(
      'O nome deve ter no máximo 100 caracteres.',
    )
  }

  if (!status) {
    throw new Error('Selecione um status válido.')
  }

  return {
    nome,

    descricao: String(
      dados.description ?? '',
    ).trim(),

    status,

    // Ícone MDI selecionado no formulário
    icone: dados.icone ?? '',

    // Cor personalizada
    ...(dados.cor !== undefined
      ? { cor: dados.cor }
      : {}),

    // Data de prazo
    ...(dados.data_limite !== undefined
      ? {
          data_limite: dados.data_limite || null,
        }
      : {}),
  }
}

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

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

    const mensagens = Object.entries(dados).flatMap(
      ([campo, valor]) => {
        const lista = Array.isArray(valor)
          ? valor
          : [valor]

        return lista
          .filter(
            (mensagem) =>
              typeof mensagem === 'string',
          )
          .map((mensagem) => {
            return `${
              campos[campo] || campo
            }: ${mensagem}`
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

  return (
    erro.message ||
    'Não foi possível concluir a operação.'
  )
}

// ==========================================
// STORE DE PROJETOS
// ==========================================

export const useProjectStore = defineStore(
  'projects',
  () => {
    // ==========================================
    // ESTADOS
    // ==========================================

    const projects = ref([])
    const currentProject = ref(null)
    const loading = ref(false)
    const errorMessage = ref('')

    // ==========================================
    // EXECUTAR REQUISIÇÕES
    // ==========================================

    async function executar(operacao) {
      errorMessage.value = ''

      try {
        return await operacao()
      } catch (erro) {
        errorMessage.value =
          obterMensagemErro(erro)

        throw new Error(errorMessage.value, {
          cause: erro,
        })
      }
    }

    // ==========================================
    // LISTAR PROJETOS
    // ==========================================

    async function fetchProjects() {
      loading.value = true
      projects.value = []

      try {
        return await executar(async () => {
          const { data } =
            await projectApi.listar()
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

          const lista = Array.isArray(data)
            ? data
            : (data.results ?? [])

          projects.value =
            lista.map(adaptarProjeto)

          return projects.value
        })
      } finally {
        loading.value = false
      }
    }

    // ==========================================
    // BUSCAR PROJETO
    // ==========================================

    async function fetchProject(id) {
      loading.value = true
      currentProject.value = null

      try {
        return await executar(async () => {
          let resposta

          try {
            resposta =
              await projectApi.buscar(id)
          } catch (erro) {
            if (
              erro.response?.status === 404
            ) {
              return null
            }

            throw erro
          }

          currentProject.value =
            adaptarProjeto(resposta.data)

          return currentProject.value
        })
      } finally {
        loading.value = false
      }
    }

    // ==========================================
    // CRIAR PROJETO
    // ==========================================

    async function createProject(dados) {
      return executar(async () => {
        const payload =
          prepararDados(dados)

        const { data } =
          await projectApi.criar(payload)

        const projetoCriado =
          adaptarProjeto(data)

        projects.value = [
          projetoCriado,
          ...projects.value,
        ]

        return projetoCriado
      })
    }

    // ==========================================
    // ATUALIZAR PROJETO
    // ==========================================

    async function updateProject(id, dados) {
      return executar(async () => {
        const payload =
          prepararDados(dados)

        const { data } =
          await projectApi.atualizar(
            id,
            payload,
          )

        const projetoAtualizado =
          adaptarProjeto(data)

        projects.value =
          projects.value.map((projeto) => {
            return (
              String(projeto.id) ===
              String(id)
            )
              ? projetoAtualizado
              : projeto
          })

        if (
          currentProject.value &&
          String(
            currentProject.value.id,
          ) === String(id)
        ) {
          currentProject.value =
            projetoAtualizado
        }

        return projetoAtualizado
      })
    }

    // ==========================================
    // EXCLUIR PROJETO
    // ==========================================

    async function deleteProject(id) {
      return executar(async () => {
        await projectApi.excluir(id)

        projects.value =
          projects.value.filter(
            (projeto) => {
              return (
                String(projeto.id) !==
                String(id)
              )
            },
          )

        if (
          currentProject.value &&
          String(
            currentProject.value.id,
          ) === String(id)
        ) {
          currentProject.value = null
        }
      })
    }

    // ==========================================
    // EXPORTAR STORE
    // ==========================================

    return {
      // Estados
      projects,
      currentProject,
      loading,
      errorMessage,

      // Métodos
      fetchProjects,
      fetchProject,
      createProject,
      updateProject,
      deleteProject,
    }
  },
)