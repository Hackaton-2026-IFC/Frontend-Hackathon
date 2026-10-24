<script setup>
import { mdi } from '@/utils/projectIcons'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const icons = mdi

function selectIcon(value) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="icon-picker">
    <button
      v-for="icon in icons"
      :key="icon.value"
      type="button"
      class="icon-option"
      :class="{ selected: modelValue === icon.value }"
      :title="icon.label"
      :aria-label="icon.label"
      :aria-pressed="modelValue === icon.value"
      @click="selectIcon(icon.value)"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path :d="icon.path" fill="currentColor" />
      </svg>
      <span>{{ icon.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.icon-picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
  gap: 10px;
}

.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 8px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.icon-option svg {
  width: 28px;
  height: 28px;
}

.icon-option span {
  font-size: 11px;
  text-align: center;
}

.icon-option.selected {
  border: 2px solid #2563eb;
  background: rgba(37, 99, 235, 0.08);
}

.icon-option:hover {
  border-color: #2563eb;
}
</style>
