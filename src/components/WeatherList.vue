<template>
  <div class="weather-list">
    <h2>📍 지역별 날씨 현황</h2>

    <div class="card-grid">
      <WeatherCard
        v-for="city in weatherList"
        :key="city.id"
        :city="city"
        @select="emit('select', $event)"
        @detail="emit('detail', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import WeatherCard from './WeatherCard.vue'

defineProps({
  weatherList: { type: Array, required: true }
})

const emit = defineEmits(['select', 'detail'])
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
</style>