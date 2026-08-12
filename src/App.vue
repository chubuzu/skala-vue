<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div id="app">
    <NavBar />
    <RouterView />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

#app {
  width: 100%;
  max-width: 1120px;
  margin: 40px auto 64px;
  padding: 0 24px;
  overflow-x: hidden;
}

@media (max-width: 640px) {
  #app {
    margin: 20px auto 40px;
    padding: 0 16px;
  }
}
</style>
