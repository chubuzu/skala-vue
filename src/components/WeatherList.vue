<template>
  <div class="weather-list">
    <h2>📍 지역별 날씨 현황</h2>

    <!-- 요구사항 4: 검색 결과가 없을 때 안내 문구 -->
    <p v-if="weatherList.length === 0" class="empty-message">
      🔍 검색 결과와 일치하는 도시가 없습니다.
    </p>

    <template v-else>
      <div class="card-grid">
        <WeatherCard
          v-for="city in pagedList"
          :key="city.id"
          :city="city"
          @select="emit('select', $event)"
          @detail="emit('detail', $event)"
        />
      </div>

      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @change="currentPage = $event"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import WeatherCard from './WeatherCard.vue'
import Pagination from './Pagination.vue'

const props = defineProps({
  weatherList: { type: Array, required: true }
})

const emit = defineEmits(['select', 'detail'])

const PAGE_SIZE = 5
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.weatherList.length / PAGE_SIZE))
)

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

<style scoped>
.weather-list {
  background: #f2f6fb;
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 20px;
}
.weather-list h2 {
  font-size: 18px;
  margin: 0 0 16px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.empty-message {
  text-align: center;
  font-size: 14px;
  color: #64748b;
  padding: 24px 0;
}
</style>