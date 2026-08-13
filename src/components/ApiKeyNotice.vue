<script setup>
// API 키가 없으면 모든 화면이 목데이터로 동작하므로, 특정 페이지가 아니라 앱 전역에 알린다.
// (예전에는 HomeView에만 있어서, 주소창에 /stadium/xxx 를 직접 입력해 들어오면
//  경고 없이 목데이터가 실제 날씨처럼 보이는 문제가 있었다.)
import { hasApiKey } from '../api/weatherApi'

const missingKey = !hasApiKey()
</script>

<template>
  <el-alert
    v-if="missingKey"
    title="OpenWeatherMap API 키가 없어 목데이터로 표시 중입니다. (.env의 VITE_OPENWEATHER_API_KEY)"
    type="info"
    :closable="false"
    show-icon
    class="api-key-notice"
  />
</template>

<style scoped>
.api-key-notice {
  margin-bottom: 20px;
  border-radius: var(--radius-md);
}
</style>
