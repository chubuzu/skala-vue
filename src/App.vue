<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import GlobalProgressBar from './components/GlobalProgressBar.vue'
import ApiKeyNotice from './components/ApiKeyNotice.vue'
</script>

<template>
  <!-- 진행 바는 position:fixed라 레이아웃 밖(#app 위)에 둔다 -->
  <GlobalProgressBar />

  <div id="app">
    <NavBar />
    <!-- 앱 전체에 해당하는 안내이므로 개별 페이지가 아닌 여기에 배치 -->
    <ApiKeyNotice />
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
