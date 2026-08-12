<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { findStadiumById } from '../data/stadiums'
import { fetchCurrentWeather, fetchForecast, fetchDailySummary, hasApiKey } from '../api/weatherApi'
import { fetchGameByStadiumAndDate, getTodayString, getStadiumGameDates } from '../api/kboScheduleApi'
import { useConfigStore } from '../stores/configStore'
import { useFavoriteStore } from '../stores/favoriteStore'
import { convertTemp } from '../utils/temperature'
import { weatherEmoji } from '../utils/weatherIcon'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import DateSelector from '../components/DateSelector.vue'
import StadiumImage from '../components/StadiumImage.vue'
import WindIndicator from '../components/WindIndicator.vue'
import ShadeTimeline from '../components/ShadeTimeline.vue'

const route = useRoute()
const configStore = useConfigStore()
const favoriteStore = useFavoriteStore()

const stadium = computed(() => findStadiumById(route.params.stadiumId))
const isFavorite = computed(
  () => Boolean(stadium.value) && favoriteStore.isFavorite(stadium.value.id)
)

const hasApiKeySet = hasApiKey()

const todayString = getTodayString()

const isWeatherLoading = ref(true)
const weather = ref({
  temp: 0,
  status: '',
  humidity: null,
  icon: null,
  windSpeed: null,
  windDeg: null,
  sunset: null
})
const forecast = ref([])
const dailyWeather = ref({})

const isGameLoading = ref(true)
const game = ref(null)
const selectedDate = ref('')

// 이 구장에서 홈경기가 열리는 날짜만 칩으로 노출
const gameDates = computed(() => (stadium.value ? getStadiumGameDates(stadium.value.id) : []))

const displayTemp = computed(() => convertTemp(weather.value.temp, configStore.unit))
const currentEmoji = computed(() => weatherEmoji(weather.value))

// 현재 날씨 API에는 강수확률이 없어서, 예보의 가장 가까운 시간대 값을 대표값으로 사용
const nearestPrecipitationChance = computed(() => forecast.value[0]?.precipitationChance ?? null)

function emojiOf(item) {
  return weatherEmoji(item)
}

// 오늘 홈경기가 있으면 오늘을, 없으면 오늘 이후 가장 가까운 홈경기 날짜를 기본 선택
function pickInitialDate(dates) {
  if (dates.length === 0) return ''
  const today = getTodayString()
  return dates.find((date) => date >= today) ?? dates[dates.length - 1]
}

function formatForecastTime(dtText) {
  // "2026-08-11 21:00:00" -> "21시"
  const hour = dtText.split(' ')[1]?.slice(0, 2)
  return hour ? `${Number(hour)}시` : dtText
}

async function loadWeather(target) {
  isWeatherLoading.value = true
  try {
    if (!hasApiKeySet) throw new Error('OpenWeatherMap API 키 없음')
    const [current, forecastList, summary] = await Promise.all([
      fetchCurrentWeather(target.lat, target.lon),
      fetchForecast(target.lat, target.lon),
      fetchDailySummary(target.lat, target.lon)
    ])
    weather.value = current
    forecast.value = forecastList
    dailyWeather.value = summary
  } catch {
    // API 키가 없거나 통신에 실패하면 목데이터로 자연스럽게 대체
    weather.value = {
      temp: target.mockTemp,
      status: target.mockStatus,
      humidity: null,
      icon: null,
      windSpeed: null,
      windDeg: null,
      sunset: null
    }
    forecast.value = []
    dailyWeather.value = {}
  } finally {
    isWeatherLoading.value = false
  }
}

async function loadGame(target, dateStr) {
  if (!dateStr) {
    game.value = null
    isGameLoading.value = false
    return
  }

  isGameLoading.value = true
  try {
    game.value = await fetchGameByStadiumAndDate(target, dateStr)
  } finally {
    isGameLoading.value = false
  }
}

function loadAll() {
  if (!stadium.value) return
  loadWeather(stadium.value)
  // 구장이 바뀌면 그 구장의 홈경기 날짜로 초기 선택을 다시 잡는다
  selectedDate.value = pickInitialDate(gameDates.value)
  loadGame(stadium.value, selectedDate.value)
}

// 날짜만 바뀌면 날씨는 그대로 두고 경기 정보만 다시 조회
watch(selectedDate, (newDate) => {
  if (!stadium.value) return
  loadGame(stadium.value, newDate)
})

onMounted(loadAll)
watch(() => route.params.stadiumId, loadAll)
</script>

