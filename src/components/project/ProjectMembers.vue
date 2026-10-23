<script setup>
import { computed } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const members = computed(() =>
  Array.isArray(props.project.members)
    ? props.project.members
    : [],
)
</script>

<template>
  <section class="members" aria-labelledby="project-members-title">
    <header>
      <h2 id="project-members-title">Membros do projeto</h2>
      <span>{{ members.length }}</span>
    </header>

    <ul v-if="members.length">
      <li v-for="member in members" :key="member.id">
        <span class="avatar" aria-hidden="true">
          {{ (member.name || 'M').charAt(0).toUpperCase() }}
        </span>

        <div>
          <strong>{{ member.name || 'Membro' }}</strong>
          <p>{{ member.role || 'Membro' }}</p>
        </div>
      </li>
    </ul>

    <p v-else class="empty">
      Nenhum membro informado.
    </p>
  </section>
</template>

<style scoped>
.members {
  min-width: 0;
  padding: 18px;
  border: 1px solid #000;
  border-radius: 18px;
  background: #fff;
  color: #000;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

h2 {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 18px;
  font-weight: 700;
}

header > span {
  font-size: 14px;
}

ul {
  display: grid;
  gap: 16px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

li > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

.avatar {
  display: grid;
  place-items: center;
  flex: 0 0 40px;
  height: 40px;
  border-radius: 50%;
  background: #000;
  color: #fff;
  font-weight: 700;
}

strong {
  font-size: 14px;
}

p {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.6;
}

.empty {
  margin-top: 20px;
}
@media (min-width: 768px) { .members { padding: 24px; } }
</style>
