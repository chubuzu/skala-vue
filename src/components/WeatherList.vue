<script setup>
import { ref, computed, watch } from 'vue'
import BaseDashboardCard from './BaseDashboardCard.vue'
import WeatherCard from './WeatherCard.vue'
import Pagination from './Pagination.vue'

const props = defineProps({
  weatherList: { type: Array, required: true },
  // { 구장id: { home, away } } 형태의 오늘 대진 정보
  todayGameMap: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['select', 'detail'])

const PAGE_SIZE = 5
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(props.weatherList.length / PAGE_SIZE)))

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return props.weatherList.slice(start, start + PAGE_SIZE)
})

// 검색어 등으로 목록 자체가 바뀌면 항상 1페이지로 리셋
watch(
  () => props.weatherList,
  () => {
    currentPage.value = 1
  }
)
</script>

<template>
  <!-- 검색박스와 동일한 BaseDashboardCard를 재사용하고, 내용만 slot으로 주입 -->
  <BaseDashboardCard title="구단별 홈구장 날씨">
    <!-- Named Slot(actions): 헤더 우측에 결과 개수 표시 -->
    <template #actions>
      <span class="count">{{ weatherList.length }}개 구장</span>
    </template>

    <!-- Default Slot: 카드 그리드 -->
    <el-empty v-if="weatherList.length === 0" description="검색 결과와 일치하는 구단/구장이 없습니다." />

    <div v-else class="card-grid">
      <WeatherCard
        v-for="city in pagedList"
        :key="city.id"
        :city="city"
        :today-game="todayGameMap[city.id] ?? null"
        @select="emit('select', $event)"
        @detail="emit('detail', $event)"
      />
    </div>

    <!-- Named Slot(footer): 페이지네이션은 하단 영역에 -->
    <template v-if="totalPages > 1" #footer>
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @change="currentPage = $event"
      />
    </template>
  </BaseDashboardCard>
</template>

<style scoped>
.count {
  font-size: 13px;
  color: var(--label-secondary);
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}
</style>
