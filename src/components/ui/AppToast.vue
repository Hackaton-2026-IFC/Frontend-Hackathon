
<script setup>
import { cleanMessage } from '@/composables/useToasts'
import { computed, ref, watch, onUnmounted } from "vue";

const props = defineProps({
  message: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "success",
  },
  toastId: { type: Number, default: 0 },
  duration: {
    type: Number,
    default: 5000,
  },
});

const emit = defineEmits(["close"]);

const visible = ref(false);
const toastKey = ref(0);

let timeoutId = null;

const toastIcon = computed(() => {
  return props.type === "error" ? "mdi-alert-circle-outline" : props.type === "success" ? "mdi-check-circle-outline" : "mdi-information-outline";
});

function clearTimer() {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function closeToast() {
  clearTimer();
  visible.value = false;
  emit("close");
}

function showToast() {
  clearTimer();

  if (!props.message) {
    visible.value = false;
    return;
  }

  visible.value = true;
  toastKey.value++;

  timeoutId = setTimeout(() => {
    closeToast();
  }, props.duration);
}

watch(
  () => [props.message, props.toastId],
  () => showToast(),
  { immediate: true }
);

onUnmounted(clearTimer);
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div
        v-if="visible && message"
        :key="toastKey"
        class="app-toast"
        :class="type"
        role="status"
      >
        <div class="app-toast-content">
          <span
            class="mdi app-toast-icon"
            :class="toastIcon"
            aria-hidden="true"
          ></span>

          <span class="app-toast-message">
            {{ cleanMessage(message) }}
          </span>

          <button
            type="button"
            class="app-toast-close"
            aria-label="Fechar notificação"
            @click="closeToast"
          >
            <span class="mdi mdi-close"></span>
          </button>
        </div>

        <div class="app-toast-progress-track">
          <div
            class="app-toast-progress"
            :key="toastKey"
            :style="{ animationDuration: `${duration}ms` }"
          ></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  width: min(400px, calc(100vw - 32px));
  overflow: hidden;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background: #fff;
  color: #171717;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.12);
}

.app-toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.app-toast-icon {
  flex-shrink: 0;
  color: #171717;
  font-size: 1.3rem;
}

.app-toast-message {
  flex: 1;
  font-size: 0.83rem;
  font-weight: 500;
  line-height: 1.5;
}

.app-toast-close {
  display: flex;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #737373;
  cursor: pointer;
}

.app-toast-close:hover {
  background: #f5f5f5;
  color: #171717;
}

.app-toast-progress-track {
  width: 100%;
  height: 3px;
  background: #e5e5e5;
}

.app-toast-progress {
  width: 100%;
  height: 100%;
  background: #171717;
  transform-origin: left;
  animation: toast-countdown linear forwards;
}

.app-toast.success .app-toast-icon { color: #16803c; }
.app-toast.success .app-toast-progress { background: #16803c; }
.app-toast.info .app-toast-icon, .app-toast.warning .app-toast-icon { color: #171717; }
.app-toast.info .app-toast-progress, .app-toast.warning .app-toast-progress { background: #171717; }
.app-toast.error .app-toast-icon {
  color: #b42318;
}

.app-toast.error .app-toast-progress {
  background: #b42318;
}

@keyframes toast-countdown {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}

@media (max-width: 480px) {
  .app-toast {
    top: 16px;
    right: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast-slide-enter-active,
  .toast-slide-leave-active {
    transition: none;
  }
}
</style>
