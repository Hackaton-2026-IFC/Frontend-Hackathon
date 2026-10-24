const ACTION_LABELS = {
  tarefa_criada: 'criou a tarefa',
  tarefa_alterada: 'atualizou a tarefa',
  tarefa_excluida: 'excluiu a tarefa',
  comentario_criado: 'comentou na tarefa',
  comentario_editado: 'editou um comentário na tarefa',
  comentario_excluido: 'excluiu um comentário da tarefa',
}

const FIELD_LABELS = {
  titulo: 'Título',
  descricao: 'Descrição',
  status: 'Status',
  prioridade: 'Prioridade',
  responsavel_id: 'Responsável',
  data_limite: 'Prazo',
  prazo_antecipado: 'Prazo antecipado',
  urgencia_manual: 'Urgência',
  concluida: 'Conclusão',
  clima_influencia: 'Clima',
  localizacao: 'Localização',
  projeto_id: 'Projeto',
  dependencias: 'Dependências',
}

const FIELD_VALUES = {
  planejado: 'Planejada',
  em_andamento: 'Em andamento',
  concluido: 'Concluída',
  muito_baixa: 'Muito baixa',
  baixa: 'Baixa',
  neutra: 'Normal',
  alta: 'Alta',
  muito_alta: 'Muito alta',
}

export function activityAction(action) {
  return ACTION_LABELS[action] || 'registrou uma atividade em'
}

function readableValue(field, value) {
  if (value === null || value === undefined || value === '') return 'Não definido'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (field === 'data_limite' || field === 'prazo_antecipado') {
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
  }
  if (typeof value === 'number') return String(value)
  return FIELD_VALUES[value] || String(value)
}

export function activityChanges(event, limit = 3) {
  const changes = event?.alteracoes
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return []

  return Object.entries(changes)
    .filter(([field]) => FIELD_LABELS[field])
    .slice(0, limit)
    .map(([field, change]) => {
      const label = FIELD_LABELS[field]

      // Descrições e outros campos livres podem ser grandes ou conter dados
      // sensíveis. O feed registra que mudaram, sem copiar seu conteúdo.
      if (['descricao', 'localizacao', 'dependencias'].includes(field)) {
        return field === 'dependencias'
          ? 'Dependências atualizadas'
          : `${label} atualizada`
      }
      if (!change || typeof change !== 'object' || Array.isArray(change)) {
        return `${label} atualizado`
      }
      return `${label}: ${readableValue(field, change.antes)} → ${readableValue(field, change.depois)}`
    })
}

export function activityDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function activityTaskTitle(event) {
  return event?.tarefa_titulo?.trim()
    || (event?.tarefa_id_original != null ? `Tarefa #${event.tarefa_id_original}` : 'uma tarefa')
}
