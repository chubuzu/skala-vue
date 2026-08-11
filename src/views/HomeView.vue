<template>
  <div>
    <h1>🌤️ 과제 1: 날씨 (Mockup)</h1>

    <SearchBox v-model="searchInput" />

    <WeatherList
      :weather-list="weatherList"
      @select="selectCity"
      @detail="showDetail"
    />

    <StatusBar :message="statusMessage" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBox from '../components/SearchBox.vue'
import WeatherList from '../components/WeatherList.vue'
import StatusBar from '../components/StatusBar.vue'

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
  { id: 'city_04', name: '대전', temp: 22, status: '흐림' }
])

const searchInput = ref('')
const statusMessage = ref('카드를 클릭하거나 검색해 보세요.')

const selectCity = (city) => {
  statusMessage.value = `${city.name}이 선택되었습니다.`
}

const showDetail = (city) => {
  window.alert(`${city.name}의 현재 날씨는 [${city.status}] 상태입니다.`)
}
</script>

<style scoped>
h1 {
  font-size: 28px;
  margin: 0 0 24px;
}
</style>
