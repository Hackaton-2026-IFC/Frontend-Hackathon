<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { mountGoogleButton } from '@/services/googleIdentity'

const props = defineProps({
  text: { type: String, default: 'continue_with' },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['credential'])
const container = ref(null)
const sdkError = ref('')
const ready = ref(false)
let active = true
let cleanup = null

async function initialize() {
  sdkError.value = ''
  try {
    const dispose = await mountGoogleButton(
      container.value,
      (credential) => {
        if (active && !props.busy) emit('credential', credential)
      },
      { text: props.text },
    )
    if (!active) dispose()
    else {
      cleanup = dispose
      ready.value = true
    }
  } catch (error) {
    if (active) sdkError.value = error.message || 'Não foi possível conectar ao Google.'
  }
}

onMounted(initialize)
onBeforeUnmount(() => {
  active = false
  cleanup?.()
})
</script>

<template>
  <div class="google-identity">
    <div class="google-identity__button" :class="{ 'google-identity__disabled': busy }" :aria-busy="busy">
      <div ref="container" class="google-identity__host"></div>
      <div v-if="busy" class="google-identity__shield" aria-label="Autenticando com Google"></div>
    </div>
    <p v-if="sdkError" class="google-identity__error" role="alert">
      {{ sdkError }}
      <button type="button" @click="initialize">Tentar novamente</button>
    </p>
    <span v-else-if="!ready" class="google-identity__loading" role="status">Carregando acesso Google...</span>
  </div>
</template>

<style scoped>
.google-identity{width:100%;display:grid;justify-items:center;gap:8px}
.google-identity__button{position:relative;display:flex;justify-content:center;max-width:100%;width:100%;min-height:42px}
.google-identity__host{display:flex;justify-content:center;width:100%;max-width:380px;min-height:40px}
.google-identity__disabled{opacity:.65}
.google-identity__shield{position:absolute;inset:0;z-index:1;cursor:wait}
.google-identity__loading{font-size:12px;color:#666}
.google-identity__error{font-size:12px;color:#b42318;text-align:center;line-height:1.55;margin:0}
.google-identity__error button{border:0;background:transparent;text-decoration:underline;color:inherit;cursor:pointer}
</style>
