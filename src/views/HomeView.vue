<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchBox from '../components/SearchBox.vue'
import WeatherList from '../components/WeatherList.vue'
import StatusBar from '../components/StatusBar.vue'
import { stadiums } from '../data/stadiums'
import { fetchCurrentWeather, hasApiKey } from '../api/weatherApi'
import { getTodayString, getStadiumIdsWithGameOn, getGameMapOn } from '../api/kboScheduleApi'
import { useFavoriteStore } from '../stores/favoriteStore'

const route = useRoute()
const router = useRouter()
const hasApiKeySet = hasApiKey()
const favoriteStore = useFavoriteStore()

// 오늘 홈경기가 열리는 구장 id 목록 (카드 정렬/배지에 사용)
const today = getTodayString()
const todayStadiumIds = getStadiumIdsWithGameOn(today)
// 카드에 오늘의 대진을 표시하기 위한 { 구장id: { home, away } } 맵
const todayGameMap = getGameMapOn(today)

const todayLabel = computed(() => {
  const [, month, day] = today.split('-').map(Number)
  return `${month}월 ${day}일`
})

// 요구사항 1: 반응형 상태 관리 (searchQuery, selectedCityInfo, weatherList)
// 교재 171p Query String Routing: 주소창의 ?search=... 값을 초기값으로 복원한다.
// (배열로 올 수도 있으므로 문자열일 때만 사용)
function readSearchFromUrl() {
  const raw = route.query.search
  return typeof raw === 'string' ? raw : ''
}

const searchQuery = ref(readSearchFromUrl())
const selectedCityInfo = ref(null)

// ⚾ 초기값은 목데이터로 채우고, API 키가 있으면 onMounted에서 실제 값으로 덮어쓴다.
const weatherList = ref(
  stadiums.map((stadium) => ({
    id: stadium.id,
    name: stadium.name,
    teams: stadium.teams,
    region: stadium.region,
    teamColor: stadium.teamColor,
    address: stadium.address,
    temp: stadium.mockTemp,
    status: stadium.mockStatus,
    icon: null
  }))
)

const isLoadingWeather = ref(false)
const statusMessage = ref('카드를 클릭하거나 검색해 보세요.')

// Axios 실습: OpenWeatherMap에서 실제 날씨를 받아와 목데이터를 덮어쓴다.
async function loadRealWeather() {
  if (!hasApiKeySet) return

  isLoadingWeather.value = true
  try {
    const results = await Promise.all(
      stadiums.map(async (stadium) => {
        try {
          const current = await fetchCurrentWeather(stadium.lat, stadium.lon)
          return { id: stadium.id, ...current }
        } catch (error) {
          console.error(`${stadium.name} 날씨 조회 실패:`, error)
          return null // 실패한 구장은 기존 목데이터를 그대로 유지
        }
      })
    )

    results.forEach((result) => {
      if (!result) return
      const target = weatherList.value.find((city) => city.id === result.id)
      if (target) {
        target.temp = result.temp
        target.status = result.status
        target.icon = result.icon
      }
    })
  } finally {
    isLoadingWeather.value = false
  }
}

onMounted(loadRealWeather)

// 정렬 우선순위 점수 (낮을수록 위로)
//   0 = 오늘 경기 O + 즐겨찾기 O   ← 가장 먼저 보고 싶은 구장
//   1 = 오늘 경기 O
//   2 = 즐겨찾기 O (오늘 경기는 없음)
//   3 = 나머지
function sortRank(city) {
  const hasGame = todayStadiumIds.includes(city.id)
  const isFavorite = favoriteStore.isFavorite(city.id)

  if (hasGame && isFavorite) return 0
  if (hasGame) return 1
  if (isFavorite) return 2
  return 3
}

// 요구사항 2: 검색어에 매칭되는 구장/구단/지역만 걸러낸 Computed 배열
// + 오늘 경기 / 즐겨찾기 구장을 앞쪽으로 정렬
const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim()

  const matched = keyword
    ? weatherList.value.filter(
        (city) =>
          city.name.includes(keyword) ||
          city.teams.includes(keyword) ||
          city.region.includes(keyword)
      )
    : weatherList.value

  // 원본 배열을 건드리지 않도록 복사본을 정렬
  // favoriteStore를 computed 안에서 읽으므로, 별표를 누르면 목록이 즉시 재정렬된다.
  return [...matched].sort((a, b) => sortRank(a) - sortRank(b))
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

// 교재 171p Query String Routing — 검색어 ↔ 주소창 양방향 동기화
//
// (1) 검색어가 바뀌면 주소창을 갱신한다.
//     타이핑 한 글자마다 히스토리가 쌓이면 뒤로가기가 지옥이 되므로 push가 아닌 replace를 쓴다.
watch(searchQuery, (keyword) => {
  if (keyword === readSearchFromUrl()) return // 이미 같은 값이면 불필요한 라우팅 생략

  router.replace({
    query: keyword
      ? { ...route.query, search: keyword }
      : // 검색어를 지우면 ?search= 자체를 주소창에서 제거
        Object.fromEntries(Object.entries(route.query).filter(([key]) => key !== 'search'))
  })
})

// (2) 반대 방향: 뒤로가기/앞으로가기로 주소창이 바뀌면 검색어를 따라 맞춘다.
//     (1)과 (2)가 서로를 호출하지만, 값이 같으면 즉시 return하므로 무한 루프가 되지 않는다.
watch(
  () => route.query.search,
  () => {
    const fromUrl = readSearchFromUrl()
    if (fromUrl !== searchQuery.value) {
      searchQuery.value = fromUrl
    }
  }
)

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

// Weather Router 실습 요구사항 3: window.alert() 대신 Programmatic Navigation
const showDetail = (city) => {
  router.push(`/stadium/${city.id}`)
}
</script>

<template>
  <div>
    <header class="page-head">
      <h1>야구장 날씨</h1>
      <p class="subtitle">{{ todayLabel }} · 오늘 경기가 있는 구장을 먼저 보여드려요</p>
    </header>

    <el-alert
      v-if="!hasApiKeySet"
      title="OpenWeatherMap API 키가 설정되지 않아 목데이터로 표시 중입니다. (.env의 VITE_OPENWEATHER_API_KEY)"
      type="info"
      :closable="false"
      show-icon
      class="api-key-alert"
    />

    <SearchBox v-model="searchQuery" />

    <el-skeleton :loading="isLoadingWeather" animated :rows="4">
      <template #default>
        <WeatherList
          :weather-list="filteredWeatherList"
          :today-game-map="todayGameMap"
          @select="selectCity"
          @detail="showDetail"
        />
      </template>
    </el-skeleton>

    <StatusBar :message="statusMessage" />
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 24px;
}
.page-head h1 {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.8px;
  margin: 0 0 6px;
}
.subtitle {
  font-size: 15px;
  color: var(--label-secondary);
  margin: 0;
}
.api-key-alert {
  margin-bottom: 16px;
  border-radius: var(--radius-sm);
}

@media (max-width: 640px) {
  .page-head h1 {
    font-size: 26px;
  }
  .subtitle {
    font-size: 14px;
  }
}
</style>
