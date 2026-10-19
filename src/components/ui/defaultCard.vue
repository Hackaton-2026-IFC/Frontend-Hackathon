<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  to: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '◇',
  },
  number: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    default: 'Acessar',
  },
  available: {
    type: Boolean,
    default: true,
  },
})
</script>

<template>
  <RouterLink
    v-if="to && available"
    :to="to"
    class="resource-card"
  >
    <div class="resource-card-top">
      <span class="resource-icon" aria-hidden="true">
        {{ icon }}
      </span>

      <span class="resource-number">
        {{ number }} / {{ category }}
      </span>
    </div>

    <div class="resource-card-content">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>

    <span class="card-link">
      {{ action }}
      <span aria-hidden="true">→</span>
    </span>
  </RouterLink>

  <article v-else class="resource-card resource-card-disabled">
    <div class="resource-card-top">
      <span class="resource-icon" aria-hidden="true">
        {{ icon }}
      </span>

      <span class="resource-number">
        {{ number }} / {{ category }}
      </span>
    </div>

    <div class="resource-card-content">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>

    <span class="card-link">
      {{ action }}
      <span aria-hidden="true">↗</span>
    </span>
  </article>
</template>

<style scoped>
.resource-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  min-width: 0;
  height: 100%;
  padding: 24px;
  border: 1px solid #e7e7e3;
  border-radius: 16px;
  background: #fff;
  color: #252523;
  text-align: left;
  text-decoration: none;
  overflow-wrap: anywhere;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.resource-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.resource-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid #e8e8e5;
  border-radius: 12px;
  background: #f8f8f6;
  font-size: 21px;
}

.resource-number {
  color: #85857e;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.resource-card-content {
  flex: 1;
  width: 100%;
}

.resource-card h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
  line-height: 1.4;
  letter-spacing: -0.4px;
}

.resource-card p {
  margin: 10px 0 0;
  color: #73736e;
  font-size: 13px;
  line-height: 1.75;
}

.card-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  color: #252523;
  font-size: 12px;
  font-weight: 700;
}

.resource-card-disabled {
  background: #fafaf9;
  color: #555550;
}

.resource-card-disabled .resource-icon {
  background: #f0f0ed;
}

.resource-card-disabled .card-link {
  color: #777772;
}

@media (hover: hover) {
  .resource-card[href]:hover {
    transform: translateY(-3px);
    border-color: #d4d4cf;
    box-shadow: 0 10px 24px rgb(0 0 0 / 5%);
  }
}

@media (max-width: 480px) {
  .resource-card {
    gap: 18px;
    padding: 20px;
  }

  .resource-card h3 {
    font-size: 17px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .resource-card {
    transition: none;
  }
}
</style>
