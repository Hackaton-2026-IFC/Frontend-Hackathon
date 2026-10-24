/**
 * Presentation rules for the sequential roadmap. The API also validates
 * dependencies, so these checks improve UX without replacing validation.
 */
export function orderedRoadmapSteps(task) {
  return [...(Array.isArray(task?.microtarefas) ? task.microtarefas : [])]
    .sort((a, b) => Number(a.ordem) - Number(b.ordem) || Number(a.id) - Number(b.id))
}

export function roadmapCanToggle(steps, index) {
  const step = steps[index]
  if (!step) return false
  if (step.concluida) return steps.slice(index + 1).every((item) => !item.concluida)
  return steps.slice(0, index).every((item) => item.concluida)
}

export function roadmapProgress(steps) {
  const finished = steps.filter((item) => item.concluida).length
  const total = steps.length
  return { finished, total, percent: total ? Math.round((finished / total) * 100) : 0 }
}
