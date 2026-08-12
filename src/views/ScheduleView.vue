<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchGamesByDate, getTodayString, getScheduleDates } from '../api/kboScheduleApi'
import { findStadiumById } from '../data/stadiums'
import DateSelector from '../components/DateSelector.vue'

const scheduleDates = getScheduleDates()

// 오늘 경기가 있으면 오늘을, 없으면 오늘 이후 가장 가까운 경기일을 기본 선택
function pickInitialDate() {
  if (scheduleDates.length === 0) return ''
  const today = getTodayString()
  return scheduleDates.find((date) => date >= today) ?? scheduleDates[scheduleDates.length - 1]
}

const selectedDate = ref(pickInitialDate())
const games = ref([])
const isLoading = ref(true)

function stadiumName(stadiumId) {
  return findStadiumById(stadiumId)?.name ?? stadiumId
}

async function loadGames(dateStr) {
  if (!dateStr) {
    games.value = []
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    const result = await fetchGamesByDate(dateStr)
    games.value = result.games
  } finally {
    isLoading.value = false
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
              <span class="chevron">›</span>
            </div>
          </RouterLink>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 20px;
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
.teams {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.3px;
}
.vs {
  color: var(--label-secondary);
  font-weight: 400;
}
.meta {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: var(--label-secondary);
}
.chevron {
  font-size: 18px;
  opacity: 0.4;
}

@media (max-width: 640px) {
  .page-head h1 {
    font-size: 26px;
  }
  .subtitle {
    font-size: 14px;
  }
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
