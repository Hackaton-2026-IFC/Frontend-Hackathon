<script setup>
import { RouterView, useRoute } from 'vue-router'
import appFooterComponent from './components/layout/appFooterComponent.vue'
import appHeaderComponent from './components/layout/appHeaderComponent.vue'

const route = useRoute()
</script>
<template>
  <appHeaderComponent v-if="!route.meta.hideHeader"></appHeaderComponent>

  <main class="page">
    <RouterView> </RouterView>
  </main>

  <appFooterComponent v-if="!route.meta.hideFooter"></appFooterComponent>
</template>
<style>
@import url('/src/assets/css/global.css');
</style>
