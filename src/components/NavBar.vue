<script setup>
import { RouterLink } from 'vue-router'
import UnitToggler from './UnitToggler.vue'
</script>

<template>
  <header class="nav-bar">
    <nav class="nav-links">
      <RouterLink to="/" class="nav-link">홈</RouterLink>
      <RouterLink to="/schedule" class="nav-link">경기 일정</RouterLink>
      <RouterLink to="/teams" class="nav-link">구단 목록</RouterLink>
      <RouterLink to="/about" class="nav-link">소개</RouterLink>
    </nav>

    <UnitToggler />
  </header>
</template>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 14px;
  margin-bottom: 28px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  border: 1px solid var(--separator);
  border-radius: 999px;
}
.nav-links {
  display: flex;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.nav-links::-webkit-scrollbar {
  display: none;
}
.nav-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--label-secondary);
  padding: 7px 16px;
  border-radius: 999px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.nav-link:hover {
  opacity: 1;
  background: var(--surface-muted);
  color: var(--label);
}
.nav-link.router-link-exact-active {
  background: var(--label);
  color: #fff;
}

@media (max-width: 640px) {
  .nav-bar {
    padding: 8px 10px;
    margin-bottom: 20px;
    gap: 8px;
  }
  .nav-link {
    padding: 6px 12px;
    font-size: 13px;
    white-space: nowrap;
  }
}
</style>
