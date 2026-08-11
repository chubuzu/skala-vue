<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style scoped>
* { box-sizing: border-box; }

#app {
  width: 100%;
  max-width: 960px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 20px;
  padding: 32px 40px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  font-family: "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
}
</style>