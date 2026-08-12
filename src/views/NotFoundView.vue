<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="not-found">
    <el-empty description="페이지를 찾을 수 없습니다.">
      <RouterLink to="/">
        <el-button type="primary" round>홈으로 돌아가기</el-button>
      </RouterLink>
    </el-empty>
  </div>
</template>

<style scoped>
.not-found {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 40px 0;
  box-shadow: var(--shadow-card);
}
</style>
