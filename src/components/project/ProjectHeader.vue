<script setup>
import { computed, ref } from 'vue'
import { getProjectIcon } from '@/utils/projectIcons'
import { DEFAULT_PROJECT_COLOR, projectIconTextColor } from '@/utils/projectColors'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete', 'open-agent'])
const mobileMenuOpen = ref(false)

function selectAction(action) {
  mobileMenuOpen.value = false
  emit(action)
}

const statuses = {
  planned: 'Planejado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  planejado: 'Planejado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

const projectName = computed(() => {
  return props.project.name ?? props.project.nome ?? 'Sem nome'
})

const projectDescription = computed(() => {
  return (
    props.project.description ||
    props.project.descricao ||
    'Sem descrição por enquanto.'
  )
})

const projectStatus = computed(() => {
  return (
    statuses[props.project.status] ||
    props.project.status ||
    'Não definido'
  )
})

const projectColor = computed(() => {
  const color = props.project.cor

  return /^#[0-9a-fA-F]{6}$/.test(color || '')
    ? color
    : DEFAULT_PROJECT_COLOR
})

const projectIcon = computed(() => {
  return getProjectIcon(props.project.icone)
})

const projectDeadline = computed(() => {
  const date = props.project.data_limite

  if (!date) return 'Não definido'

  const normalizedDate = String(date).slice(0, 10)
  const [year, month, day] = normalizedDate.split('-')

  if (!year || !month || !day) {
    return normalizedDate
  }

  return `${day}/${month}/${year}`
})
</script>

<template>
  <header class="momentum-project-header">
    <div class="momentum-project-header__main">
      <div
        class="momentum-project-header__icon"
        :style="{ backgroundColor: projectColor, color: projectIconTextColor(projectColor) }"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24">
          <path :d="projectIcon" fill="currentColor" />
        </svg>
      </div>

      <div class="momentum-project-header__content">
        <h1 class="momentum-project-header__title">
          {{ projectName }}
        </h1>

        <p class="momentum-project-header__description">
          {{ projectDescription }}
        </p>

        <div class="momentum-project-header__metadata">
          <span class="momentum-project-header__deadline">
            <strong>Prazo:</strong>
            {{ projectDeadline }}
          </span>

          <span class="momentum-project-header__status">
            <span
              class="momentum-project-header__status-dot"
              aria-hidden="true"
            ></span>
            {{ projectStatus }}
          </span>
        </div>
      </div>
    </div>

    <div class="momentum-project-header__action-area">
      <button
        type="button"
        class="momentum-project-header__menu-toggle"
        :aria-expanded="mobileMenuOpen"
        aria-controls="project-mobile-actions"
        aria-label="Abrir ações do projeto"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <span class="mdi" :class="mobileMenuOpen ? 'mdi-close' : 'mdi-menu'" aria-hidden="true"></span>
        <span class="momentum-project-header__menu-label">Ações</span>
      </button>
      <div
        id="project-mobile-actions"
        class="momentum-project-header__actions"
        :class="{ 'momentum-project-header__actions--open': mobileMenuOpen }"
      >
      <button
        type="button"
        class="momentum-project-header__button board-link"
        @click="selectAction('open-agent')"
      >
        <span class="mdi mdi-auto-fix" aria-hidden="true"></span>
        Agente de IA
      </button>

      <button
        type="button"
        class="momentum-project-header__button momentum-project-header__button--edit"
        @click="selectAction('edit')"
      >
        Editar projeto
      </button>

      <button
        type="button"
        class="momentum-project-header__button momentum-project-header__button--delete"
        @click="selectAction('delete')"
      >
        Excluir projeto
      </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.momentum-project-header__action-area {
  position: relative;
  flex: 0 1 auto;
}
.momentum-project-header__menu-toggle {
  display: none;
}
@media (max-width: 600px) {
  .momentum-project-header__action-area {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  .momentum-project-header__menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 44px;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid #dedede;
    border-radius: 10px;
    background: #fff;
    color: #171717;
    font: inherit;
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
  }
  .momentum-project-header__menu-toggle .mdi { font-size: 22px; }
  .momentum-project-header__menu-toggle:focus-visible {
    outline: 3px solid #666;
    outline-offset: 2px;
  }
  .momentum-project-header__actions {
    display: none;
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 20;
    width: min(240px, calc(100vw - 64px));
    padding: 10px;
    border: 1px solid #dedede;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 12px 30px rgb(0 0 0 / 12%);
  }
  .momentum-project-header__actions--open {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
  .momentum-project-header__actions .board-link { grid-column: auto; }
}

.momentum-project-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  width: 100%;
  min-width: 0;
  padding: 28px;
  box-sizing: border-box;
  border: 1px solid #dedede;
  border-radius: 18px;
  background: #fff;
  color: #111;
}

.momentum-project-header__main {
  display: flex;
  align-items: center;
  flex: 1 1 420px;
  min-width: 0;
  gap: 20px;
}

.momentum-project-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  color: #fff;
}

.momentum-project-header__icon svg {
  display: block;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.momentum-project-header__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.momentum-project-header__title {
  max-width: 100%;
  margin: 0;
  color: #111;
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -1px;
  overflow-wrap: anywhere;
}

.momentum-project-header__description {
  width: 100%;
  margin: 10px 0 0;
  color: #666;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.momentum-project-header__metadata {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
  margin-top: 16px;
}

.momentum-project-header__deadline {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}

.momentum-project-header__deadline strong {
  color: #111;
  font-weight: 600;
}

.momentum-project-header__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: fit-content;
  padding: 6px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 999px;
  background: #f8f8f8;
  color: #444;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.momentum-project-header__status-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #111;
}

.momentum-project-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  flex: 0 1 auto;
  gap: 10px;
}

.momentum-project-header__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 11px 18px;
  box-sizing: border-box;
  border: 1px solid #111;
  border-radius: 999px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.momentum-project-header__button--edit {
  background: #111;
  color: #fff;
}

.momentum-project-header__button--edit:hover {
  background: #333;
}

.momentum-project-header__button--delete,
.board-link {
  background: #fff;
  color: #111;
}

.momentum-project-header__button--delete:hover,
.board-link:hover {
  background: #f5f5f5;
}

.momentum-project-header__button:focus-visible {
  outline: 2px solid #000;
  outline-offset: 4px;
}

@media (max-width: 900px) {
  .momentum-project-header {
    padding: 24px;
  }

  .momentum-project-header__main {
    flex-basis: 100%;
  }

  .momentum-project-header__actions {
    justify-content: flex-start;
    width: 100%;
  }
}

@media (max-width: 600px) {
  .momentum-project-header {
    gap: 20px;
    padding: 20px;
    border-radius: 14px;
  }

  .momentum-project-header__main {
    gap: 14px;
  }

  .momentum-project-header__icon {
    flex-basis: 48px;
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .momentum-project-header__icon svg {
    width: 26px;
    height: 26px;
  }

  .momentum-project-header__title {
    font-size: 24px;
    letter-spacing: -0.6px;
  }

  .momentum-project-header__description {
    font-size: 13px;
  }

  .momentum-project-header__metadata {
    gap: 10px;
  }

  .momentum-project-header__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .momentum-project-header__button {
    width: 100%;
    padding: 10px 12px;
    font-size: 11px;
  }

  .board-link {
    grid-column: 1 / -1;
  }
}

@media (max-width: 380px) {
  .momentum-project-header__actions {
    grid-template-columns: minmax(0, 1fr);
  }

  .momentum-project-header__main {
    flex-direction: column;
    align-items: flex-start;
  }

  .momentum-project-header__icon {
    flex-basis: auto;
  }
}
</style>