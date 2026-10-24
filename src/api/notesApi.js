import api from './config'

async function listAll(params = {}) {
  const items = []
  let page = 1

  while (true) {
    const { data } = await api.get('notas/', {
      params: { ...params, page, page_size: 100 },
    })

    if (Array.isArray(data)) {
      items.push(...data)
      break
    }

    items.push(...(Array.isArray(data?.results) ? data.results : []))

    if (data?.total_pages != null ? page >= data.total_pages : !data?.next) break
    page += 1
  }

  return items
}

const notesApi = {
  listAll,
  create: (payload) => api.post('notas/', payload),
  update: (id, payload) => api.patch(`notas/${encodeURIComponent(id)}/`, payload),
  remove: (id) => api.delete(`notas/${encodeURIComponent(id)}/`),
  pinForMe: (id, fixada) => api.patch(`notas/${encodeURIComponent(id)}/preferencia/`, { fixada }),
  saveOrder: (projectId, ids) => api.post('notas/ordenar/', { projeto: Number(projectId), ids }),
}

export default notesApi
