<script setup>
import { computed } from 'vue'
import { usePlannerStore } from '../stores/plannerStore'

const props = defineProps({
  // { date, stadiumId, homeTeam, awayTeam, startTime }
  game: { type: Object, required: true },
  // 'icon' = 아이콘만 (목록용), 'text' = 문구 포함 (상세용)
  variant: { type: String, default: 'icon' }
})

const plannerStore = usePlannerStore()

const planned = computed(() => plannerStore.isPlanned(props.game.date, props.game.stadiumId))

function toggle() {
  plannerStore.togglePlan(props.game)
}
</script>

<template>
  <!-- .stop: 목록 행이 RouterLink인 경우 담기 버튼 클릭으로 페이지가 이동하지 않도록 -->
  <button
    class="plan-btn"
    :class="[variant, { on: planned }]"
    :title="planned ? '직관 예정에서 빼기' : '직관 예정에 담기'"
    @click.stop.prevent="toggle"
  >
    <span class="mark">{{ planned ? '✓' : '+' }}</span>
    <span v-if="variant === 'text'" class="text">
      {{ planned ? '직관 예정에 담김' : '직관 예정에 담기' }}
    </span>
  </button>
</template>

<style scoped>
.plan-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--separator);
  background: var(--surface);
  color: var(--label-secondary);
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}
.plan-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.plan-btn.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.plan-btn:active {
  transform: scale(0.96);
}

.plan-btn.icon {
  width: 30px;
  height: 30px;
  justify-content: center;
  padding: 0;
  font-size: 16px;
  line-height: 1;
}
.plan-btn.text {
  padding: 9px 16px;
  font-size: 14px;
}
.mark {
  line-height: 1;
}
</style>
