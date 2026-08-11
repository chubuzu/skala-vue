<template>
  <div>
    <h1>🌤️ 과제 2: 날씨 (컴포지션)</h1>

    <SearchBox v-model="searchQuery" />

    <WeatherList
      :weather-list="filteredWeatherList"
      @select="selectCity"
      @detail="showDetail"
    />

    <StatusBar :message="statusMessage" />
  </div>
</template>

<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import SearchBox from '../components/SearchBox.vue'
import WeatherList from '../components/WeatherList.vue'
import StatusBar from '../components/StatusBar.vue'

// 요구사항 1: 반응형 상태 관리 (searchQuery, selectedCityInfo, weatherList)
const searchQuery = ref('')
const selectedCityInfo = ref(null)
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
  { id: 'city_04', name: '대전', temp: 22, status: '흐림' },
  // 국내 광역시(부산·대구·인천·광주·대전·울산) 전체 추가
  { id: 'city_05', name: '대구', temp: 29, status: '맑음' },
  { id: 'city_06', name: '인천', temp: 23, status: '흐림' },
  { id: 'city_07', name: '광주', temp: 27, status: '구름' },
  { id: 'city_08', name: '울산', temp: 25, status: '맑음' }
])

const statusMessage = ref('카드를 클릭하거나 검색해 보세요.')

// 요구사항 2: 검색어에 매칭되는 도시만 걸러낸 Computed 배열
const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim()
  if (!keyword) return weatherList.value
  return weatherList.value.filter((city) => city.name.includes(keyword))
})

// 요구사항 3-1: selectedCityInfo 감시 (watch) -> 상태바 문구 갱신 + 콘솔로그
watch(selectedCityInfo, (newCity) => {
  if (!newCity) return
  statusMessage.value = `${newCity.name}이 선택되었습니다.`
  console.log(`[watch 감지] 상태 바 문구가 업데이트되었습니다 -> "${statusMessage.value}"`)
})

// 요구사항 3-2: searchQuery 감시 (watchEffect) -> 타이핑할 때마다 자동 실행
watchEffect(() => {
  console.log(`[watchEffect 자동 호출] 현재 검색어 '${searchQuery.value}'에 매칭되는 API 데이터를 필터링합니다`)
})

// 요구사항 5: 본인만의 반응형 상태 변수 + Watcher (검색 시도 횟수 추적)
const searchAttemptCount = ref(0)
watch(searchQuery, () => {
  searchAttemptCount.value++
})
// (SearchHint.vue의 isFrequent computed에서 이 값을 활용하며, 화면 표시는 꺼둔 상태)

const selectCity = (city) => {
  console.log('onChange started')
  selectedCityInfo.value = city
  console.log('onChange completed')
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
