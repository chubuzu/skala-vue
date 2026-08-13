<script setup>
import { RouterLink } from 'vue-router'
import UnitToggler from './UnitToggler.vue'
import { usePlannerStore } from '../stores/plannerStore'

// 담은 경기 개수를 모든 페이지에서 상시 노출하기 위해 NavBar에서 Store를 읽는다
const plannerStore = usePlannerStore()
</script>

<template>
  <header class="nav-bar">
    <nav class="nav-links">
      <RouterLink to="/" class="nav-link">홈</RouterLink>
      <RouterLink to="/schedule" class="nav-link">경기 일정</RouterLink>
      <RouterLink to="/plan" class="nav-link">
        직관 예정
        <span v-if="plannerStore.planCount > 0" class="count-badge">
          {{ plannerStore.planCount }}
        </span>
      </RouterLink>
      <RouterLink to="/stadiums" class="nav-link">야구장 위치</RouterLink>
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
  /* 아이보리 배경 위에 순백을 얹으면 위화감이 생겨 웜톤 반투명으로 */
  background: rgba(255, 253, 249, 0.75);
  backdrop-filter: saturate(180%) blur(20px);
  border: 1px solid var(--separator);
  border-radius: 999px;
  /* 스크롤해도 상단에 고정 */
  position: sticky;
  top: 12px;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(80, 66, 44, 0.06);
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
  font-weight: 600;
  white-space: nowrap;
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
.count-badge {
  display: inline-block;
  min-width: 17px;
  margin-left: 5px;
  padding: 1px 5px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 15px;
  text-align: center;
}
.nav-link.router-link-exact-active .count-badge {
  background: #fff;
  color: var(--label);
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
