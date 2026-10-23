import { isOverdue, formatDeadline } from '@/api/taskApi'

export function taskIsOverdue(task) {
  // A API pode considerar o prazo antecipado; use a regra do servidor quando disponível.
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
