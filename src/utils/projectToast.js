// Notificações da área de projetos, exibidas pelo AppToast no ProjectView.
export function projectToast(message, type = 'success') {
  if (!message) return
  window.dispatchEvent(new CustomEvent('momentum:project-toast', {
    detail: { message: String(message), type: type === 'error' ? 'error' : 'success' },
  }))
}
