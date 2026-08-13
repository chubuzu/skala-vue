<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchGamesByDate, getTodayString, getScheduleDates } from '../api/kboScheduleApi'
import { findStadiumById } from '../data/stadiums'
import { fetchDailySummary, hasApiKey } from '../api/weatherApi'
import { useUiStore } from '../stores/uiStore'
import DateSelector from '../components/DateSelector.vue'
import ComfortBadge from '../components/ComfortBadge.vue'
import AddToPlanButton from '../components/AddToPlanButton.vue'

const scheduleDates = getScheduleDates()
const hasApiKeySet = hasApiKey()
const uiStore = useUiStore()

// 오늘 경기가 있으면 오늘을, 없으면 오늘 이후 가장 가까운 경기일을 기본 선택
function pickInitialDate() {
  if (scheduleDates.length === 0) return ''
  const today = getTodayString()
  return scheduleDates.find((date) => date >= today) ?? scheduleDates[scheduleDates.length - 1]
}

const selectedDate = ref(pickInitialDate())
const games = ref([])
const isLoading = ref(true)

// { 구장id: { temp, humidity, windSpeed, precipitationChance } } — 선택한 날짜의 경기 시간대 예보
const gameDayWeather = ref({})

function stadiumName(stadiumId) {
  return findStadiumById(stadiumId)?.name ?? stadiumId
}

function isDome(stadiumId) {
  return Boolean(findStadiumById(stadiumId)?.isDome)
}

// 경기가 열리는 구장들의 '그날 저녁' 예보를 모아 직관 지수를 매긴다.
// 무료 예보는 5일치뿐이라, 그 범위를 벗어난 날짜는 지수를 표시하지 않는다.
async function loadGameDayWeather(dateStr, gameList) {
  gameDayWeather.value = {}
  if (!hasApiKeySet || !dateStr || gameList.length === 0) return

  const entries = await Promise.all(
    gameList.map(async (game) => {
      const stadium = findStadiumById(game.stadiumId)
      if (!stadium) return null
      try {
        const summary = await fetchDailySummary(stadium.lat, stadium.lon)
        const day = summary[dateStr]
        // evening이 없으면(예보 범위 밖) 지수를 만들지 않는다
        return day?.evening ? [game.stadiumId, day.evening] : null
      } catch (error) {
        console.error(`${stadium.name} 예보 조회 실패:`, error)
        return null
      }
    })
  )

  gameDayWeather.value = Object.fromEntries(entries.filter(Boolean))
}

async function loadGames(dateStr) {
  if (!dateStr) {
    games.value = []
    gameDayWeather.value = {}
    isLoading.value = false
    return
  }

  isLoading.value = true
  uiStore.startLoading()
  try {
    const result = await fetchGamesByDate(dateStr)
    games.value = result.games
    await loadGameDayWeather(dateStr, result.games)
  } finally {
    isLoading.value = false
    uiStore.stopLoading()
  }
}

onMounted(() => loadGames(selectedDate.value))
watch(selectedDate, (newDate) => loadGames(newDate))
</script>

<template>
  <div class="schedule-view">
    <header class="page-head">
      <h1>경기 일정</h1>
      <p class="subtitle">날짜를 선택하면 그날 열리는 경기를 모두 보여줍니다.</p>
    </header>

    <DateSelector v-model="selectedDate" :dates="scheduleDates" class="date-strip" />

    <el-skeleton :loading="isLoading" animated :rows="5">
      <template #default>
        <el-empty v-if="games.length === 0" description="이 날짜에는 예정된 경기가 없습니다." />

        <div v-else class="game-list">
          <RouterLink
            v-for="game in games"
            :key="game.stadiumId"
            :to="`/stadium/${game.stadiumId}`"
            class="game-row"
          >
            <div class="teams">
              <span class="team">{{ game.awayTeam }}</span>
              <span class="vs">vs</span>
              <span class="team">{{ game.homeTeam }}</span>
            </div>
            <div class="meta">
              <span class="stadium">{{ stadiumName(game.stadiumId) }}</span>
              <span class="time">{{ game.startTime }}</span>

              <!-- 예보 범위(5일) 안이거나 돔구장일 때만 직관 지수를 노출 -->
              <ComfortBadge
                v-if="gameDayWeather[game.stadiumId] || isDome(game.stadiumId)"
                :weather="gameDayWeather[game.stadiumId] ?? {}"
                :is-dome="isDome(game.stadiumId)"
                basis="game"
              />

              <AddToPlanButton
                :game="{
                  date: selectedDate,
                  stadiumId: game.stadiumId,
                  homeTeam: game.homeTeam,
                  awayTeam: game.awayTeam,
                  startTime: game.startTime
                }"
              />

              <span class="chevron">›</span>
            </div>
          </RouterLink>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.date-strip {
  margin-bottom: 24px;
}
.game-list {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.game-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  color: var(--label);
  border-bottom: 1px solid var(--separator);
  transition: background 0.15s ease;
}
.game-row:last-child {
  border-bottom: none;
}
.game-row:hover {
  opacity: 1;
  background: var(--surface-muted);
}
/* 행에서 가장 중요한 정보 = 대진 */
.teams {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.4px;
}
.vs {
  color: var(--label-tertiary);
  font-weight: 500;
  font-size: 13px;
}
.meta {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: var(--label-secondary);
}
.stadium {
  font-weight: 600;
  color: var(--label);
}
.time {
  font-variant-numeric: tabular-nums;
}
.chevron {
  font-size: 18px;
  opacity: 0.4;
}

@media (max-width: 640px) {
  .game-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 14px 16px;
  }
  .teams {
    font-size: 15px;
  }
  .meta {
    gap: 10px;
    font-size: 12px;
  }
  .chevron {
    display: none;
  }
}
</style>
