import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 직관 플래너 Store
// "이 경기 보러 갈까?" 싶은 경기를 담아두고, /plan 페이지에서 날씨를 한 번에 비교한다.
// 경기 하나는 (날짜 + 구장)으로 유일하게 식별된다. 한 구장에서 하루에 두 경기가 열리진 않기 때문.
export const usePlannerStore = defineStore('planner', () => {
  // ── state ──────────────────────────────
  // [{ date: '2026-08-15', stadiumId: 'stadium_01', homeTeam, awayTeam, startTime }, ...]
  const plans = ref([])

  // ── getters ────────────────────────────
  const planCount = computed(() => plans.value.length)

  // 날짜 오름차순으로 정렬된 목록 (담은 순서와 무관하게 일정 순으로 보여주기 위함)
  const sortedPlans = computed(() =>
    [...plans.value].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  )

  // 특정 경기가 이미 담겨 있는지 (인자를 받아야 하므로 함수를 반환하는 getter)
  const isPlanned = computed(() => (date, stadiumId) =>
    plans.value.some((p) => p.date === date && p.stadiumId === stadiumId)
  )

  // ── actions ────────────────────────────
  function addPlan(game) {
    if (!game?.date || !game?.stadiumId) return
    if (isPlanned.value(game.date, game.stadiumId)) return

    // 배열을 통째로 교체해서 참조가 바뀌도록 한다 (computed 재계산 보장)
    plans.value = [
      ...plans.value,
      {
        date: game.date,
        stadiumId: game.stadiumId,
        homeTeam: game.homeTeam ?? '',
        awayTeam: game.awayTeam ?? '',
        startTime: game.startTime ?? ''
      }
    ]
  }

  function removePlan(date, stadiumId) {
    plans.value = plans.value.filter((p) => !(p.date === date && p.stadiumId === stadiumId))
  }

  function togglePlan(game) {
    if (isPlanned.value(game.date, game.stadiumId)) {
      removePlan(game.date, game.stadiumId)
    } else {
      addPlan(game)
    }
  }

  function clearPlans() {
    plans.value = []
  }

  return { plans, planCount, sortedPlans, isPlanned, addPlan, removePlan, togglePlan, clearPlans }
})
