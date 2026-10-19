
<script setup>
import { ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, default: '' },
  icon: { type: String, required: true },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: 'off' },
})

defineEmits(['update:modelValue'])

const isPasswordVisible = ref(false)

watch(
  () => props.type,
  () => {
    isPasswordVisible.value = false
  },
)
</script>

<template>
  <div class="auth-input">
    <label class="auth-input-field">
      <svg
        class="input-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <template v-if="icon === 'user'">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
        </template>

        <template v-else-if="icon === 'mail'">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </template>

        <template v-else-if="icon === 'lock'">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </template>
      </svg>

      <input
        :value="modelValue"
        :type="type === 'password' && isPasswordVisible ? 'text' : type"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        v-bind="$attrs"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </label>

    <button
      v-if="type === 'password'"
      class="password-visibility-toggle"
      type="button"
      :aria-label="isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'"
      :aria-pressed="isPasswordVisible"
      @click="isPasswordVisible = !isPasswordVisible"
    >
      <span
        class="mdi"
        :class="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
        aria-hidden="true"
      ></span>
    </button>
  </div>
</template>

<style scoped>
.auth-input {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 52px;
  min-width: 0;
  box-sizing: border-box;
  padding: 0 16px;
  border: 1px solid #dedede;
  border-radius: 10px;
  background: #f5f5f5;
  color: #555;
  transition:
    border-color 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}

.auth-input-field {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 12px;
  width: 0;
  min-width: 0;
}

.auth-input:focus-within {
  border-color: #777;
  background: #fff;
  box-shadow: 0 0 0 2px rgb(0 0 0 / 8%);
}

.input-icon {
  width: 19px;
  height: 19px;
  flex-shrink: 0;
  color: #777;
}

.auth-input input {
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #171717;
  font: inherit;
  font-size: 14px;
}

.auth-input input::placeholder {
  color: #999;
}

.password-visibility-toggle {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #777;
  font-size: 20px;
  cursor: pointer;
}

.password-visibility-toggle:focus-visible {
  border-radius: 4px;
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>
