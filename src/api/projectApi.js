import api from './config'

const projectApi = {
  // Lista os projetos do usuário autenticado.
  listar() {
    return api.get('projetos/meus-projetos/')
  },

  // Busca os detalhes de um projeto.
  buscar(id) {
    return api.get(
      `projetos/${encodeURIComponent(id)}/`,
    )
  },

  // Cria um projeto no backend.
  criar(dados) {
    return api.post('projetos/', dados)
  },

  // Atualiza os campos enviados.
  atualizar(id, dados) {
    return api.patch(
      `projetos/${encodeURIComponent(id)}/`,
      dados,
    )
  },

  // Exclui um projeto.
  excluir(id) {
    return api.delete(
      `projetos/${encodeURIComponent(id)}/`,
    )
  },
}

export default projectApi
