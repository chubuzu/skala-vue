<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { usePlannerStore } from '../stores/plannerStore'
import { findStadiumById } from '../data/stadiums'
import { fetchDailySummary, hasApiKey } from '../api/weatherApi'
import { getTodayString } from '../api/kboScheduleApi'
import { convertTemp } from '../utils/temperature'
import { comfortScore } from '../utils/comfortScore'
import { useConfigStore } from '../stores/configStore'
import { useUiStore } from '../stores/uiStore'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import ComfortBadge from '../components/ComfortBadge.vue'
import AddToPlanButton from '../components/AddToPlanButton.vue'

const plannerStore = usePlannerStore()
const configStore = useConfigStore()
const uiStore = useUiStore()
const hasApiKeySet = hasApiKey()
const today = getTodayString()

const isLoading = ref(false)
// { '구장id|날짜': { temp, humidity, windSpeed, precipitationChance } }
const weatherMap = ref({})

const keyOf = (plan) => `${plan.stadiumId}|${plan.date}`

// 담은 경기 + 날씨 + 직관 지수를 한 덩어리로 묶는다
const rows = computed(() =>
  plannerStore.sortedPlans.map((plan) => {
    const stadium = findStadiumById(plan.stadiumId)
    const weather = weatherMap.value[keyOf(plan)] ?? null
    const isDome = Boolean(stadium?.isDome)

    return {
      ...plan,
      stadiumName: stadium?.name ?? plan.stadiumId,
      isDome,
      weather,
      // 예보가 없고 돔도 아니면 점수를 만들지 않는다 (없는 정보를 지어내지 않기 위함)
      score: weather || isDome ? comfortScore(weather ?? {}, { isDome }) : null,
      isPast: plan.date < today
    }
  })
)

// 우천 취소 위험이 큰 순서 = 점수가 낮은 순서
const worstRow = computed(() => {
  const scored = rows.value.filter((r) => !r.isPast && r.score?.score != null && !r.isDome)
  if (scored.length < 2) return null
  return scored.reduce((worst, r) => (r.score.score < worst.score.score ? r : worst))
})

async function loadWeather() {
  if (!hasApiKeySet || plannerStore.plans.length === 0) {
    weatherMap.value = {}
    return
  }

  isLoading.value = true
  uiStore.startLoading()
  try {
    // 같은 구장을 여러 날짜로 담았을 수 있으므로 구장 단위로 한 번만 호출한다
    const stadiumIds = [...new Set(plannerStore.plans.map((p) => p.stadiumId))]

    const summaries = await Promise.all(
      stadiumIds.map(async (id) => {
        const stadium = findStadiumById(id)
        if (!stadium) return [id, null]
        try {
          return [id, await fetchDailySummary(stadium.lat, stadium.lon)]
        } catch (error) {
          console.error(`${stadium.name} 예보 조회 실패:`, error)
          return [id, null]
        }
      })
    )

    const byStadium = Object.fromEntries(summaries)
    const next = {}

    plannerStore.plans.forEach((plan) => {
      const evening = byStadium[plan.stadiumId]?.[plan.date]?.evening
      if (evening) next[keyOf(plan)] = evening
    })

    weatherMap.value = next
  } finally {
    isLoading.value = false
    uiStore.stopLoading()
  }
}

function formatDate(dateStr) {
  const [, month, day] = dateStr.split('-').map(Number)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][new Date(dateStr).getDay()]
  return `${month}월 ${day}일 (${weekday})`
}

onMounted(loadWeather)
// 경기를 담거나 빼면 예보를 다시 맞춘다
watch(() => plannerStore.plans.length, loadWeather)
</script>

<template>
  <div class="plan-view">
    <header class="page-head">
      <h1>직관 예정</h1>
      <p class="subtitle">담아둔 경기의 날씨를 한눈에 비교하고 어디로 갈지 정하세요.</p>
    </header>

    <el-empty
      v-if="rows.length === 0"
      description="아직 담은 경기가 없습니다. 경기 일정에서 + 버튼을 눌러 담아보세요."
    >
      <RouterLink to="/schedule">
        <el-button type="primary">경기 일정 보러가기</el-button>
      </RouterLink>
    </el-empty>

    <template v-else>
      <el-alert
        v-if="worstRow"
        :title="`${formatDate(worstRow.date)} ${worstRow.stadiumName} 경기가 관람 조건이 가장 아쉬워요. (${worstRow.score.reasons.join(', ')})`"
        type="warning"
        :closable="false"
        show-icon
        class="warn"
      />

      <BaseDashboardCard title="담은 경기">
        <template #actions>
          <button class="clear-btn" @click="plannerStore.clearPlans()">전체 비우기</button>
        </template>

        <el-skeleton :loading="isLoading" animated :rows="3">
          <template #default>
            <ul class="plan-list">
              <li v-for="row in rows" :key="keyOf(row)" class="plan-row" :class="{ past: row.isPast }">
                <div class="left">
                  <p class="date">
                    {{ formatDate(row.date) }}
                    <span v-if="row.isPast" class="past-tag">지난 경기</span>
                  </p>
                  <p class="teams">{{ row.awayTeam }} <span class="vs">vs</span> {{ row.homeTeam }}</p>
                  <RouterLink :to="`/stadium/${row.stadiumId}`" class="stadium-link">
                    {{ row.stadiumName }} · {{ row.startTime }} ›
                  </RouterLink>
                </div>

                <div class="right">
                  <template v-if="row.score">
                    <ComfortBadge :weather="row.weather ?? {}" :is-dome="row.isDome" basis="game" />
                    <p v-if="row.weather" class="weather-line">
                      {{ convertTemp(row.weather.temp, configStore.unit) }}{{ configStore.unitSymbol }}
                      · 강수 {{ row.weather.precipitationChance }}%
                    </p>
                  </template>
                  <p v-else class="no-forecast">예보 범위(5일) 밖</p>

                  <AddToPlanButton :game="row" />
                </div>
              </li>
            </ul>
          </template>
        </el-skeleton>
      </BaseDashboardCard>
    </template>
  </div>
</template>

<style scoped>
.warn {
  margin-bottom: 20px;
}
.clear-btn {
  border: none;
  background: transparent;
  color: var(--label-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
}
.clear-btn:hover {
  color: #c22f2f;
}

.plan-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.plan-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--separator);
  min-width: 0;
}
.plan-row:last-child {
  border-bottom: none;
}
.plan-row.past {
  opacity: 0.5;
}
.left {
  min-width: 0;
}
.date {
  font-size: 13px;
  font-weight: 600;
  color: var(--label-secondary);
  margin: 0 0 4px;
  font-variant-numeric: tabular-nums;
}
.past-tag {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--surface-muted);
  font-size: 11px;
}
.teams {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.3px;
  margin: 0 0 4px;
}
.vs {
  color: var(--label-secondary);
  font-weight: 400;
}
.stadium-link {
  font-size: 13px;
  color: var(--accent);
}
.right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.weather-line {
  font-size: 13px;
  color: var(--label-secondary);
  margin: 0;
  white-space: nowrap;
}
.no-forecast {
  font-size: 13px;
  color: var(--label-secondary);
  margin: 0;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .plan-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .right {
    flex-wrap: wrap;
  }
}
</style>
