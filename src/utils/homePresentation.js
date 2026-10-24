const URGENCY_RANK = {
  muito_baixa: 0,
  baixa: 1,
  neutra: 2,
  alta: 3,
  muito_alta: 4,
}

export const URGENCY_LABELS = {
  muito_baixa: 'Muito baixa',
  baixa: 'Baixa',
  neutra: 'Normal',
  alta: 'Alta',
  muito_alta: 'Muito alta',
}

export function effectiveDeadline(task) {
  return task.prazo_efetivo || task.prazo_antecipado || task.data_limite || null
}

export function daysUntilDeadline(task, today = new Date()) {
  if (Number.isFinite(task.dias_para_prazo)) return task.dias_para_prazo
  const date = String(effectiveDeadline(task) || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!date) return null
  const dateUTC = Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3]))
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((dateUTC - todayUTC) / 86400000)
}

export function urgencyScore(task, today = new Date()) {
  const days = daysUntilDeadline(task, today)
  const urgency = URGENCY_RANK[task.urgencia] ?? URGENCY_RANK[task.prioridade] ?? 2
  const priority = URGENCY_RANK[task.prioridade] ?? 2
  const timeScore = days == null ? 0 : days < 0 ? 100 : days === 0 ? 80 : days <= 2 ? 50 : days <= 7 ? 20 : 0
  return timeScore + urgency * 10 + priority
}

export function topUrgentTasks(tasks, limit = 4, today = new Date()) {
  return (Array.isArray(tasks) ? tasks : [])
    .filter((task) => task && task.status !== 'concluido' && task.concluida !== true)
    .slice()
    .sort((a, b) =>
      urgencyScore(b, today) - urgencyScore(a, today)
      || String(effectiveDeadline(a) || '9999-12-31').localeCompare(String(effectiveDeadline(b) || '9999-12-31'))
      || Number(a.id) - Number(b.id),
    )
    .slice(0, Math.max(0, limit))
}

export function deadlineLabel(task, today = new Date()) {
  const days = daysUntilDeadline(task, today)
  if (days === null) return 'Sem prazo'
  if (days < 0) return `Atrasada há ${Math.abs(days)} dia${Math.abs(days) === 1 ? '' : 's'}`
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  return `Em ${days} dias`
}

// O projeto não possui updated_at. Usamos a atividade mais recente
// de tarefa, com data de criação como fallback explicitamente identificado.
export function lastActiveProject(projects, activityByProject = {}) {
  if (!Array.isArray(projects) || !projects.length) return null
  const sorted = projects.map((project) => {
    const activity = activityByProject[String(project.id)]
    const recordedAt = activity?.criado_em || null
    const creationDate = project.data_criacao || project.created_at || ''
    return {
      project,
      activity,
      lastActivityAt: recordedAt,
      rank: Date.parse(recordedAt || creationDate) || 0,
    }
  }).sort((a, b) => b.rank - a.rank || Number(b.project.id) - Number(a.project.id))
  return sorted[0]
}

export function newestNotes(notes, limit = 3) {
  return (Array.isArray(notes) ? notes : [])
    .filter((note) => !note.arquivada)
    .slice()
    .sort((a, b) =>
      (Date.parse(b.atualizada_em || b.criada_em || '') || 0) -
      (Date.parse(a.atualizada_em || a.criada_em || '') || 0),
    )
    .slice(0, Math.max(0, limit))
}
