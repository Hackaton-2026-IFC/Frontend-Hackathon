import { formatDeadline, isOverdue } from '@/api/taskApi'

/**
 * Automatic deadline-based priority, matching the backend urgency thresholds.
 * This is presentation-only: it does not overwrite the task's manually stored
 * priority, and completed tasks have no active urgency.
 */
export function automaticPriority(task, today = new Date()) {
  if (task.status === 'concluido' || task.concluida === true) return null

  const deadline = task.prazo_antecipado || task.prazo_efetivo || task.data_limite
  if (!deadline) return 'neutra'

  const match = String(deadline).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return 'neutra'

  const deadlineDay = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((deadlineDay - currentDay) / 86400000)

  if (days <= 0) return 'muito_alta'
  if (days <= 2) return 'alta'
  if (days <= 7) return 'neutra'
  if (days <= 14) return 'baixa'
  return 'muito_baixa'
}

export function taskIsOverdue(task) {
  // Use the backend's computed flag if available; its effective date may
  // differ from the official deadline when an early deadline is configured.
  return typeof task.atrasada === 'boolean' ? task.atrasada : isOverdue(task)
}

export function responsibleForTask(task, projects) {
  if (task.responsavel == null || task.responsavel === '') return 'Sem responsável'

  const project = projects.find((item) => String(item.id) === String(task.projeto))
  const member = project?.participantes?.find(
    (item) => String(item.usuario) === String(task.responsavel),
  )

  return (
    member?.usuario_detalhes?.name?.trim() ||
    member?.usuario_detalhes?.username ||
    'Responsável não identificado'
  )
}

export function taskCompletionDate(task) {
  if (task.status !== 'concluido') return null
  if (!task.data_conclusao) return 'Data não registrada'

  const date = new Date(task.data_conclusao)
  if (Number.isNaN(date.getTime())) return 'Data não registrada'
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function taskDueDate(task) {
  return formatDeadline(task.prazo_efetivo || task.data_limite)
}

export function assigneeDisplayName(member) {
  return member?.usuario_detalhes?.name?.trim() ||
    member?.usuario_detalhes?.username ||
    'Participante'
}

export function assigneePhotoUrl(member) {
  const url = member?.usuario_detalhes?.profile_image?.url
  return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null
}

export function assigneeMembers(task, projects, additionalAssigneesByTask = {}) {
  if (!task) return []
  const project = projects.find((item) => String(item.id) === String(task.projeto))
  const members = project?.participantes || []
  const idList = [
    task.responsavel,
    ...(additionalAssigneesByTask[String(task.id)] || []),
  ]
  return [...new Set(idList.filter((id) => id != null && id !== '').map(String))]
    .map((id) => members.find((member) => String(member.usuario) === id))
    .filter(Boolean)
}