<template>
  <div class="detail-view">
    <RouterLink to="/" class="back-link">‹ 목록으로</RouterLink>

    <el-empty v-if="!stadium" description="존재하지 않는 구장입니다." />

    <template v-else>
      <StadiumImage :stadium="stadium" hero class="detail-image" />

      <div class="detail-header">
        <div>
          <h1>{{ stadium.name }}</h1>
          <p class="teams">{{ stadium.teams }}</p>
          <p class="address">📍 {{ stadium.address }}</p>
        </div>
        <button
          class="fav-btn"
          :class="{ on: isFavorite }"
          @click="favoriteStore.toggleFavorite(stadium.id)"
        >
          {{ isFavorite ? '★ 즐겨찾기됨' : '☆ 즐겨찾기' }}
        </button>
      </div>

      <BaseDashboardCard title="현재 날씨">
        <el-skeleton :loading="isWeatherLoading" animated :rows="2">
          <template #default>
            <div class="weather-summary">
              <span class="big-emoji">{{ currentEmoji }}</span>
              <div>
                <p class="big-temp">{{ displayTemp }}{{ configStore.unitSymbol }}</p>
                <p class="weather-meta">
                  {{ weather.status }}
                  <template v-if="weather.humidity != null"> · 습도 {{ weather.humidity }}%</template>
                  <template v-if="nearestPrecipitationChance != null">
                    · 강수확률 {{ nearestPrecipitationChance }}%
                  </template>
                </p>
              </div>
            </div>

            <div v-if="forecast.length" class="forecast-strip">
              <div v-for="item in forecast" :key="item.time" class="forecast-item">
                <p class="time">{{ formatForecastTime(item.time) }}</p>
                <p class="emoji">{{ emojiOf(item) }}</p>
                <p class="f-temp">{{ convertTemp(item.temp, configStore.unit) }}°</p>
                <p class="pop">{{ item.precipitationChance }}%</p>
              </div>
            </div>
          </template>
        </el-skeleton>
      </BaseDashboardCard>

      <BaseDashboardCard v-if="!stadium.isDome" title="바람 · 타구 영향">
        <el-skeleton :loading="isWeatherLoading" animated :rows="2">
          <template #default>
            <WindIndicator
              v-if="weather.windDeg != null"
              :wind-deg="weather.windDeg"
              :speed="weather.windSpeed ?? 0"
              :cf-bearing="stadium.cfBearing"
            />
            <p v-else class="no-data">바람 데이터를 불러오지 못했습니다.</p>
          </template>
        </el-skeleton>
      </BaseDashboardCard>

      <BaseDashboardCard v-if="!stadium.isDome" title="시간대별 그늘 예상">
        <ShadeTimeline :stadium="stadium" :date="selectedDate || todayString" :sunset="weather.sunset" />
      </BaseDashboardCard>

      <BaseDashboardCard v-else title="돔구장">
        <p class="no-data">
          🏟️ 실내 돔구장이라 바람·햇빛의 영향을 받지 않습니다. 날씨와 관계없이 경기가 진행돼요.
        </p>
      </BaseDashboardCard>

      <BaseDashboardCard title="홈경기 일정">
        <el-empty
          v-if="gameDates.length === 0"
          description="보유한 일정 범위에 이 구장의 홈경기가 없습니다."
        />

        <template v-else>
          <DateSelector v-model="selectedDate" :dates="gameDates" :daily-weather="dailyWeather" />

          <el-skeleton :loading="isGameLoading" animated :rows="1">
            <template #default>
              <div v-if="game && !game.outOfRange" class="matchup">
                <span class="team away">{{ game.awayTeam }}</span>
                <span class="vs">vs</span>
                <span class="team home">{{ game.homeTeam }}</span>
                <span class="start-time">{{ game.startTime }} 시작</span>
              </div>
            </template>
          </el-skeleton>
        </template>
      </BaseDashboardCard>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--label-secondary);
}
.detail-image {
  margin-bottom: 24px;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 28px;
  min-width: 0;
}
.detail-header > div {
  min-width: 0;
}
.detail-header h1,
.teams,
.address {
  word-break: keep-all;
}
.detail-header h1 {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.8px;
  margin: 0 0 6px;
}
.teams {
  font-size: 15px;
  color: var(--label);
  margin: 0 0 4px;
}
.address {
  font-size: 13px;
  color: var(--label-secondary);
  margin: 0;
}
.fav-btn {
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  background: var(--surface-muted);
  color: var(--label);
  cursor: pointer;
  transition: background 0.2s ease;
}
.fav-btn.on {
  background: #ff9f0a;
  color: #fff;
}

/* 패널 공통 스타일(배경·라운드·그림자·제목)은 BaseDashboardCard.vue로 옮기고,
   이 화면은 <slot>에 넣을 내용물의 스타일만 갖는다 */

.no-data {
  font-size: 14px;
  color: var(--label-secondary);
  margin: 0;
  line-height: 1.6;
}
.weather-summary {
  display: flex;
  align-items: center;
  gap: 18px;
}
.big-emoji {
  font-size: 48px;
  line-height: 1;
}
.big-temp {
  font-size: 44px;
  font-weight: 200;
  letter-spacing: -2px;
  margin: 0;
  line-height: 1.1;
}
.weather-meta {
  font-size: 14px;
  color: var(--label-secondary);
  margin: 4px 0 0;
}

.forecast-strip {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--separator);
  max-width: 100%;
}
.forecast-strip::-webkit-scrollbar {
  display: none;
}
.forecast-item {
  flex: 1 0 auto;
  min-width: 60px;
  text-align: center;
  padding: 6px 4px;
  border-radius: var(--radius-sm);
}
.forecast-item p {
  margin: 2px 0;
  font-size: 12px;
}
.forecast-item .time {
  color: var(--label-secondary);
}
.forecast-item .emoji {
  font-size: 20px;
}
.forecast-item .f-temp {
  font-size: 14px;
  font-weight: 600;
}
.forecast-item .pop {
  color: var(--accent);
}

.matchup {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.3px;
  min-width: 0;
}
.matchup .vs {
  color: var(--label-secondary);
  font-weight: 400;
}
.start-time {
  margin-left: auto;
  font-size: 13px;
  font-weight: 500;
  color: var(--label-secondary);
  background: var(--surface-muted);
  padding: 5px 12px;
  border-radius: 999px;
  white-space: nowrap;
}

/* ── 모바일 대응 ───────────────────────────── */
@media (max-width: 640px) {
  .detail-image {
    margin-bottom: 18px;
    height: 180px;
  }
  .detail-header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }
  .detail-header h1 {
    font-size: 24px;
  }
  .big-emoji {
    font-size: 38px;
  }
  .big-temp {
    font-size: 36px;
  }
  .weather-meta {
    font-size: 13px;
  }
  .matchup {
    font-size: 16px;
    gap: 8px;
  }
  .start-time {
    margin-left: 0;
  }
}
</style>
